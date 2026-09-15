import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "react-toastify";

import type {
  DataSystem,
  InternalStratigraphyIdentifierMapping,
  InternalStratigraphyMappings,
  InternalWellboreIdentifierMapping,
  InternalWellboreMappings,
  ProjectPutMappingsData,
  RmsWell,
} from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetMappingsOptions,
  projectGetMappingsQueryKey,
  projectPutMappingsMutation,
} from "#client/@tanstack/react-query.gen";
import { type MappingsPathOptions, mappingsPaths } from "#services/project";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";

type SaveWellboreMappingsOptions = {
  successMessage: string;
  onSuccess?: () => void;
};

export type SaveWellboreMappings = (
  mappings: InternalWellboreMappings,
  options: SaveWellboreMappingsOptions,
) => void;

type RmsIdentifierMapping =
  | InternalStratigraphyIdentifierMapping
  | InternalWellboreIdentifierMapping;

const dataSystemLabels: Record<DataSystem, string> = {
  rms: "RMS",
  smda: "SMDA",
  simulator: "Simulator",
  pdm: "PDM",
};

export function getRemovedMappingTexts(
  mappings: RmsIdentifierMapping[],
  retainedMappings: RmsIdentifierMapping[],
) {
  const retainedMappingSet = new Set(retainedMappings);

  return mappings
    .filter(
      (mapping) =>
        !isRmsSelfMapping(mapping) && !retainedMappingSet.has(mapping),
    )
    .map((mapping) => {
      const source = `${dataSystemLabels[mapping.source_system]}: ${mapping.source_id}`;
      const targetSystem = dataSystemLabels[mapping.target_system];
      if (mapping.relation_type === "unmappable") {
        return `${source} -> Does not exist in ${targetSystem}`;
      }

      const aliasLabel = mapping.relation_type === "alias" ? " (alias)" : "";

      return (
        `${source} -> ${targetSystem}: ${mapping.target_id ?? "(not set)"}` +
        aliasLabel
      );
    });
}

function isRmsMapping(mapping: RmsIdentifierMapping, targetSystem: DataSystem) {
  return (
    mapping.source_system === "rms" && mapping.target_system === targetSystem
  );
}

function getRmsMappingName(mapping: RmsIdentifierMapping) {
  if (mapping.source_system !== "rms") {
    return undefined;
  }

  if (isRmsMapping(mapping, "rms") && mapping.relation_type === "alias") {
    return mapping.target_id ?? undefined;
  }

  return mapping.source_id;
}

function isRmsSelfMapping(mapping: RmsIdentifierMapping) {
  return (
    isRmsMapping(mapping, "rms") &&
    mapping.relation_type === "primary" &&
    mapping.source_id === mapping.target_id
  );
}

export function pruneStratigraphyMappings(
  mappings: InternalStratigraphyMappings,
  retainedRmsNames: string[],
) {
  const retainedRmsNameSet = new Set(retainedRmsNames);

  return mappings.filter((mapping) => {
    const rmsName = getRmsMappingName(mapping);

    return rmsName === undefined || retainedRmsNameSet.has(rmsName);
  });
}

export function pruneWellboreMappings(
  mappings: InternalWellboreMappings,
  retainedRmsWellbores: RmsWell[],
) {
  const retainedWellboresByName = new Map(
    retainedRmsWellbores.map((wellbore) => [wellbore.name, wellbore]),
  );
  const filteredMappings = mappings.filter((mapping) => {
    const rmsName = getRmsMappingName(mapping);
    if (rmsName === undefined) {
      return true;
    }

    const retainedWellbore = retainedWellboresByName.get(rmsName);
    if (!retainedWellbore) {
      return false;
    }

    return !(retainedWellbore.planned && isRmsMapping(mapping, "smda"));
  });
  const namesWithRemainingMappings = new Set(
    filteredMappings.flatMap((mapping) => {
      const rmsName = getRmsMappingName(mapping);

      return rmsName !== undefined && !isRmsSelfMapping(mapping)
        ? [rmsName]
        : [];
    }),
  );

  return filteredMappings.filter((mapping) => {
    if (!isRmsSelfMapping(mapping)) {
      return true;
    }

    return (
      !retainedWellboresByName.get(mapping.source_id)?.planned ||
      namesWithRemainingMappings.has(mapping.source_id)
    );
  });
}

export function useMappingsMutation(
  path: MappingsPathOptions,
  errorPrefix: string,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...projectPutMappingsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetMappingsQueryKey({ path }),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message, { autoClose: false });
      }
    },
    meta: {
      errorPrefix,
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });
  const mutateMappings = (
    body: ProjectPutMappingsData["body"],
    options?: Parameters<typeof mutation.mutate>[1],
  ) => {
    mutation.mutate({ path, body }, options);
  };

  return {
    mutateMappings,
    isPending: mutation.isPending,
  };
}

export function useWellboreMappings() {
  const { data: projectMappings } = useSuspenseQuery(
    projectGetMappingsOptions({ path: mappingsPaths.wellboreRms }),
  );
  const mappings = useMemo(
    () => projectMappings.wellbore ?? [],
    [projectMappings.wellbore],
  );
  const mutation = useMappingsMutation(
    mappingsPaths.wellboreRms,
    "Could not save wellbore mappings",
  );

  const saveMappings: SaveWellboreMappings = (
    updatedMappings,
    { successMessage, onSuccess },
  ) => {
    mutation.mutateMappings(updatedMappings, {
      onSuccess: () => {
        toast.info(successMessage);
        onSuccess?.();
      },
    });
  };

  return {
    mappings,
    saveMappings,
    isSaving: mutation.isPending,
  };
}
