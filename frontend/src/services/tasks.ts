import { useQuery } from "@tanstack/react-query";

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
  const { data: mappings } = useQuery({
    ...projectGetMappingsOptions({ path: mappingsPaths.stratigraphyRms }),
    enabled: project.status,
  });

  if (!project.status || !project.data) {
    return [];
  }

  const config = project.data.config;
  const zones = config.rms?.zones ?? [];
  const horizons = config.rms?.horizons ?? [];
  const mappedRmsIds = new Set(
    (mappings?.stratigraphy ?? [])
      .filter(
        (m) =>
          m.source_system === "rms" &&
          m.target_system === "smda" &&
          (m.relation_type === "primary" || m.relation_type === "unmappable"),
      )
      .map((m) => m.source_id),
  );

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
      done: !!config.rms?.path && (zones.length > 0 || horizons.length > 0),
      to: "/project/rms",
    },
    {
      id: "mappings",
      label: "Set stratigraphy mappings",
      done:
        (zones.length > 0 || horizons.length > 0) &&
        [...zones, ...horizons].every((item) => mappedRmsIds.has(item.name)),
      to: "/project/stratigraphy",
    },
  ];
}

export function useTaskPendingCount(): number {
  const tasks = useTaskList();

  return tasks.filter((t) => !t.done).length;
}
