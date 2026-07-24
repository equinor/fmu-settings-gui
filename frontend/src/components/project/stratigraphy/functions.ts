import type { RmsStratigraphicZone, StratigraphicUnit } from "#client";
import type { OptionProps } from "#components/form/field";
import type { ElementMappings, StratUnitRelation } from "./types";
import { getLabelForStratUnitOption } from "./utils";

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
    if (unit === undefined) {
      continue;
    }
    if (stratUnit.strat_unit_parent === null) {
      relations.push(unit);
    } else {
      const parent = lookup[stratUnit.strat_unit_parent];
      if (parent === undefined) {
        continue;
      }
      parent.children.push(unit);
    }
  }

  return getOptionPropsForChildren(relations, 1);
}

export function createHorizonOptions(
  rmsHorizonName: string,
  zones: RmsStratigraphicZone[],
  elementMappings: ElementMappings,
  stratigraphicUnits: StratigraphicUnit[],
): { options: OptionProps[]; horizonNamesByUuid: Record<string, string> } {
  const zoneNamesByHorizon = new Map<string, Set<string>>();
  zones
    .filter(
      (zone) =>
        zone.top_horizon_name === rmsHorizonName ||
        zone.base_horizon_name === rmsHorizonName,
    )
    .forEach((zone) => {
      const zoneMapping = elementMappings[zone.name];
      if (zoneMapping === undefined) {
        return;
      }
      if (zoneMapping.unmappable || zoneMapping.smdaUuid === "") {
        return;
      }

      const mappedUnit = stratigraphicUnits.find(
        (unit) => unit.uuid === zoneMapping.smdaUuid,
      );
      // The relevant suggestion is the zone boundary that coincides with the
      // edited horizon: the base of a zone above, the top of a zone below.
      const horizonUuid =
        zone.base_horizon_name === rmsHorizonName
          ? mappedUnit?.base_uuid
          : mappedUnit?.top_uuid;
      if (!mappedUnit || !horizonUuid) {
        return;
      }

      const zoneNames =
        zoneNamesByHorizon.get(horizonUuid) ?? new Set<string>();
      zoneNames.add(mappedUnit.identifier);
      zoneNamesByHorizon.set(horizonUuid, zoneNames);
    });

  const adjacentHorizonOptions: OptionProps[] = [];
  const otherHorizonOptions: OptionProps[] = [];
  const horizonNamesByUuid: Record<string, string> = {};
  const seenHorizonUuids = new Set<string>();
  stratigraphicUnits.forEach((unit) => {
    (
      [
        [unit.top_uuid, unit.top],
        [unit.base_uuid, unit.base],
      ] as const
    ).forEach(([horizonUuid, horizonName]) => {
      if (!horizonUuid || seenHorizonUuids.has(horizonUuid)) {
        return;
      }
      seenHorizonUuids.add(horizonUuid);
      horizonNamesByUuid[horizonUuid] = horizonName;

      const zoneNames = zoneNamesByHorizon.get(horizonUuid);
      if (zoneNames) {
        adjacentHorizonOptions.push({
          value: horizonUuid,
          label: `${horizonName} [${[...zoneNames].join(", ")}]`,
        });
      } else {
        otherHorizonOptions.push({ value: horizonUuid, label: horizonName });
      }
    });
  });

  return {
    options: [...adjacentHorizonOptions, ...otherHorizonOptions],
    horizonNamesByUuid,
  };
}
