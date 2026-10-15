import type {
  CacheResource,
  ListFieldDiff,
  ScalarFieldDiff,
} from "#client/types.gen";
import { emptyName } from "#utils/ui";

export type DiffKind = "added" | "removed" | "updated";
export type StructuredDiffEntry = ScalarFieldDiff | ListFieldDiff;

export const RESOURCE_LABELS: Record<CacheResource, string> &
  Partial<Record<string, string>> = {
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
    "validation.masterdata_smda": "SMDA masterdata validation",
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

const GROUPED_FIELD_PATHS: Record<string, string[] | undefined> = {
  "config.json": [
    "masterdata.smda.coordinate_system",
    "masterdata.smda.stratigraphic_column",
  ],
};

const SORTED_PATH_LABEL_KEYS = Object.fromEntries(
  Object.entries(PATH_LABELS).map(([resource, labels]) => [
    resource,
    Object.keys(labels ?? {}).sort((a, b) => b.length - a.length),
  ]),
) as Record<string, string[] | undefined>;

const SYSTEM_LABELS: Record<string, string> = {
  rms: "RMS",
  smda: "SMDA",
  simulator: "Simulator",
};

const MAPPING_METADATA_KEYS = new Set([
  "mapping_type",
  "source_system",
  "target_system",
]);

const MASTERDATA_PROPERTY_LABELS: Record<string, string> = {
  identifier: "Name",
  short_identifier: "Name",
  uuid: "UUID",
};

const ITEM_NAME_KEYS = [
  "identifier",
  "source_id",
  "target_id",
  "name",
  "uuid",
  "id",
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isListFieldDiff(
  diff: StructuredDiffEntry,
): diff is ListFieldDiff {
  return "added" in diff && "removed" in diff && "updated" in diff;
}

export function groupStructuredDiffEntries(
  resource: string,
  entries: StructuredDiffEntry[],
): StructuredDiffEntry[] {
  const groupedPaths = GROUPED_FIELD_PATHS[resource] ?? [];
  const groupedEntries = new Map<string, ScalarFieldDiff[]>();

  for (const entry of entries) {
    if (isListFieldDiff(entry)) continue;

    const groupedPath = groupedPaths.find((path) =>
      entry.field_path.startsWith(`${path}.`),
    );
    if (groupedPath === undefined) continue;

    const group = groupedEntries.get(groupedPath) ?? [];
    group.push(entry);
    groupedEntries.set(groupedPath, group);
  }

  const emittedGroups = new Set<string>();

  return entries.flatMap<StructuredDiffEntry>((entry) => {
    if (isListFieldDiff(entry)) return [entry];

    const groupedPath = groupedPaths.find((path) =>
      entry.field_path.startsWith(`${path}.`),
    );
    if (groupedPath === undefined) return [entry];
    if (emittedGroups.has(groupedPath)) return [];

    emittedGroups.add(groupedPath);
    const group = groupedEntries.get(groupedPath) ?? [];
    const values = (side: "before" | "after") =>
      Object.fromEntries(
        group.map((groupEntry) => [
          groupEntry.field_path.slice(groupedPath.length + 1),
          groupEntry[side],
        ]),
      );

    return [
      {
        field_path: groupedPath,
        before: values("before"),
        after: values("after"),
      },
    ];
  });
}

export function getFieldLabel(
  resource: string,
  path: string,
): string | undefined {
  const labels = PATH_LABELS[resource];
  if (!labels) return undefined;

  if (path in labels) return labels[path];

  for (const key of SORTED_PATH_LABEL_KEYS[resource] ?? []) {
    if (path.startsWith(`${key}.`) || path.startsWith(`${key}[`)) {
      return labels[key];
    }
  }

  return undefined;
}

export function formatFieldPath(resource: string, path: string): string {
  const label = getFieldLabel(resource, path);
  if (label !== undefined) return capitalize(label);

  return path
    .split(".")
    .map((part) => humanize(part))
    .join(" > ");
}

type InlineValueResult = {
  text: string;
  isSpecialValue: boolean;
};

export function formatInlineValue(value: unknown): InlineValueResult {
  if (value === null) return { text: emptyName, isSpecialValue: true };
  if (value === undefined) return { text: "(missing)", isSpecialValue: true };
  if (typeof value === "string") {
    return value === ""
      ? { text: "(empty string)", isSpecialValue: true }
      : { text: value, isSpecialValue: false };
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return { text: String(value), isSpecialValue: false };
  }
  if (Array.isArray(value)) {
    return value.length === 0
      ? { text: "(empty list)", isSpecialValue: true }
      : { text: `${String(value.length)} values`, isSpecialValue: false };
  }
  if (isRecord(value)) {
    const preferred = ITEM_NAME_KEYS.find((key) => key in value);
    if (preferred !== undefined) {
      return {
        text: `${preferred}: ${formatInlineValue(value[preferred]).text}`,
        isSpecialValue: false,
      };
    }

    const fieldCount = Object.keys(value).length;

    return {
      text: `(${String(fieldCount)} fields)`,
      isSpecialValue: fieldCount === 0,
    };
  }
  if (typeof value === "bigint") {
    return { text: value.toString(), isSpecialValue: false };
  }
  if (typeof value === "symbol") {
    return {
      text: value.description ? `symbol(${value.description})` : "symbol",
      isSpecialValue: false,
    };
  }

  return { text: "(unavailable)", isSpecialValue: true };
}

export function getListItemKey(item: Record<string, unknown>): string {
  const preferred = ITEM_NAME_KEYS.find((key) => key in item);
  if (preferred !== undefined) {
    return `${preferred}-${formatInlineValue(item[preferred]).text}`;
  }

  const pairs = Object.entries(item).map(
    ([key, value]) => `${key}:${formatInlineValue(value).text}`,
  );

  return pairs.join("|") || "empty-item";
}

export function formatUpdatedItemLabel(key: unknown): string {
  if (Array.isArray(key) && key.length === 4) {
    const [, sourceSystem, targetSystem, sourceId] = key as unknown[];

    return `${formatInlineValue(sourceId).text} (${formatSystemLabel(sourceSystem)} → ${formatSystemLabel(targetSystem)})`;
  }

  return `Item: ${formatInlineValue(key).text}`;
}

type ValuePanelKind = "added" | "removed" | "before" | "after";

type MappingContext = {
  mappingType: string;
  sourceSystem: string;
  targetSystem: string;
  relationType?: string;
};

function getMappingContext(
  value: Record<string, unknown>,
  itemKey?: unknown,
): MappingContext | undefined {
  const keyParts = Array.isArray(itemKey) ? (itemKey as unknown[]) : [];
  const mappingType = value.mapping_type ?? keyParts[0];
  const sourceSystem = value.source_system ?? keyParts[1];
  const targetSystem = value.target_system ?? keyParts[2];

  if (
    typeof mappingType !== "string" ||
    typeof sourceSystem !== "string" ||
    typeof targetSystem !== "string"
  ) {
    return undefined;
  }

  return {
    mappingType,
    sourceSystem,
    targetSystem,
    ...(typeof value.relation_type === "string"
      ? { relationType: value.relation_type }
      : {}),
  };
}

export function getVisibleRecordEntries({
  value,
  kind,
  counterpart,
  itemKey,
}: {
  value: Record<string, unknown>;
  kind: ValuePanelKind;
  counterpart?: Record<string, unknown>;
  itemKey?: unknown;
}): Array<[string, unknown]> {
  const mapping = getMappingContext(value, itemKey);

  return Object.entries(value).filter(([key, entryValue]) => {
    if (mapping && MAPPING_METADATA_KEYS.has(key)) return false;
    if ((kind === "added" || kind === "removed") && entryValue === null) {
      return false;
    }
    if (key !== "relation_type") return true;
    if (kind === "added" || kind === "removed") return false;

    return entryValue !== counterpart?.relation_type;
  });
}

export function formatPropertyLabel({
  key,
  value,
  counterpart,
  itemKey,
}: {
  key: string;
  value: Record<string, unknown>;
  counterpart?: Record<string, unknown>;
  itemKey?: unknown;
}): string {
  const mapping = getMappingContext(value, itemKey);
  if (!mapping) return MASTERDATA_PROPERTY_LABELS[key] ?? humanize(key);

  const mappingType = humanize(mapping.mappingType).toLowerCase();
  const sourceSystem = formatSystemLabel(mapping.sourceSystem);
  const targetSystem = formatSystemLabel(mapping.targetSystem);
  const relationType = mapping.relationType ?? counterpart?.relation_type;

  switch (key) {
    case "source_id":
      return `${sourceSystem} ${mappingType} name`;
    case "source_uuid":
      return `${sourceSystem} UUID`;
    case "target_id":
      return relationType === "alias"
        ? "Alias of"
        : `${targetSystem} ${mappingType} name`;
    case "target_uuid":
      return `${targetSystem} UUID`;
    case "relation_type":
      return "Status";
    default:
      return MASTERDATA_PROPERTY_LABELS[key] ?? humanize(key);
  }
}

export function formatPropertyValue({
  key,
  value,
  itemKey,
}: {
  key: string;
  value: unknown;
  itemKey?: unknown;
}): unknown {
  if (key !== "relation_type" || typeof value !== "string") return value;

  const context = getMappingContext({ relation_type: value }, itemKey);
  const targetSystem = formatSystemLabel(context?.targetSystem);

  switch (value) {
    case "unmappable":
      return `Cannot be mapped to ${targetSystem}`;
    case "primary":
      return `Mapped to ${targetSystem}`;
    case "alias":
      return "Alias";
    default:
      return humanize(value);
  }
}

export function getVisibleListFieldDiff(diff: ListFieldDiff): ListFieldDiff {
  return {
    ...diff,
    added: diff.added.filter((item) => !isSameSystemPrimaryMapping(item)),
    removed: diff.removed.filter((item) => !isSameSystemPrimaryMapping(item)),
    updated: diff.updated.filter(
      (item) =>
        !isSameSystemPrimaryMapping(
          { ...item.before, ...item.after },
          item.key,
        ),
    ),
  };
}

function isSameSystemPrimaryMapping(
  value: Record<string, unknown>,
  itemKey?: unknown,
): boolean {
  const context = getMappingContext(value, itemKey);

  return (
    context !== undefined &&
    context.sourceSystem === context.targetSystem &&
    context.relationType === "primary"
  );
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

function humanize(value: string): string {
  const withoutArrayIndex = value.replace(/\[\d+\]/g, "");
  const text = withoutArrayIndex.replace(/_/g, " ");

  return capitalize(text);
}

function formatSystemLabel(value: unknown): string {
  if (typeof value !== "string") return "target system";

  return SYSTEM_LABELS[value.toLowerCase()] ?? capitalize(value);
}
