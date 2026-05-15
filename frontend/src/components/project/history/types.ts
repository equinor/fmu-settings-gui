import type { CacheResource } from "#client/types.gen";

export type CacheEntry = {
  cacheId: string;
  label: string;
  dateTimeLabel: string;
  isAutoBackup: boolean;
};

export type DiffKind = "added" | "removed" | "updated";

export type SnapshotDeletionImpact = {
  resource: CacheResource;
  label: string;
  deleteCount: number;
};
