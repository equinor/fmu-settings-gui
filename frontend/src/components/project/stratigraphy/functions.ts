import type { AnyFieldMetaBase, Updater } from "@tanstack/react-form";

import type {
  DataSystem,
  InternalStratigraphyMappingsOutput,
  MappingType,
  StratigraphicUnit,
} from "#client";
import type { OptionProps } from "#components/form/field";
import { findOptionValueInOptionsArray } from "#utils/form";
import type {
  ElementMapping,
  ElementMappings,
  ElementType,
  StratUnitRelation,
} from "./types";
import {
  emptyElementMapping,
  getLabelForStratUnitOption,
  specialOptions,
} from "./utils";

export function createStratigraphyMappingsLookup(
  stratigraphyMappings: InternalStratigraphyMappingsOutput,
) {
  const sourceSystem: DataSystem = "rms";
  const targetSystem: DataSystem = "smda";
  const lookup: Record<string, ElementMapping> = {};

  stratigraphyMappings.forEach((mapping) => {
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

function getOptionPropsForChildren(
  stratUnits: StratUnitRelation[],
  level: number,
) {
  const options: OptionProps[] = [];

  stratUnits.forEach((unit) => {
    options.push({
      value: unit.uuid,
      label: getLabelForStratUnitOption(unit.identifier, level),
    });
    if (unit.children.length) {
      options.push(...getOptionPropsForChildren(unit.children, level + 1));
    }
  });

  return options;
}

export function createStratUnitOptions(stratUnits: StratigraphicUnit[]) {
  const lookup: { [key: string]: StratUnitRelation } = {};
  for (const stratUnit of stratUnits) {
    lookup[stratUnit.identifier] = {
      identifier: stratUnit.identifier,
      uuid: stratUnit.uuid,
      children: [],
    };
  }

  const relations: StratUnitRelation[] = [];
  for (const stratUnit of stratUnits) {
    const unit = lookup[stratUnit.identifier];
    if (stratUnit.strat_unit_parent === null) {
      relations.push(unit);
    } else {
      const parent = lookup[stratUnit.strat_unit_parent];
      parent.children.push(unit);
    }
  }

  return getOptionPropsForChildren(relations, 1);
}

export function updatedElementMappings(
  elementMappings: ElementMappings,
  value: ElementMapping,
  smdaNameOptions: Record<ElementType, OptionProps[]>,
  stratUnit?: StratigraphicUnit,
) {
  if (value.smdaUuid === specialOptions.empty.value) {
    return {
      ...elementMappings,
      [value.rmsName]: {
        ...value,
        unmappable: false,
        smdaName: "",
        smdaUuid: "",
      },
    } as ElementMappings;
  } else if (
    value.smdaUuid === specialOptions.unmappableHorizon.value ||
    value.smdaUuid === specialOptions.unmappableZone.value
  ) {
    return {
      ...elementMappings,
      [value.rmsName]: {
        ...value,
        unmappable: true,
      },
    } as ElementMappings;
  } else if (value.smdaUuid === specialOptions.divider.value) {
    return { ...elementMappings } as ElementMappings;
  } else {
    return {
      ...elementMappings,
      [value.rmsName]: {
        ...value,
        unmappable: false,
        smdaName:
          value.elementType === "horizon"
            ? (
                smdaNameOptions.horizon.find(
                  (option) => option.value === value.smdaUuid,
                ) ?? { value: "", label: "" }
              ).label
            : (stratUnit?.identifier ?? ""),
      },
    } as ElementMappings;
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
