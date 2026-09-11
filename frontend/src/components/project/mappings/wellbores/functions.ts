import type {
  DataSystem,
  InternalWellboreIdentifierMapping,
  InternalWellboreMappings,
  MatchResult,
  RmsWell,
  SmdaWellHeader,
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
import type { AutomaticMatchProposal, PendingImport } from "./types";

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

  return createWellboreMutationValue(mergedElementMappings);
}

function createWellboreMutationValue(elementMappings: ElementMappings) {
  return createMutationValue<InternalWellboreIdentifierMapping>(
    "wellbore",
    "rms",
    elementMappings,
  );
}

function removeTargetMappings(
  elementMappings: ElementMappings,
  targetSystem: (typeof wellboreTargetSystems)[number],
) {
  const mappingsWithoutTarget = Object.fromEntries(
    Object.entries(elementMappings).map(([sourceId, elementMapping]) => [
      sourceId,
      updatedElementMapping(elementMapping, {
        [targetSystem]: emptyElementMappingTargetUpdate(),
      }),
    ]),
  );

  return createWellboreMutationValue(mappingsWithoutTarget);
}

export function removeSimulatorMappings(elementMappings: ElementMappings) {
  return removeTargetMappings(elementMappings, "simulator");
}

export function removeSmdaMappings(elementMappings: ElementMappings) {
  return removeTargetMappings(elementMappings, "smda");
}

export function createAutomaticMatchProposals(
  matchResults: MatchResult[],
  smdaHeaders: SmdaWellHeader[],
): AutomaticMatchProposal[] {
  const headersByIdentifier = new Map(
    smdaHeaders.map((header) => [header.unique_wellbore_identifier, header]),
  );

  return matchResults
    .map((result) => {
      const candidate = result.matches[0];
      if (!candidate || candidate.confidence === "low") {
        return undefined;
      }
      const header = headersByIdentifier.get(candidate.target);
      if (!header) {
        return undefined;
      }

      return {
        rmsWellboreName: result.source,
        smdaName: header.unique_wellbore_identifier,
        smdaUuid: header.wellbore_uuid,
        candidate,
        selected: candidate.score === 100,
      };
    })
    .filter((proposal) => proposal !== undefined);
}

export function toggleMatchProposal(
  proposals: AutomaticMatchProposal[],
  rmsWellboreName: string,
) {
  return proposals.map((proposal) => {
    if (proposal.rmsWellboreName !== rmsWellboreName) {
      return proposal;
    }

    return { ...proposal, selected: !proposal.selected };
  });
}

export function applyAutomaticMatchProposals(
  currentElementMappings: ElementMappings,
  proposals: AutomaticMatchProposal[],
) {
  const updatedElementMappings = { ...currentElementMappings };

  proposals
    .filter((proposal) => proposal.selected)
    .forEach((proposal) => {
      const currentElementMapping =
        currentElementMappings[proposal.rmsWellboreName];
      if (currentElementMapping === undefined) {
        return;
      }

      updatedElementMappings[proposal.rmsWellboreName] = updatedElementMapping(
        currentElementMapping,
        {
          smda: {
            name: proposal.smdaName,
            uuid: proposal.smdaUuid,
          },
        },
      );
    });

  return createWellboreMutationValue(updatedElementMappings);
}
