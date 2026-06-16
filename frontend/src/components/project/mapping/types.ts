import type { Dispatch, SetStateAction } from "react";

import type { StratigraphicColumn } from "#client";
import type { ElementMappings } from "../stratigraphy/types";

export type MappingData = {
  elementMappings: ElementMappings;
  setElementMappings: Dispatch<SetStateAction<ElementMappings>>;
  stratigraphicColumn?: StratigraphicColumn;
  projectReadOnly: boolean;
  canEdit: boolean;
};
