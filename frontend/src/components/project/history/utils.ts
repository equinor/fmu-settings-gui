import type { CacheResource } from "#client/types.gen";
import { displayDateTime } from "#utils/datetime";

export const RESOURCE_OPTIONS: CacheResource[] = [
  "config.json",
  "mappings.json",
];

// Filename format: {YYYYmmddTHHMMSS.ffffffZ}-{token}{suffix}
function parseCacheDate(cacheId: string): Date | null {
  const filename = cacheId.split("/").pop() ?? cacheId;
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d+)Z/.exec(
    filename,
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second, frac] = match;
  const ms = (frac ?? "").slice(0, 3).padEnd(3, "0");

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}Z`);
}

export function formatCacheDateTime(cacheId: string): string {
  const parsedDate = parseCacheDate(cacheId);
  if (!parsedDate) {
    return "Unknown date";
  }

  return displayDateTime(parsedDate.toISOString());
}

export function getSnapshotLabel(index: number): string {
  return `Snapshot ${index + 1}`;
}
