import type { ChangeType } from "#client/types.gen";

export const FILE_LABELS: Record<string, string> = {
  "config.json": "Project configuration",
  "mappings.json": "Mappings",
};

const PATH_LABELS: Record<string, string> = {
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

function getFieldLabel(path: string): string | undefined {
  if (path in PATH_LABELS) {
    return PATH_LABELS[path];
  }

  // Prefix match for paths with sub-keys or array indices (longest match wins)
  const sortedKeys = Object.keys(PATH_LABELS).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (path.startsWith(`${key}.`) || path.startsWith(`${key}[`)) {
      return PATH_LABELS[key];
    }
  }

  return undefined;
}

function formatBriefDescription(change: string) {
  const compact = change.replace(/\s+/g, " ").trim();
  const withoutDiffPayload = compact
    .replace(/Old value:\s*[\s\S]*$/i, "")
    .replace(/New value:\s*[\s\S]*$/i, "")
    .replace(/\s*->\s*/g, " ")
    .trim();
  const concise = withoutDiffPayload || compact;

  if (concise.length <= 72) {
    return concise;
  }

  return `${concise.slice(0, 69)}...`;
}

export function formatEntryDescription(entry: {
  key: string;
  change_type: ChangeType;
  change: string;
}): string {
  const label = getFieldLabel(entry.key);
  if (label !== undefined) {
    const verb = CHANGE_TYPE_VERBS[entry.change_type];

    return `${verb} ${label}`;
  } else {
    return formatBriefDescription(entry.change);
  }
}
