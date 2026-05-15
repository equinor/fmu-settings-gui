import type { StratigraphicUnit } from "#client";

export type ElementType = "horizon" | "zone";

export type ElementMapping = {
  elementType?: ElementType;
  rmsName: string;
  unmappable: boolean;
  smdaName: string;
  smdaUuid: string;
  aliases: string[];
};

export type ElementMappings = Record<string, ElementMapping>;

export type StratUnitRelation = Pick<
  StratigraphicUnit,
  "identifier" | "uuid"
> & {
  children: StratUnitRelation[];
};

export type SpecialOptionId = "empty" | "divider" | "unmappableZone";
