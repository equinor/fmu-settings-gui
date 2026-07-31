import type { MatchCandidate } from "#client";
import type { ElementMappings } from "#components/project/common/mapping/types";

export type DisplayedMatchQuality = "Exact" | "High" | "Medium";

export type AutomaticMatchProposal = {
  rmsWellboreName: string;
  smdaName: string;
  smdaUuid: string;
  candidate: MatchCandidate;
  selected: boolean;
};

export type PendingImport = {
  mappings: ElementMappings;
  excludedRmsWellboreNames: string[];
};
