import type { Dispatch, SetStateAction } from "react";

import type { StratigraphicColumn } from "#client";
import type {
  ElementMappings,
  ElementType,
} from "../../mappings/stratigraphy/types";

export type MappingData = {
  elementMappings: ElementMappings;
  setElementMappings: Dispatch<SetStateAction<ElementMappings>>;
  stratigraphicColumn?: StratigraphicColumn | undefined;
  projectReadOnly: boolean;
  canEdit: boolean;
};

export type UnmappedElements = Record<ElementType, string[]>;
