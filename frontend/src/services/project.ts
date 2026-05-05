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
  projectGetMappings,
  projectGetProject,
} from "#client";
import {
  projectGetLockStatusQueryKey,
  projectGetMappingsQueryKey,
  projectGetProjectQueryKey,
} from "#client/@tanstack/react-query.gen";
import type {
  LockStatus,
  MappingGroupResponse,
  ProjectGetMappingsData,
} from "#client/types.gen";
import { projectLockStatusRefetchInterval } from "#config";
import { HTTP_STATUS_UNAUTHORIZED } from "#utils/api";
import type { QueryServiceBase } from "#utils/query";

export type MappingsPathOptions = ProjectGetMappingsData["path"];

type GetProject = QueryServiceBase<FmuProject> & { lockStatus?: LockStatus };

type GetProjectMappings = QueryServiceBase<MappingGroupResponse[]>;

type MappingsPathsKeys = "stratigraphyRmsSmda";

export const mappingsPaths: Record<MappingsPathsKeys, MappingsPathOptions> = {
  stratigraphyRmsSmda: {
    mapping_type: "stratigraphy",
    source_system: "rms",
    target_system: "smda",
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

          return { status: true, data } as GetProject;
        } catch (error) {
          let text = "";
          let errorStatus: number | undefined;
          if (isAxiosError(error)) {
            errorStatus = error.status;
            // Use normal handling for unauthorized response
            if (error.status === HTTP_STATUS_UNAUTHORIZED) {
              return Promise.reject(error);
            }
            if (error.response?.data && "detail" in error.response.data) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              text = String(error.response.data.detail);
            }
          }

          return {
            status: false,
            text,
            errorStatus,
          } as GetProject;
        }
      },
      queryKey: projectGetProjectQueryKey(options),
    }),
  );

  const queryClient = useQueryClient();

  const { data: lockStatus } = useQuery({
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

  return {
    ...project,
    lockStatus,
  } as GetProject;
}

export function useProjectMappings(pathOptions: MappingsPathOptions) {
  const { data: mappings } = useSuspenseQuery(
    queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        try {
          const { data } = await projectGetMappings({
            ...{ path: pathOptions },
            ...queryKey[0],
            signal,
            throwOnError: true,
          });

          return { status: true, data } as GetProjectMappings;
        } catch (error) {
          let text = "";
          let errorStatus: number | undefined;
          if (isAxiosError(error)) {
            errorStatus = error.status;
            // Use normal handling for unauthorized response
            if (error.status === HTTP_STATUS_UNAUTHORIZED) {
              return Promise.reject(error);
            }
            if (error.response?.data && "detail" in error.response.data) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              text = String(error.response.data.detail);
            }
          }

          return {
            status: false,
            text,
            errorStatus,
          } as GetProjectMappings;
        }
      },
      queryKey: projectGetMappingsQueryKey({ path: pathOptions }),
    }),
  );

  return mappings;
}
