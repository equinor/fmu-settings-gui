import type {
  DataSystem,
  InternalWellboreIdentifierMapping,
  InternalWellboreMappings,
  RmsWell,
} from "#client";
import {
  createElementMappings,
  createMutationValue,
  createProjectMappingsLookup,
  updatedElementMapping,
} from "#components/project/common/mapping/functions";
import type {
  ElementMapping,
  ElementMappings,
} from "#components/project/common/mapping/types";
import {
  emptyElementMapping,
  emptyElementMappingTarget,
  emptyElementMappingTargetUpdate,
} from "#components/project/common/mapping/utils";
import type { PendingImport } from "./types";

export const wellboreTargetSystems: DataSystem[] = ["simulator", "smda"];

function createWellboreMappingsLookup(
  mappings: InternalWellboreMappings,
): ElementMappings {
  return createProjectMappingsLookup("wellbore", "rms", wellboreTargetSystems, {
    wellbore: mappings,
  });
}

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
  const projectMappingsLookup = createWellboreMappingsLookup(mappings);

  return createElementMappings(
    "wellbore",
    wellboreTargetSystems,
    rmsWellbores,
    projectMappingsLookup,
    clearPlannedWellboreSmdaTarget,
  );
}

export function isRmsMapping(
  mapping: InternalWellboreIdentifierMapping,
  targetSystem: DataSystem,
) {
  return (
    mapping.source_system === "rms" && mapping.target_system === targetSystem
  );
}

export function prepareImportedMappings(
  importedMappings: InternalWellboreMappings,
  savedRmsWellboreNames: string[],
): PendingImport {
  const savedNames = new Set(savedRmsWellboreNames);
  const importedRmsWellboreNames = new Set(
    importedMappings
      .filter((mapping) => isRmsMapping(mapping, "simulator"))
      .map((mapping) => mapping.source_id),
  );

  return {
    mappings: importedMappings.filter((mapping) =>
      savedNames.has(mapping.source_id),
    ),
    excludedRmsWellboreNames: [...importedRmsWellboreNames]
      .filter((name) => !savedNames.has(name))
      .sort(),
  };
}

export function mergeImportedMappings(
  currentMappings: InternalWellboreMappings,
  importedMappings: InternalWellboreMappings,
) {
  const currentElementMappings = createWellboreMappingsLookup(currentMappings);
  const importedElementMappings =
    createWellboreMappingsLookup(importedMappings);
  const mergedElementMappings = { ...currentElementMappings };

  Object.entries(importedElementMappings).forEach(
    ([sourceId, importedElementMapping]) => {
      const importedSimulatorTarget = importedElementMapping.targets.simulator;
      if (importedSimulatorTarget === undefined) {
        return;
      }

      const currentElementMapping = currentElementMappings[sourceId] ?? {
        ...emptyElementMapping(wellboreTargetSystems),
        elementType: "wellbore",
        name: sourceId,
      };
      mergedElementMappings[sourceId] = updatedElementMapping(
        currentElementMapping,
        {
          simulator: {
            name: importedSimulatorTarget.name,
            uuid: importedSimulatorTarget.uuid,
          },
        },
      );
    },
  );

  return createMutationValue<InternalWellboreIdentifierMapping>(
    "wellbore",
    "rms",
    mergedElementMappings,
  );
}

export function removeSimulatorMappings(mappings: InternalWellboreMappings) {
  const elementMappings = createWellboreMappingsLookup(mappings);
  const mappingsWithoutSimulator = Object.fromEntries(
    Object.entries(elementMappings).map(([sourceId, elementMapping]) => [
      sourceId,
      updatedElementMapping(elementMapping, {
        simulator: emptyElementMappingTargetUpdate(),
      }),
    ]),
  );

  return createMutationValue<InternalWellboreIdentifierMapping>(
    "wellbore",
    "rms",
    mappingsWithoutSimulator,
  );
}
