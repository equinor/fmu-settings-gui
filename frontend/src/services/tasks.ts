import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { projectGetMappings } from "#client";
import { projectGetMappingsQueryKey } from "#client/@tanstack/react-query.gen";
import type { MappingGroup } from "#client/types.gen";
import { useProject } from "#services/project";
import type { FileRouteTypes } from "../routeTree.gen";

export type Task = {
  id: string;
  label: string;
  done: boolean;
  to: FileRouteTypes["to"];
};

export function useTaskList(): Task[] {
  const project = useProject();
  const projectPath = project.data?.path;
  const mappingsPath = {
    mapping_type: "stratigraphy" as const,
    source_system: "rms" as const,
    target_system: "smda" as const,
  };
  const { data: mappings = [] } = useQuery<MappingGroup[]>({
    queryKey: projectGetMappingsQueryKey({
      path: mappingsPath,
    }),
    queryFn: async ({ signal }) => {
      try {
        const { data } = await projectGetMappings({
          path: mappingsPath,
          signal,
          throwOnError: true,
        });

        return data;
      } catch (error) {
        if (isAxiosError(error) && error.status === 404) {
          return [];
        }

        throw error instanceof Error
          ? error
          : new Error("Error getting mappings");
      }
    },
    enabled: !!projectPath,
    retry: false,
  });

  if (!project.status || !project.data) {
    return [];
  }

  const config = project.data.config;

  return [
    {
      id: "model",
      label: "Set model information and access control",
      done: !!(config.model?.name && config.access?.asset.name),
      to: "/project",
    },
    {
      id: "masterdata",
      label: "Set masterdata",
      done: !!config.masterdata?.smda,
      to: "/project/masterdata",
    },
    {
      id: "rms",
      label: "Set RMS project and stratigraphy",
      done:
        !!config.rms?.path &&
        (config.rms.zones?.length ?? 0) > 0 &&
        (config.rms.horizons?.length ?? 0) > 0,
      to: "/project/rms",
    },
    {
      id: "mappings",
      label: "Set stratigraphy mappings",
      done: mappings.length > 0,
      // TODO: update `to` when the mappings page is implemented
      to: "/project",
    },
  ];
}

export function useTaskPendingCount(): number {
  const tasks = useTaskList();

  return tasks.filter((t) => !t.done).length;
}
