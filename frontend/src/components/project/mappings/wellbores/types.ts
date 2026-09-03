import type { ElementMappings } from "#components/project/common/mapping/types";

export type PendingImport = {
  mappings: ElementMappings;
  excludedRmsWellboreNames: string[];
};
