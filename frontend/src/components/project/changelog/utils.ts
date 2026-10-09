import type {
  ChangeInfo,
  ChangeType,
  ListFieldDiff,
  ScalarFieldDiff,
} from "#client/types.gen";

export type DiffKind = "added" | "removed" | "updated";
export type StructuredDiffEntry = ScalarFieldDiff | ListFieldDiff;

export const FILE_LABELS: Record<string, string> = {
  "config.json": "Project configuration",
  "mappings.json": "Mappings",
};

const PATH_LABELS: Record<string, Record<string, string> | undefined> = {
  "config.json": {
    access: "access control",
    "access.asset": "asset",
    "access.asset.name": "asset name",
    "access.classification": "classification",
    cache_max_revisions: "max snapshots",
    created_at: "project creation date",
    created_by: "project creator",
    masterdata: "masterdata",
    "masterdata.smda": "SMDA",
    "masterdata.smda.coordinate_system": "SMDA coordinate system",
    "masterdata.smda.country": "SMDA countries",
    "masterdata.smda.discovery": "SMDA discoveries",
    "masterdata.smda.field": "SMDA fields",
    "masterdata.smda.stratigraphic_column": "SMDA stratigraphic column",
    model: "model information",
    "model.description": "model description",
    "model.name": "model name",
    "model.revision": "model revision",
    rms: "RMS project",
    "rms.coordinate_system": "RMS coordinate system",
    "rms.horizons": "RMS horizons",
    "rms.path": "RMS project path",
    "rms.version": "RMS version",
    "rms.wells": "RMS wells",
    "rms.zones": "RMS stratigraphic zones",
    "validation.rms_project": "RMS project validation",
    updated_at: "last updated date",
    updated_by: "last updated by",
  },
  "mappings.json": {
    created_at: "mapping creation date",
    created_by: "mapping creator",
    stratigraphy: "stratigraphy",
    updated_at: "last updated date",
    updated_by: "last updated by",
    wellbore: "wellbore",
  },
};

const SORTED_PATH_LABEL_KEYS: Record<string, string[] | undefined> = {
  "config.json": Object.keys(PATH_LABELS["config.json"] ?? {}).sort(
    (a, b) => b.length - a.length,
  ),
  "mappings.json": Object.keys(PATH_LABELS["mappings.json"] ?? {}).sort(
    (a, b) => b.length - a.length,
  ),
};

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

const TECHNICAL_FIELD_CHANGE_PATTERN =
  /^(Added|Copied|Initialized|Merged|Removed|Reset|Restored|Updated) field ['"]?([^'"]+)['"]?\.?$/i;

export function getChangeTypeLabel(changeType: ChangeType) {
  return CHANGE_TYPE_VERBS[changeType] || changeType;
}

export function getEntryKey(entry: ChangeInfo, index: number) {
  return [entry.timestamp ?? "no-time", index].join(":");
}

function getFieldLabel(file: string, path: string): string | undefined {
  const labels = PATH_LABELS[file];
  if (!labels) {
    return undefined;
  }

  if (path in labels) {
    return labels[path];
  }

  const sortedKeys = SORTED_PATH_LABEL_KEYS[file];
  if (!sortedKeys) {
    return undefined;
  }
  for (const key of sortedKeys) {
    if (path.startsWith(`${key}.`) || path.startsWith(`${key}[`)) {
      return labels[key];
    }
  }

  return undefined;
}

function formatBriefDescription(entry: ChangeInfo) {
  const change = entry.change;
  const compact = change.replace(/\s+/g, " ");
  const withoutDiffPayload = compact.replace(
    /\. (?:Old value|New value):.*/,
    "",
  );
  const technicalFieldChange =
    TECHNICAL_FIELD_CHANGE_PATTERN.exec(withoutDiffPayload);

  if (technicalFieldChange) {
    const verb = technicalFieldChange[1];
    const field = technicalFieldChange[2];
    if (verb === undefined || field === undefined) {
      return withoutDiffPayload;
    }

    const label = getFieldLabel(entry.file, field) ?? humanizeSettingKey(field);

    return `${verb} ${label}`;
  }

  const concise = withoutDiffPayload || compact;

  if (concise.length <= 72) {
    return concise;
  }

  return `${concise.slice(0, 69)}...`;
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
    const verb = CHANGE_TYPE_VERBS[entry.change_type];

    return `${verb} ${label}`;
  } else {
    return formatBriefDescription(entry);
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

export function isListFieldDiff(
  diff: StructuredDiffEntry,
): diff is ListFieldDiff {
  return "added" in diff && "removed" in diff && "updated" in diff;
}

export function formatFieldPath(path: string): string {
  return path.split(".").join(" > ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatInlineValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "(missing)";
  if (typeof value === "string") return value === "" ? "(empty string)" : value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0
      ? "(empty list)"
      : `${String(value.length)} values`;
  }
  if (isRecord(value)) {
    const preferred = [
      "identifier",
      "source_id",
      "target_id",
      "name",
      "uuid",
      "id",
    ].find((key) => key in value);
    if (preferred !== undefined) {
      return `${preferred}: ${formatInlineValue(value[preferred])}`;
    }

    return `(${String(Object.keys(value).length)} fields)`;
  }

  return "(unavailable)";
}

export function getListItemKey(item: Record<string, unknown>): string {
  return Object.entries(item)
    .map(([key, value]) => `${key}:${formatInlineValue(value)}`)
    .join("|");
}

export function formatUpdatedItemLabel(key: unknown): string {
  if (Array.isArray(key) && key.length === 4) {
    const [mappingType, sourceSystem, targetSystem, sourceId] =
      key.map(formatInlineValue);
    const formattedMappingType =
      mappingType === undefined ? "Mapping" : capitalize(mappingType);

    return `${formattedMappingType} mapping: ${sourceId} (${sourceSystem} to ${targetSystem})`;
  }

  return `Item: ${formatInlineValue(key)}`;
}

export function getScalarDiffKind(diff: ScalarFieldDiff): DiffKind {
  const beforeMissing = diff.before === null || diff.before === undefined;
  const afterMissing = diff.after === null || diff.after === undefined;

  if (beforeMissing && !afterMissing) return "added";
  if (!beforeMissing && afterMissing) return "removed";

  return "updated";
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
    const counts = listDiffs.reduce(
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
    if (scalarDiffs.every((diff) => diff.before === null)) {
      return `Set ${label}`;
    }
    if (scalarDiffs.every((diff) => diff.after === null)) {
      return `Cleared ${label}`;
    }
  }

  return `Updated ${label}`;
}
