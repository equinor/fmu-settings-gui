import type {
  DataSystem,
  InternalWellboreMappings,
  RmsWell,
  SmdaWellHeader,
} from "#client";
import {
  createElementMappings,
  createProjectMappingsLookup,
} from "#components/project/common/mapping/functions";
import type {
  ElementMapping,
  ElementMappings,
  ElementMappingTargetUpdates,
} from "#components/project/common/mapping/types";
import { emptyElementMappingTarget } from "#components/project/common/mapping/utils";
import type { WellboreMappingFormValue } from "./types";

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

export function wellboreMappingTargetUpdates(
  elementMapping: ElementMapping,
  value: WellboreMappingFormValue,
  smdaHeaders: SmdaWellHeader[],
): ElementMappingTargetUpdates {
  const currentSmdaTarget = elementMapping.targets.smda;
  const selectedSmdaHeader = smdaHeaders.find(
    (header) => header.wellbore_uuid === value.smdaUuid,
  );

  return {
    simulator: {
      name: value.simulatorName.trim(),
      uuid: "",
    },
    smda: {
      name:
        selectedSmdaHeader?.unique_wellbore_identifier ??
        (currentSmdaTarget?.uuid === value.smdaUuid
          ? currentSmdaTarget.name
          : ""),
      uuid: value.smdaUuid,
    },
  };
}
