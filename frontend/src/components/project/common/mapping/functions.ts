import type {
  AnyFieldLikeMetaBase,
  DeepKeys,
  Updater,
} from "@tanstack/react-form";
import { use } from "react";

import type {
  DataSystem,
  InternalMappings,
  InternalStratigraphyIdentifierMapping,
  InternalWellboreIdentifierMapping,
  MappingType,
  RmsHorizon,
  RmsStratigraphicZone,
  RmsWell,
} from "#client";
import type { OptionProps } from "#components/form/field";
import { findOptionValueInOptionsArray } from "#utils/form";
import { MappingDataContext } from "./MappingData";
import type {
  ElementMapping,
  ElementMappings,
  ElementMappingTargetUpdates,
  ElementType,
} from "./types";
import {
  emptyElementMapping,
  emptyElementMappingTarget,
  specialOptions,
  specialOptionsValuesUnmappable,
} from "./utils";

export function useMappingData() {
  const data = use(MappingDataContext);

  if (data === null) {
    throw new Error("Mapping data is not set");
  }

  return data;
}

export function createProjectMappingsLookup(
  mappingType: MappingType,
  sourceSystem: DataSystem,
  targetSystems: DataSystem[],
  projectMappings: InternalMappings,
) {
  const lookup: Record<string, ElementMapping> = {};

  projectMappings[mappingType]?.forEach((projectMapping) => {
    const name =
      projectMapping.relation_type === "alias" &&
      projectMapping.target_id != null
        ? projectMapping.target_id
        : projectMapping.source_id;
    if (!(name in lookup)) {
      lookup[name] = {
        ...emptyElementMapping(targetSystems),
        name,
      };
    }
    const lookupEntry = lookup[name];
    if (lookupEntry === undefined) {
      return;
    }

    if (
      projectMapping.target_system === sourceSystem &&
      projectMapping.relation_type === "alias"
    ) {
      lookupEntry.aliases.push(projectMapping.source_id);
    } else if (targetSystems.includes(projectMapping.target_system)) {
      const targetData = lookupEntry.targets[projectMapping.target_system];
      if (targetData !== undefined) {
        if (projectMapping.relation_type === "primary") {
          targetData.name = projectMapping.target_id ?? "";
          targetData.uuid = projectMapping.target_uuid ?? "";
        } else if (projectMapping.relation_type === "unmappable") {
          targetData.unmappable = true;
        }
      }
    }
  });

  return lookup;
}

export function handleErrorUnknownInitialValue(
  setFieldMeta: (
    field: DeepKeys<ElementMapping>,
    updater: Updater<AnyFieldLikeMetaBase>,
  ) => void,
  field: DeepKeys<ElementMapping>,
  array: OptionProps[],
  initialValue: OptionProps,
): void {
  setFieldMeta(field, (meta) => ({
    ...meta,
    errorMap: {
      onChange: findOptionValueInOptionsArray(array, initialValue.value)
        ? undefined
        : `Initial value "${initialValue.label}" (${initialValue.value}) does not exist in selection list`,
    },
  }));
}

export function createElementMappings(
  elementType: ElementType,
  targetSystems: DataSystem[],
  projectElements: Array<RmsHorizon | RmsStratigraphicZone | RmsWell>,
  projectMappingsLookup: Record<string, ElementMapping>,
) {
  const elementMappings: ElementMappings = {};

  projectElements.forEach((projectElement) => {
    elementMappings[projectElement.name] = {
      ...(projectMappingsLookup[projectElement.name] ?? {
        ...emptyElementMapping(targetSystems),
        name: projectElement.name,
      }),
      elementType,
      meta: {
        ...("planned" in projectElement && {
          planned: projectElement.planned,
        }),
      },
    };
  });

  return elementMappings;
}

export function updatedElementMapping(
  elementMapping: ElementMapping,
  targetUpdates: ElementMappingTargetUpdates,
): ElementMapping {
  const updatedTargets: ElementMapping["targets"] = {};

  Object.keys(targetUpdates).forEach((key) => {
    const target = key as DataSystem;
    const updateData = targetUpdates[target];
    if (updateData !== undefined) {
      if (
        updateData.uuid === specialOptions.empty.value ||
        updateData.uuid === specialOptions.divider.value
      ) {
        updatedTargets[target] = emptyElementMappingTarget();
      } else if (specialOptionsValuesUnmappable.includes(updateData.uuid)) {
        updatedTargets[target] = {
          ...emptyElementMappingTarget(),
          unmappable: true,
        };
      } else {
        updatedTargets[target] = {
          unmappable: false,
          ...updateData,
        };
      }
    }
  });

  return {
    ...elementMapping,
    aliases: elementMapping.aliases.filter((alias) => alias !== ""),
    targets: {
      ...elementMapping.targets,
      ...updatedTargets,
    },
  };
}

export function createMutationValue<
  T extends
    | InternalStratigraphyIdentifierMapping
    | InternalWellboreIdentifierMapping,
>(
  mappingType: MappingType,
  sourceSystem: DataSystem,
  elementMappings: ElementMappings,
) {
  const result: T[] = [];

  Object.values(elementMappings).forEach((elementMapping) => {
    const targetMappings: T[] = [];
    Object.keys(elementMapping.targets).forEach((key) => {
      const target = key as DataSystem;
      const targetData = elementMapping.targets[target];
      if (
        (targetData?.unmappable ?? false) ||
        (target === "simulator" && targetData?.name !== "") ||
        (target === "smda" && targetData?.uuid !== "")
      ) {
        targetMappings.push({
          mapping_type: mappingType,
          source_system: sourceSystem,
          target_system: target,
          source_id: elementMapping.name,
          ...(targetData?.unmappable
            ? {
                relation_type: "unmappable",
              }
            : {
                relation_type: "primary",
                target_id: targetData?.name ?? null,
                target_uuid:
                  (targetData?.uuid ?? "") !== "" ? targetData?.uuid : null,
              }),
        } as T);
      }
    });

    if (targetMappings.length || elementMapping.aliases.length) {
      result.push({
        mapping_type: mappingType,
        source_system: sourceSystem,
        target_system: sourceSystem,
        relation_type: "primary",
        source_id: elementMapping.name,
        target_id: elementMapping.name,
      } as T);

      result.push(...targetMappings);

      elementMapping.aliases.forEach((alias) => {
        const aliasTrimmed = alias.trim();
        if (aliasTrimmed !== "") {
          result.push({
            mapping_type: mappingType,
            source_system: sourceSystem,
            target_system: sourceSystem,
            relation_type: "alias",
            source_id: aliasTrimmed,
            target_id: elementMapping.name,
          } as T);
        }
      });
    }
  });

  return result;
}
