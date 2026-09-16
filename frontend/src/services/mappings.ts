import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "react-toastify";

import type { InternalWellboreMappings } from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetMappingsOptions,
  projectGetMappingsQueryKey,
  projectPutMappingsMutation,
} from "#client/@tanstack/react-query.gen";
import { mappingsPaths } from "#services/project";
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

export function useWellboreMappings() {
  const queryClient = useQueryClient();
  const { data: projectMappings } = useSuspenseQuery(
    projectGetMappingsOptions({ path: mappingsPaths.wellboreRms }),
  );
  const mappings = useMemo(
    () => projectMappings.wellbore ?? [],
    [projectMappings.wellbore],
  );
  const mutation = useMutation({
    ...projectPutMappingsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetMappingsQueryKey({
          path: mappingsPaths.wellboreRms,
        }),
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
      errorPrefix: "Could not save wellbore mappings",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const saveMappings: SaveWellboreMappings = (
    updatedMappings,
    { successMessage, onSuccess },
  ) => {
    mutation.mutate(
      { path: mappingsPaths.wellboreRms, body: updatedMappings },
      {
        onSuccess: () => {
          toast.info(successMessage);
          onSuccess?.();
        },
      },
    );
  };

  return {
    mappings,
    saveMappings,
    isSaving: mutation.isPending,
  };
}
