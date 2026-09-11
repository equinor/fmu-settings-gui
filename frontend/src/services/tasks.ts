import { useQuery } from "@tanstack/react-query";

import type {
  InternalStratigraphyIdentifierMapping,
  InternalWellboreIdentifierMapping,
} from "#client";
import { projectGetMappingsOptions } from "#client/@tanstack/react-query.gen";
import { mappingsPaths, useProject } from "#services/project";
import type { FileRouteTypes } from "../routeTree.gen";

function getCompletedRmsMappingSourceIds(
  mappings: (
    | InternalStratigraphyIdentifierMapping
    | InternalWellboreIdentifierMapping
  )[],
): Set<string> {
  return new Set(
    mappings
      .filter(
        (mapping) =>
          mapping.source_system === "rms" &&
          mapping.target_system === "smda" &&
          (mapping.relation_type === "primary" ||
            mapping.relation_type === "unmappable"),
      )
      .map((mapping) => mapping.source_id),
  );
}

export type Task = {
  id: string;
  label: string;
  done: boolean;
  to: FileRouteTypes["to"];
};

export function useTaskList(): Task[] {
  const project = useProject();
  const rmsWellbores = project.data?.config.rms?.wells ?? [];
  const nonPlannedRmsWellboreNames = rmsWellbores
    .filter((wellbore) => !wellbore.planned)
    .map((wellbore) => wellbore.name);
  const { data: stratigraphyMappings } = useQuery({
    ...projectGetMappingsOptions({ path: mappingsPaths.stratigraphyRms }),
    enabled: project.status,
  });
  const { data: wellboreMappings } = useQuery({
    ...projectGetMappingsOptions({ path: mappingsPaths.wellboreRms }),
    enabled: project.status && nonPlannedRmsWellboreNames.length > 0,
  });

  if (!project.status || !project.data) {
    return [];
  }

  const config = project.data.config;
  const zones = config.rms?.zones ?? [];
  const horizons = config.rms?.horizons ?? [];
  const completedRmsStratigraphyNames = getCompletedRmsMappingSourceIds(
    stratigraphyMappings?.stratigraphy ?? [],
  );
  const completedRmsWellboreNames = getCompletedRmsMappingSourceIds(
    wellboreMappings?.wellbore ?? [],
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
      label: "Set RMS project",
      done: !!config.rms?.path,
      to: "/project/rms",
    },
    {
      id: "rms-stratigraphy",
      label: "Set RMS stratigraphy",
      done: zones.length > 0 || horizons.length > 0,
      to: "/project/rms/stratigraphy",
    },
    {
      id: "rms-wellbores",
      label: "Set RMS wellbores",
      done: rmsWellbores.length > 0,
      to: "/project/rms/wellbores",
    },
    {
      id: "mappings-stratigraphy",
      label: "Set RMS stratigraphy to SMDA mappings",
      done:
        (zones.length > 0 || horizons.length > 0) &&
        [...zones, ...horizons].every((item) =>
          completedRmsStratigraphyNames.has(item.name),
        ),
      to: "/project/mappings/stratigraphy",
    },
    {
      id: "mappings-wellbores",
      label: "Set RMS wellbores to SMDA mappings",
      done:
        rmsWellbores.length > 0 &&
        nonPlannedRmsWellboreNames.every((name) =>
          completedRmsWellboreNames.has(name),
        ),
      to: "/project/mappings/wellbores",
    },
  ];
}

export function useTaskPendingCount(): number {
  const tasks = useTaskList();

  return tasks.filter((t) => !t.done).length;
}
