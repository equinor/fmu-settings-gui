import { AnyFormApi } from "@tanstack/react-form";

import { RmsHorizon, RmsStratigraphicZone } from "#client";
import { useFormContext } from "#utils/form";

export type ZoneWithColumn = RmsStratigraphicZone & {
  column: number;
};

export type ItemLists = {
  horizons: RmsHorizon[];
  zones: RmsStratigraphicZone[];
};

export type ItemType = RmsHorizon | RmsStratigraphicZone;

export function findIndexByName(items: ItemType[], name: string): number {
  return items.findIndex((item) => item.name === name);
}

export function sortByOrderInReferenceList<T extends ItemType>(
  items: T[],
  referenceList: T[],
): T[] {
  return items.sort((a, b) => {
    const idxA = findIndexByName(referenceList, a.name);
    const idxB = findIndexByName(referenceList, b.name);

    return idxA - idxB;
  });
}

export const namesNotInReference = <T extends ItemType>(
  items: T[],
  referenceList: T[],
) => {
  const referenceNames = new Set(referenceList.map((item) => item.name));

  return items
    .filter((item) => !referenceNames.has(item.name))
    .map((item) => item.name);
};

export function useStratigraphyHandlers(
  projectHorizons: RmsHorizon[],
  projectZones: RmsStratigraphicZone[],
  availableHorizons: RmsHorizon[],
  availableZones: RmsStratigraphicZone[],
) {
  const form: AnyFormApi = useFormContext();

  const handleAddItems = (itemType: keyof ItemLists, names: string[]) => {
    const availableItems =
      itemType === "horizons" ? availableHorizons : availableZones;
    const projectItems =
      itemType === "horizons" ? projectHorizons : projectZones;
    const projectNames = new Set(projectItems.map((pz) => pz.name));

    const itemsToAdd = names
      .filter((name) => !projectNames.has(name))
      .reduce<ItemType[]>((acc, name) => {
        const item = availableItems.find((item) => item.name === name);
        if (item) acc.push(item);

        return acc;
      }, []);

    if (itemsToAdd.length) {
      // sort to ensure stratigraphic order before adding to form
      const updatedProjectItems = sortByOrderInReferenceList(
        [...projectItems, ...itemsToAdd],
        availableItems,
      );
      form.setFieldValue(itemType, updatedProjectItems);
    }
  };
  const handleRemoveItems = (itemType: keyof ItemLists, names: string[]) => {
    const itemNamesToRemove = new Set(names);
    const projectItems =
      itemType === "horizons" ? projectHorizons : projectZones;

    const filteredProjectItems = projectItems.filter(
      (pi) => !itemNamesToRemove.has(pi.name),
    );
    form.setFieldValue(itemType, filteredProjectItems);
  };

  const handleRemoveAll = () => {
    form.setFieldValue("horizons", []);
    form.setFieldValue("zones", []);
  };
  const handleAddAll = () => {
    form.setFieldValue("horizons", availableHorizons);
    form.setFieldValue("zones", availableZones);
  };

  return {
    handleRemoveItems,
    handleAddItems,
    handleAddAll,
    handleRemoveAll,
  };
}

export function prepareZoneData(
  zones: RmsStratigraphicZone[],
  horizons: RmsHorizon[],
): ZoneWithColumn[] {
  const defaultColumn = 1;
  const zonesWithColumns = zones.map((zone) => {
    const topIndex = findIndexByName(horizons, zone.top_horizon_name);
    const baseIndex = findIndexByName(horizons, zone.base_horizon_name);

    const horizonSpan = new Set<number>();
    for (let i = topIndex; i < baseIndex; i++) {
      horizonSpan.add(i);
    }

    return {
      ...zone,
      horizonSpan,
      column: defaultColumn,
    };
  });

  // Sort to get zones with least overlap placed first
  zonesWithColumns.sort((a, b) => a.horizonSpan.size - b.horizonSpan.size);

  const columnOccupancy = new Map<number, Set<number>>();

  zonesWithColumns.forEach((zoneInfo) => {
    let column = defaultColumn;
    let foundColumn = false;

    while (!foundColumn) {
      if (!columnOccupancy.has(column)) {
        columnOccupancy.set(column, new Set());
      }

      const occupied = columnOccupancy.get(column)!;
      const hasOverlap = Array.from(zoneInfo.horizonSpan).some((horizonIdx) =>
        occupied.has(horizonIdx),
      );

      if (!hasOverlap) {
        zoneInfo.horizonSpan.forEach((horizonIdx) => occupied.add(horizonIdx));
        zoneInfo.column = column;
        foundColumn = true;
      } else {
        column++;
      }
    }
  });

  return zonesWithColumns;
}
