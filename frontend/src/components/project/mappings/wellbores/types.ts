import type { InternalWellboreMappings } from "#client";

export type PendingImport = {
  mappings: InternalWellboreMappings;
  excludedRmsWellboreNames: string[];
};
