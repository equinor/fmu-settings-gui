import type { StratigraphicUnit } from "#client";

export type StratUnitRelation = Pick<
  StratigraphicUnit,
  "identifier" | "uuid"
> & {
  children: StratUnitRelation[];
};
