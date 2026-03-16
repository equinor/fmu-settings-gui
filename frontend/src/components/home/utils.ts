import type { ChangeType } from "#client/types.gen";

export const FILE_LABELS: Record<string, string> = {
  "config.json": "Project configuration",
  "mappings.json": "Mappings",
};

export const PATH_LABELS: Record<string, string> = {
  "masterdata.smda.coordinate_system": "SMDA coordinate system",
  "masterdata.smda.stratigraphic_column": "SMDA stratigraphic column",
  "masterdata.smda.country": "SMDA countries",
  "masterdata.smda.discovery": "SMDA discoveries",
  "masterdata.smda.field": "SMDA fields",
  "masterdata.smda": "SMDA configuration",
  masterdata: "masterdata",
  "model.name": "model name",
  "model.revision": "model revision",
  "model.description": "model description",
  model: "model",
  "access.asset.name": "asset name",
  "access.asset": "asset",
  "access.classification": "classification",
  access: "access settings",
  cache_max_revisions: "max snapshot setting",
  "rms.path": "RMS project path",
  "rms.version": "RMS version",
  "rms.coordinate_system": "RMS coordinate system",
  "rms.zones": "RMS stratigraphic zones",
  "rms.horizons": "RMS horizons",
  "rms.wells": "RMS wells",
  rms: "RMS configuration",
};

export const CHANGE_TYPE_VERBS: Record<ChangeType, string> = {
  update: "Updated",
  remove: "Removed",
  add: "Added",
  reset: "Reset",
  merge: "Merged",
  copy: "Copied",
};

export function getFieldLabel(path: string): string | undefined {
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
  }

  return formatBriefDescription(entry.change);
}
