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
  emptyElementMappingTarget,
  emptyElementMappingTargetUpdate,
} from "#components/project/common/mapping/utils";
import type { PendingImport } from "./types";

export const wellboreTargetSystems = [
  "simulator",
  "smda",
] satisfies DataSystem[];

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

export function prepareImportedMappings(
  importedMappings: InternalWellboreMappings,
  currentElementMappings: ElementMappings,
): PendingImport {
  const importedElementMappings =
    createWellboreMappingsLookup(importedMappings);
  const currentRmsWellboreNames = new Set(Object.keys(currentElementMappings));

  return {
    mappings: Object.fromEntries(
      Object.entries(importedElementMappings).filter(([name]) =>
        currentRmsWellboreNames.has(name),
      ),
    ),
    excludedRmsWellboreNames: Object.keys(importedElementMappings)
      .filter((name) => !currentRmsWellboreNames.has(name))
      .sort(),
  };
}

export function mergeImportedMappings(
  currentElementMappings: ElementMappings,
  importedElementMappings: ElementMappings,
) {
  const mergedElementMappings = { ...currentElementMappings };

  Object.entries(importedElementMappings).forEach(
    ([sourceId, importedElementMapping]) => {
      const currentElementMapping = currentElementMappings[sourceId];
      const importedSimulatorTarget = importedElementMapping.targets.simulator;
      if (
        currentElementMapping === undefined ||
        importedSimulatorTarget === undefined
      ) {
        return;
      }

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

export function removeSimulatorMappings(elementMappings: ElementMappings) {
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
