import type { Dispatch, SetStateAction } from "react";

import type { DataSystem, StratigraphicColumn } from "#client";

export type ElementType = "horizon" | "wellbore" | "zone";

type ElementMappingMeta = {
  planned?: boolean;
};

export type ElementMappingTarget = {
  unmappable: boolean;
  name: string;
  uuid: string;
};

export type ElementMapping = {
  elementType?: ElementType | undefined;
  name: string;
  aliases: string[];
  meta: ElementMappingMeta;
  targets: Partial<Record<DataSystem, ElementMappingTarget>>;
};

export type ElementMappings = Record<string, ElementMapping>;

export type ElementMappingTargetUpdate = Pick<
  ElementMappingTarget,
  "name" | "uuid"
>;

export type ElementMappingTargetUpdates = Partial<
  Record<DataSystem, ElementMappingTargetUpdate>
>;

export type MappingData = {
  elementMappings: ElementMappings;
  setElementMappings: Dispatch<SetStateAction<ElementMappings>>;
  stratigraphicColumn?: StratigraphicColumn | undefined;
  projectReadOnly: boolean;
  canEdit: boolean;
};

export type SpecialOptionId =
  | "empty"
  | "divider"
  | "unmappableHorizon"
  | "unmappableWellbore"
  | "unmappableZone";
