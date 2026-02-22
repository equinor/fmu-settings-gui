import type { AnyFormApi } from "@tanstack/react-form";

import type {
  RmsHorizon,
  RmsStratigraphicFramework,
  RmsStratigraphicZone,
} from "#client";
import { useFormContext } from "#utils/form";

export type ZoneWithColumn = RmsStratigraphicZone & {
  gridColumn: number;
  topHorizonIndex: number;
  baseHorizonIndex: number;
};

export type ItemType = RmsHorizon | RmsStratigraphicZone;

export function findIndexByName(items: ItemType[], name: string) {
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
  return items
    .filter((item) => !referenceList.find((i) => i.name === item.name))
    .map((item) => item.name);
};

export function useItemHandlers(
  projectHorizons: RmsHorizon[],
  projectZones: RmsStratigraphicZone[],
  availableHorizons: RmsHorizon[],
  availableZones: RmsStratigraphicZone[],
) {
  const form: AnyFormApi = useFormContext();

  const addItems = (
    itemType: keyof RmsStratigraphicFramework,
    names: string[],
  ) => {
    const availableItems =
      itemType === "horizons" ? availableHorizons : availableZones;
    const projectItems =
      itemType === "horizons" ? projectHorizons : projectZones;
    const projectNames = new Set(projectItems.map((pz) => pz.name));

    const availableItemsMap = new Map(
      availableItems.map((item) => [item.name, item]),
    );

    const itemsToAdd = names
      .filter((name) => !projectNames.has(name))
      .flatMap((name) => availableItemsMap.get(name) ?? []);

    if (itemsToAdd.length) {
      // sort to ensure stratigraphic order before adding to form
      const updatedProjectItems = sortByOrderInReferenceList(
        [...projectItems, ...itemsToAdd],
        availableItems,
      );
      form.setFieldValue(itemType, updatedProjectItems);
    }
  };

  const removeItems = (
    itemType: keyof RmsStratigraphicFramework,
    names: string[],
  ) => {
    const itemNamesToRemove = new Set(names);
    const projectItems =
      itemType === "horizons" ? projectHorizons : projectZones;

    const filteredProjectItems = projectItems.filter(
      (item) => !itemNamesToRemove.has(item.name),
    );
    form.setFieldValue(itemType, filteredProjectItems);
  };

  const removeAll = () => {
    form.setFieldValue("horizons", []);
    form.setFieldValue("zones", []);
  };

  const addAll = () => {
    form.setFieldValue("horizons", availableHorizons);
    form.setFieldValue("zones", availableZones);
  };

  return {
    removeItems,
    addItems,
    addAll,
    removeAll,
  };
}
