import {
  queryOptions,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";

import {
  type FmuProject,
  type Options,
  type ProjectGetProjectData,
  projectGetLockStatus,
  projectGetProject,
} from "#client";
import {
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
  sessionGetSessionOptions,
} from "#client/@tanstack/react-query.gen";
import type { LockStatus, ProjectGetMappingsData } from "#client/types.gen";
import { projectLockStatusRefetchInterval } from "#config";
import {
  HTTP_STATUS_401_UNAUTHORIZED,
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import type { QueryServiceBase } from "#utils/query";

export type MappingsPathOptions = ProjectGetMappingsData["path"];

type GetProject = QueryServiceBase<FmuProject> & {
  lockStatus?: LockStatus;
  rmsExpiresAt?: string | null;
};

type MappingsPathsKeys = "stratigraphyRms" | "wellboreRms";

export const mappingsPaths: Record<MappingsPathsKeys, MappingsPathOptions> = {
  stratigraphyRms: {
    mapping_type: "stratigraphy",
    source_system: "rms",
  },
  wellboreRms: {
    mapping_type: "wellbore",
    source_system: "rms",
  },
} as const;

export function useProject(options?: Options<ProjectGetProjectData>) {
  const { data: project } = useSuspenseQuery(
    queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        try {
          const { data } = await projectGetProject({
            ...options,
            ...queryKey[0],
            signal,
            throwOnError: true,
          });

          return { status: true, data };
        } catch (error) {
          if (isAxiosError(error)) {
            const errorStatus = error.response?.status;
            // Use normal handling for unauthorized response
            if (errorStatus === HTTP_STATUS_401_UNAUTHORIZED) {
              throw error;
            }

            if (
              errorStatus === HTTP_STATUS_404_NOT_FOUND ||
              errorStatus === HTTP_STATUS_422_UNPROCESSABLE_CONTENT
            ) {
              let text = "";
              if (error.response?.data && "detail" in error.response.data) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                text = String(error.response.data.detail);
              }

              return {
                status: false,
                text,
                errorStatus,
              };
            }
          }

          throw error;
        }
      },
      queryKey: projectGetProjectQueryKey(options),
    }),
  );

  const queryClient = useQueryClient();

  const { data: lockStatus } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    ...queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        const previousLockStatus = queryClient.getQueryData<LockStatus>(
          projectGetLockStatusQueryKey(),
        );
        const { data } = await projectGetLockStatus({
          ...options,
          ...queryKey[0],
          signal,
          throwOnError: true,
        });

        if (previousLockStatus) {
          const currentIsReadOnly = !data.is_lock_acquired;
          const previousIsReadOnly = !previousLockStatus.is_lock_acquired;

          if (currentIsReadOnly && !previousIsReadOnly) {
            toast.info(
              "Project is now read-only. It can be opened for editing from the project overview page",
            );
          }

          if (!currentIsReadOnly && previousIsReadOnly) {
            toast.info("Project is now open for editing");
          }
        }

        return data;
      },
      queryKey: projectGetLockStatusQueryKey(options),
    }),
    refetchInterval: projectLockStatusRefetchInterval * 1000,
    enabled: project.status && project.data !== undefined,
  });

  const { data: sessionData } = useQuery({
    ...sessionGetSessionOptions(),
    enabled: project.status && project.data !== undefined,
  });

  const rmsExpiresAt = sessionData?.rms_expires_at;

  return {
    ...project,
    lockStatus,
    rmsExpiresAt,
  } as GetProject;
}
