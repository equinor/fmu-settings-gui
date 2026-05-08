import type { AnyFieldMetaBase, Updater } from "@tanstack/react-form";

import type {
  DataSystem,
  InternalStratigraphyMappingsOutput,
  StratigraphicUnit,
} from "#client";
import type { OptionProps } from "#components/form/field";
import { findOptionValueInOptionsArray } from "#utils/form";
import type { StratUnitRelation, ZoneMapping, ZoneMappings } from "./types";
import { emptyZoneMapping, specialOptions } from "./utils";

export function createRmsMappingsLookup(
  stratigraphyMappings: InternalStratigraphyMappingsOutput,
) {
  const lookup: Record<string, ZoneMapping> = {};

  stratigraphyMappings
    .filter((mapping) => mapping.source_system === "rms")
    .forEach((mapping) => {
      const rmsName =
        mapping.relation_type === "alias" && mapping.target_id != null
          ? mapping.target_id
          : mapping.source_id;
      if (!(rmsName in lookup)) {
        lookup[rmsName] = {
          ...emptyZoneMapping(),
          rmsName: rmsName,
        };
      }

      if (mapping.target_system === "smda") {
        if (mapping.relation_type === "primary") {
          lookup[rmsName].smdaName = mapping.target_id ?? "";
          lookup[rmsName].smdaUuid = mapping.target_uuid ?? "";
        } else if (mapping.relation_type === "unmappable") {
          lookup[rmsName].unmappable = true;
        }
      } else if (mapping.target_system === "rms") {
        if (mapping.relation_type === "alias") {
          lookup[rmsName].aliases.push(mapping.source_id);
        }
      }
    });

  return lookup;
}

export function handleErrorUnknownInitialValue(
  setFieldMeta: (
    field: keyof ZoneMapping,
    updater: Updater<AnyFieldMetaBase>,
  ) => void,
  field: keyof ZoneMapping,
  array: OptionProps[],
  initialValue: OptionProps,
): void {
  setFieldMeta(field, (meta) => ({
    ...meta,
    errorMap: {
      onChange: findOptionValueInOptionsArray(array, initialValue.value)
        ? undefined
        : `Initial value "${initialValue.value}" does not exist in selection list`,
    },
  }));
}

function getLabelForSmdaName(name: string, level: number) {
  const indent = "\xA0\xA0 ".repeat(level > 1 ? level - 1 : 0);

  return `${indent}${name}`;
}

function getOptionPropsForChildren(
  stratUnits: StratUnitRelation[],
  level: number,
) {
  const options: OptionProps[] = [];

  stratUnits.forEach((unit) => {
    options.push({
      value: unit.uuid,
      label: getLabelForSmdaName(unit.identifier, level),
    });
    if (unit.children.length) {
      options.push(...getOptionPropsForChildren(unit.children, level + 1));
    }
  });

  return options;
}

export function createSmdaNameOptions(stratUnits: StratigraphicUnit[]) {
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

export function updateZoneMappings(
  zoneMappings: ZoneMappings,
  value: ZoneMapping,
  stratUnit?: StratigraphicUnit,
) {
  if (value.smdaUuid === specialOptions.empty.value) {
    const { [value.rmsName]: _, ...updated } = zoneMappings;

    return updated as ZoneMappings;
  } else if (value.smdaUuid === specialOptions.unmappableZone.value) {
    return {
      ...zoneMappings,
      [value.rmsName]: {
        ...value,
        unmappable: true,
      },
    };
  } else if (value.smdaUuid === specialOptions.divider.value) {
    return { ...zoneMappings };
  } else {
    return {
      ...zoneMappings,
      [value.rmsName]: {
        ...value,
        unmappable: false,
        smdaName: stratUnit?.identifier ?? "",
      },
    };
  }
}

export function createMutationValue(
  zoneMappings: ZoneMappings,
  mappingType: "stratigraphy",
  sourceSystem: DataSystem,
  targetSystem: DataSystem,
) {
  const result: InternalStratigraphyMappingsOutput = [];

  Object.values(zoneMappings).forEach((mapping) => {
    if (mapping.smdaUuid !== "" || mapping.unmappable) {
      result.push({
        mapping_type: mappingType,
        source_system: sourceSystem,
        target_system: sourceSystem,
        relation_type: "primary",
        source_id: mapping.rmsName,
        target_id: mapping.rmsName,
      });
      result.push({
        mapping_type: mappingType,
        source_system: sourceSystem,
        target_system: targetSystem,
        relation_type: mapping.unmappable ? "unmappable" : "primary",
        source_id: mapping.rmsName,
        target_id: mapping.unmappable ? null : mapping.smdaName,
        target_uuid: mapping.unmappable ? null : mapping.smdaUuid,
      });

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
