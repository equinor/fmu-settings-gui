import type { AnyFieldMetaBase, Updater } from "@tanstack/react-form";
import { use } from "react";

import type {
  DataSystem,
  InternalMappings,
  InternalStratigraphyMappingsOutput,
  MappingType,
  RmsHorizon,
  RmsStratigraphicZone,
} from "#client";
import type { OptionProps } from "#components/form/field";
import { findOptionValueInOptionsArray } from "#utils/form";
import type {
  ElementMapping,
  ElementMappings,
  ElementType,
} from "../stratigraphy/types";
import { MappingDataContext } from "./MappingData";
import { emptyElementMapping, specialOptions } from "./utils";

export function useMappingData() {
  const data = use(MappingDataContext);

  if (data === null) {
    throw new Error("Mapping data is not set");
  }

  return data;
}

export function createProjectMappingsLookup(
  mappingType: keyof InternalMappings,
  projectMappings: InternalMappings,
) {
  const sourceSystem: DataSystem = "rms";
  const targetSystem: DataSystem = "smda";
  const lookup: Record<string, ElementMapping> = {};

  projectMappings[mappingType]?.forEach((mapping) => {
    const rmsName =
      mapping.relation_type === "alias" && mapping.target_id != null
        ? mapping.target_id
        : mapping.source_id;
    if (!(rmsName in lookup)) {
      lookup[rmsName] = {
        ...emptyElementMapping(),
        rmsName: rmsName,
      };
    }

    if (mapping.target_system === targetSystem) {
      if (mapping.relation_type === "primary") {
        lookup[rmsName].smdaName = mapping.target_id ?? "";
        lookup[rmsName].smdaUuid = mapping.target_uuid ?? "";
      } else if (mapping.relation_type === "unmappable") {
        lookup[rmsName].unmappable = true;
      }
    } else if (mapping.target_system === sourceSystem) {
      if (mapping.relation_type === "alias") {
        lookup[rmsName].aliases.push(mapping.source_id);
      }
    }
  });

  return lookup;
}

export function handleErrorUnknownInitialValue(
  setFieldMeta: (
    field: keyof ElementMapping,
    updater: Updater<AnyFieldMetaBase>,
  ) => void,
  field: keyof ElementMapping,
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
  elements: Array<RmsHorizon | RmsStratigraphicZone>,
  projectMappingsLookup: Record<string, ElementMapping>,
) {
  const elementMappings: ElementMappings = {};

  elements.forEach((element) => {
    elementMappings[element.name] = {
      ...(projectMappingsLookup[element.name] ?? {
        ...emptyElementMapping(),
        rmsName: element.name,
      }),
      elementType,
    };
  });

  return elementMappings;
}

export function updatedElementMapping(
  value: ElementMapping,
  smdaName: string,
): ElementMapping | undefined {
  if (value.smdaUuid === specialOptions.empty.value) {
    return {
      ...value,
      unmappable: false,
      smdaName: "",
      smdaUuid: "",
    };
  } else if (
    value.smdaUuid === specialOptions.unmappableHorizon.value ||
    value.smdaUuid === specialOptions.unmappableZone.value
  ) {
    return {
      ...value,
      unmappable: true,
    };
  } else if (value.smdaUuid === specialOptions.divider.value) {
    return undefined;
  } else {
    return {
      ...value,
      unmappable: false,
      smdaName,
    };
  }
}

export function createMutationValue(elementMappings: ElementMappings) {
  const mappingType: MappingType = "stratigraphy";
  const sourceSystem: DataSystem = "rms";
  const targetSystem: DataSystem = "smda";
  const result: InternalStratigraphyMappingsOutput = [];

  Object.values(elementMappings).forEach((mapping) => {
    if (
      mapping.smdaUuid !== "" ||
      mapping.unmappable ||
      mapping.aliases.length
    ) {
      result.push({
        mapping_type: mappingType,
        source_system: sourceSystem,
        target_system: sourceSystem,
        relation_type: "primary",
        source_id: mapping.rmsName,
        target_id: mapping.rmsName,
      });

      if (mapping.smdaUuid !== "" || mapping.unmappable) {
        result.push({
          mapping_type: mappingType,
          source_system: sourceSystem,
          target_system: targetSystem,
          relation_type: mapping.unmappable ? "unmappable" : "primary",
          source_id: mapping.rmsName,
          target_id: mapping.unmappable ? null : mapping.smdaName,
          target_uuid: mapping.unmappable ? null : mapping.smdaUuid,
        });
      }

      mapping.aliases.forEach((alias) => {
        const name_trimmed = alias.trim();
        if (name_trimmed !== "") {
          result.push({
            mapping_type: mappingType,
            source_system: sourceSystem,
            target_system: sourceSystem,
            relation_type: "alias",
            source_id: name_trimmed,
            target_id: mapping.rmsName,
            target_uuid: null,
          });
        }
      });
    }
  });

  return result;
}
