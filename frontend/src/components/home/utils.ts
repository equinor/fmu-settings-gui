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
  merge: "Merged",
  remove: "Removed",
  reset: "Reset",
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
  const label = getFieldLabel(entry.file, entry.key);
  if (label !== undefined) {
    const verb = CHANGE_TYPE_VERBS[entry.change_type];

    return `${verb} ${label}`;
  } else {
    return formatBriefDescription(entry.change);
  }
}
