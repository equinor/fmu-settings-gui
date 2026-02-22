import type {
  FormMasterdataBase,
  FormMasterdataProject,
  FormMasterdataSub,
  ItemLists,
  OptionsData,
} from "./types";

export const DUMMYGROUP_NAME = "none";
export const AFFECTEDCHECK_LIMIT = 5;

function emptyOptionsData(): OptionsData {
  return {
    coordinateSystems: [],
    coordinateSystemsOptions: [],
    stratigraphicColumns: [],
    stratigraphicColumnsOptions: [],
  };
}

export function emptyItemLists({
  withDummyGroup = false,
}: {
  withDummyGroup?: boolean;
} = {}): ItemLists {
  const result = {
    field: [],
    country: [],
    discovery: {},
  } as ItemLists;

  if (withDummyGroup) {
    result.discovery[DUMMYGROUP_NAME] = [];
  }

  return result;
}

export function emptyFormMasterdataBase(): FormMasterdataBase {
  return {
    field: [],
    country: [],
    discovery: {},
  };
}

export function emptyFormMasterdataSub({
  withDummyGroup = false,
}: {
  withDummyGroup?: boolean;
} = {}): FormMasterdataSub {
  const result = {
    country: [],
    discovery: {},
  } as FormMasterdataSub;

  if (withDummyGroup) {
    result.discovery[DUMMYGROUP_NAME] = [];
  }

  return result;
}

export function emptyFormMasterdataProject(): FormMasterdataProject {
  return {
    ...emptyFormMasterdataBase(),
    ...emptyOptionsData(),
  };
}

export function itemsCount(itemLists: ItemLists) {
  let count = 0;

  count += itemLists.field.length;
  count += itemLists.country.length;

  count += Object.values(itemLists.discovery).reduce((acc, curr) => {
    acc += curr.length;

    return acc;
  }, 0);

  return count;
}
