import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import {
  FmuProject,
  Options,
  ProjectGetProjectData,
  projectGetLockStatus,
  projectGetProject,
} from "#client";
import {
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
} from "#client/@tanstack/react-query.gen";
import { LockStatus } from "#client/types.gen";

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
            if (error.status === 401) {
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

  const { data: lockStatus } = useSuspenseQuery(
    queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        const { data } = await projectGetLockStatus({
          ...options,
          ...queryKey[0],
          signal,
          throwOnError: true,
        });

        return data;
      },
      queryKey: projectGetLockStatusQueryKey(options),
      refetchInterval: 60000, // 60000 refetch every 60 seconds
    }),
  );

  return {
    ...project,
    lockStatus: lockStatus,
  } as GetProject;
}
