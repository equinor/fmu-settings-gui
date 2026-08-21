import type { DataSystem, InternalWellboreMappings, RmsWell } from "#client";
import {
  createElementMappings,
  createProjectMappingsLookup,
} from "#components/project/common/mapping/functions";
import type {
  ElementMapping,
  ElementMappings,
} from "#components/project/common/mapping/types";
import { emptyElementMappingTarget } from "#components/project/common/mapping/utils";

export const wellboreTargetSystems: DataSystem[] = ["simulator", "smda"];

function clearPlannedWellboreSmdaTarget(
  elementMapping: ElementMapping,
): ElementMapping {
  if (!elementMapping.meta.planned) {
    return elementMapping;
  }

  return {
    ...elementMapping,
    targets: {
      ...elementMapping.targets,
      smda: emptyElementMappingTarget(),
    },
  };
}

export function createWellboreElementMappings(
  rmsWellbores: RmsWell[],
  mappings: InternalWellboreMappings,
): ElementMappings {
  const projectMappingsLookup = createProjectMappingsLookup(
    "wellbore",
    "rms",
    wellboreTargetSystems,
    { wellbore: mappings },
  );

  return createElementMappings(
    "wellbore",
    wellboreTargetSystems,
    rmsWellbores,
    projectMappingsLookup,
    clearPlannedWellboreSmdaTarget,
  );
}
