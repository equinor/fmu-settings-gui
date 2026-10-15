import type {
  ChangeInfo,
  ChangeType,
  ScalarFieldDiff,
} from "#client/types.gen";
import {
  getFieldLabel,
  getScalarDiffKind,
  getVisibleListFieldDiff,
  isListFieldDiff,
} from "#components/project/common/structuredDiff/utils";

const CHANGE_TYPE_VERBS: Record<ChangeType, string> = {
  add: "Added",
  copy: "Copied",
  init: "Initialized",
  merge: "Merged",
  remove: "Removed",
  reset: "Reset",
  restore: "Restored",
  update: "Updated",
};

export function getChangeTypeLabel(changeType: ChangeType) {
  return CHANGE_TYPE_VERBS[changeType] || changeType;
}

export function getEntryKey(entry: ChangeInfo, index: number) {
  return [entry.timestamp ?? "no-time", index].join(":");
}

export function formatEntryDescription(entry: ChangeInfo): string {
  if (entry.change_type === "init") {
    return "Initialized FMU Settings project";
  }

  const structuredDescription = formatStructuredDescription(entry);
  if (structuredDescription !== undefined) {
    return structuredDescription;
  }

  const label = formatSettingLabel(entry);
  if (label !== undefined) {
    const verb = getChangeTypeLabel(entry.change_type);

    return `${verb} ${label}`;
  } else {
    return entry.change;
  }
}

export function formatSettingLabel(entry: ChangeInfo): string | undefined {
  if (!entry.key) {
    return undefined;
  }

  return getFieldLabel(entry.file, entry.key) ?? humanizeSettingKey(entry.key);
}

function humanizeSettingKey(key: string): string {
  const lastSegment = key.split(".").at(-1) ?? key;
  const withoutArrayIndex = lastSegment.replace(/\[\d+\]/g, "");

  return withoutArrayIndex.replace(/_/g, " ");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStructuredDescription(entry: ChangeInfo): string | undefined {
  const diffs = entry.structured_diff;
  const label = formatSettingLabel(entry);
  if (!diffs?.length || label === undefined) return undefined;

  const listDiffs = diffs.filter(isListFieldDiff);
  if (listDiffs.length === diffs.length) {
    const counts = listDiffs.map(getVisibleListFieldDiff).reduce(
      (total, diff) => ({
        added: total.added + diff.added.length,
        removed: total.removed + diff.removed.length,
        updated: total.updated + diff.updated.length,
      }),
      { added: 0, removed: 0, updated: 0 },
    );
    const summary = [
      counts.added > 0 ? `${String(counts.added)} added` : undefined,
      counts.removed > 0 ? `${String(counts.removed)} removed` : undefined,
      counts.updated > 0 ? `${String(counts.updated)} updated` : undefined,
    ]
      .filter((part): part is string => part !== undefined)
      .join(", ");

    if (summary) {
      const subject =
        entry.file === "mappings.json" && !label.endsWith("mappings")
          ? `${label} mappings`
          : label;

      return `${capitalize(subject)}: ${summary}`;
    }
  }

  const scalarDiffs = diffs.filter(
    (diff): diff is ScalarFieldDiff => !isListFieldDiff(diff),
  );
  if (scalarDiffs.length === diffs.length) {
    if (scalarDiffs.every((diff) => getScalarDiffKind(diff) === "added")) {
      return `Set ${label}`;
    }
    if (scalarDiffs.every((diff) => getScalarDiffKind(diff) === "removed")) {
      return `Cleared ${label}`;
    }
  }

  return `Updated ${label}`;
}
