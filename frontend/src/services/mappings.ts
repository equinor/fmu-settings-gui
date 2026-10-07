import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "react-toastify";

import type { InternalWellboreMappings, ProjectPutMappingsData } from "#client";
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
