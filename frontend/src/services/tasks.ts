import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { projectGetMappings } from "#client";
import {
  projectGetMappingsQueryKey,
  userGetUserOptions,
} from "#client/@tanstack/react-query.gen";
import type { MappingGroup, Smda } from "#client/types.gen";
import { useProject } from "#services/project";
import type { FileRouteTypes } from "../routeTree.gen";

export type Task = {
  id: string;
  label: string;
  done: boolean;
  to: FileRouteTypes["to"];
};

function isMasterdataComplete(masterdata: Smda | null | undefined): boolean {
  return !!(
    masterdata &&
    masterdata.field.length > 0 &&
    masterdata.country.length > 0 &&
    masterdata.discovery.length > 0 &&
    masterdata.coordinate_system.identifier !== "(none)" &&
    masterdata.coordinate_system.uuid !== "0" &&
    masterdata.stratigraphic_column.identifier !== "(none)" &&
    masterdata.stratigraphic_column.uuid !== "0"
  );
}

export function useTaskList(): Task[] {
  const project = useProject();
  const { data: user } = useQuery(userGetUserOptions());
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
      label: "Set Model and Access Control",
      done: !!(config.model?.name && config.access?.asset.name),
      to: "/project",
    },
    {
      id: "smda-key",
      label: "Set SMDA Subscription Key",
      done: !!user?.user_api_keys.smda_subscription,
      to: "/user/keys",
    },
    {
      id: "masterdata",
      label: "Set Masterdata",
      done: isMasterdataComplete(config.masterdata?.smda),
      to: "/project/masterdata",
    },
    {
      id: "rms",
      label: "Set RMS Project and RMS Stratigraphy",
      done:
        !!config.rms?.path &&
        (config.rms.zones?.length ?? 0) > 0 &&
        (config.rms.horizons?.length ?? 0) > 0,
      to: "/project/rms",
    },
    {
      id: "mappings",
      label: "Set Mappings",
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
