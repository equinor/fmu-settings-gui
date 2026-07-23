import type { ChangeInfo, ChangeType } from "#client/types.gen";

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
  },
  "mappings.json": {
    stratigraphy: "stratigraphy",
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

export function getTypeLabel(changeType: ChangeType) {
  if (changeType === "update") {
    return "Modified";
  }

  return CHANGE_TYPE_VERBS[changeType];
}

function getFieldLabel(file: string, path: string): string | undefined {
  const labels = PATH_LABELS[file];
  if (!labels) {
    return undefined;
  }

  if (path in labels) {
    return labels[path];
  }

  // Prefix match for paths with sub-keys or array indices (longest match wins)
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

function formatBriefDescription(change: string) {
  const compact = change.replace(/\s+/g, " ");
  const withoutDiffPayload = compact.replace(/\. Old value:.*/, "");
  const concise = withoutDiffPayload || compact;

  if (concise.length <= 72) {
    return concise;
  }

  return `${concise.slice(0, 69)}...`;
}

export function formatEntryDescription(entry: ChangeInfo): string {
  if (entry.change_type === "init") {
    return "Initialized FMU settings project";
  }

  const label = getFieldLabel(entry.file, entry.key);
  if (label !== undefined) {
    const verb = CHANGE_TYPE_VERBS[entry.change_type];

    return `${verb} ${label}`;
  } else {
    return formatBriefDescription(entry.change);
  }
}

export function formatChangedField(entry: ChangeInfo): string {
  const field = entry.key || entry.path;

  if (!field) {
    return "Unknown field";
  }

  return field;
}

export type ParsedChangeDetails = {
  raw: string;
  summary?: string;
  oldValue?: string;
  newValue?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSerializedValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    // Some changelog payloads may come from Python-style repr strings.
  }

  try {
    return JSON.parse(
      value
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/'/g, '"'),
    ) as unknown;
  } catch {
    return undefined;
  }
}

function getValueByPath(value: unknown, pathParts: string[]) {
  let current = value;

  for (const part of pathParts) {
    if (!isRecord(current) || !(part in current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function getNestedChangedValue(value: unknown, fieldPath: string) {
  const parts = fieldPath.split(".").filter(Boolean);

  for (let index = 0; index < parts.length; index += 1) {
    const nestedValue = getValueByPath(value, parts.slice(index));
    if (nestedValue !== undefined) {
      return nestedValue;
    }
  }

  return undefined;
}

function formatDetailedValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "(empty)";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatChangeValue(value: string, fieldPath?: string): string {
  const parsedValue = parseSerializedValue(value);

  if (parsedValue === undefined || !fieldPath) {
    return value.trim();
  }

  const nestedValue = getNestedChangedValue(parsedValue, fieldPath);

  return formatDetailedValue(nestedValue ?? parsedValue);
}

export function parseChangeDetails(
  change: string,
  fieldPath?: string,
): ParsedChangeDetails {
  const details = change.trim();

  if (!details) {
    return { raw: "No detailed change information available." };
  }

  const oldValueIndex = details.indexOf("Old value:");
  const newValueIndex = details.indexOf("New value:");

  if (
    oldValueIndex !== -1 &&
    newValueIndex !== -1 &&
    oldValueIndex < newValueIndex
  ) {
    return {
      raw: details,
      summary: details
        .slice(0, oldValueIndex)
        .replace(/\.\s*$/, "")
        .trim(),
      oldValue: formatChangeValue(
        details
          .slice(oldValueIndex + "Old value:".length, newValueIndex)
          .replace(/\.\s*$/, "")
          .trim(),
        fieldPath,
      ),
      newValue: formatChangeValue(
        details.slice(newValueIndex + "New value:".length).trim(),
        fieldPath,
      ),
    };
  }

  return { raw: details };
}

export function formatChangeDetails(
  change: string,
  fieldPath?: string,
): string {
  const details = parseChangeDetails(change, fieldPath);

  if (details.oldValue !== undefined || details.newValue !== undefined) {
    return [
      details.summary,
      `- ${formatChangeValue(details.oldValue ?? "", fieldPath)}`,
      `+ ${formatChangeValue(details.newValue ?? "", fieldPath)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return details.raw;
}
