import type {
  CacheResource,
  ListFieldDiff,
  ScalarFieldDiff,
} from "#client/types.gen";
import { displayDateTime } from "#utils/datetime";
import type { DiffKind } from "./Viewer.style";

export const RESOURCE_OPTIONS: CacheResource[] = [
  "config.json",
  "mappings.json",
];
export const RESOURCE_LABELS: Record<CacheResource, string> = {
  "config.json": "Project Configuration",
  "mappings.json": "Mappings",
};
export const ITEM_NAME_KEYS = [
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
  diff: ScalarFieldDiff | ListFieldDiff,
): diff is ListFieldDiff {
  return "added" in diff && "removed" in diff && "updated" in diff;
}

// Filename format: {YYYYmmddTHHMMSS.ffffffZ}-{token}{suffix}
function parseCacheDate(cacheId: string): Date | null {
  const filename = cacheId.split("/").pop() ?? cacheId;
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d+)Z/.exec(
    filename,
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second, frac] = match;
  const ms = frac.slice(0, 3).padEnd(3, "0");

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}Z`);
}

export function formatCacheDateTime(cacheId: string): string {
  const parsedDate = parseCacheDate(cacheId);
  if (!parsedDate) {
    return "Unknown date";
  }

  return displayDateTime(parsedDate.toISOString());
}

export function formatFieldPath(path: string): string {
  return path.split(".").join(" > ");
}

export function formatInlineValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "(missing)";
  }
  if (typeof value === "string") {
    return value === "" ? "(empty string)" : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0
      ? "(empty list)"
      : `${String(value.length)} values`;
  }
  if (isRecord(value)) {
    const preferred = ITEM_NAME_KEYS.find((key) => key in value);
    if (preferred !== undefined) {
      return `${preferred}: ${formatInlineValue(value[preferred])}`;
    }

    return `(${String(Object.keys(value).length)} fields)`;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "symbol") {
    return value.description ? `symbol(${value.description})` : "symbol";
  }

  return "(unavailable)";
}

export function getListItemKey(item: Record<string, unknown>): string {
  const preferred = ITEM_NAME_KEYS.find((key) => key in item);
  if (preferred !== undefined) {
    return `${preferred}-${formatInlineValue(item[preferred])}`;
  }

  const pairs = Object.entries(item).map(
    ([key, value]) => `${key}:${formatInlineValue(value)}`,
  );

  return pairs.join("|") || "empty-item";
}

export function getScalarDiffKind(diff: ScalarFieldDiff): DiffKind {
  const beforeMissing = diff.before === null || diff.before === undefined;
  const afterMissing = diff.after === null || diff.after === undefined;

  if (beforeMissing && !afterMissing) {
    return "added";
  }
  if (!beforeMissing && afterMissing) {
    return "removed";
  }

  return "updated";
}

export function getSnapshotLabel(index: number): string {
  return `Snapshot ${index + 1}`;
}
