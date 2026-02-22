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
} from "#client/@tanstack/react-query.gen";
import type { LockStatus } from "#client/types.gen";
import { projectLockStatusRefetchInterval } from "#config";
import { HTTP_STATUS_UNAUTHORIZED } from "#utils/api";

type GetProject = {
  status: boolean;
  text?: string;
  data?: FmuProject;
  lockStatus?: LockStatus;
};

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
          if (isAxiosError(error)) {
            // Use normal handling for unauthorized response
            if (error.status === HTTP_STATUS_UNAUTHORIZED) {
              return Promise.reject(error);
            }
            if (error.response?.data && "detail" in error.response.data) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              text = String(error.response.data.detail);
            }
          }

          return { status: false, text } as GetProject;
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
    refetchInterval: projectLockStatusRefetchInterval,
    enabled: project.status && project.data !== undefined,
  });

  return {
    ...project,
    lockStatus,
  } as GetProject;
}
