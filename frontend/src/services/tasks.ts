import { useSuspenseQuery } from "@tanstack/react-query";

import { projectGetMappingsOptions } from "#client/@tanstack/react-query.gen";
import { mappingsPaths, useProject } from "#services/project";
import type { FileRouteTypes } from "../routeTree.gen";

export type Task = {
  id: string;
  label: string;
  done: boolean;
  to: FileRouteTypes["to"];
};

export function useTaskList(): Task[] {
  const project = useProject();
  const { data: mappings } = useSuspenseQuery(
    projectGetMappingsOptions({ path: mappingsPaths.stratigraphyRms }),
  );

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
      done:
        (mappings.stratigraphy ?? []).findIndex(
          (mapping) =>
            mapping.source_system === "rms" && mapping.target_system === "smda",
        ) >= 0,
      to: "/project/stratigraphy",
    },
  ];
}

export function useTaskPendingCount(): number {
  const tasks = useTaskList();

  return tasks.filter((t) => !t.done).length;
}
