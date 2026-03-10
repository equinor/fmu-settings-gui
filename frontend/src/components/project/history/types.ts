export type CacheEntry = {
  cacheId: string;
  label: string;
  dateTimeLabel: string;
  isAutoBackup: boolean;
};

export type DiffKind = "added" | "removed" | "updated";
