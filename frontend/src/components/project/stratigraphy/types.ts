import type { StratigraphicUnit } from "#client";

export type ZoneMapping = {
  rmsName: string;
  unmappable: boolean;
  smdaName: string;
  smdaUuid: string;
  aliases: string[];
};

export type ZoneMappings = Record<string, ZoneMapping>;

export type StratUnitRelation = Pick<
  StratigraphicUnit,
  "identifier" | "uuid"
> & {
  children: StratUnitRelation[];
};

export type SpecialOptionId = "empty" | "divider" | "unmappableZone";
