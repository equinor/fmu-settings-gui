import type {
  AnyFieldMetaBase,
  AnyFormApi,
  Updater,
} from "@tanstack/react-form";
import type { Dispatch, SetStateAction } from "react";

import type {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  Smda,
  StratigraphicColumn,
} from "#client";
import {
  findOptionValueInNameUuidArray,
  type ListOperation,
} from "#utils/form";
import {
  emptyIdentifierUuid,
  type IdentifierUuidType,
  type NameUuidType,
} from "#utils/model";
import { stringCompare } from "#utils/string";
import type {
  FieldItemType,
  FormMasterdataBase,
  FormMasterdataProject,
  FormMasterdataSub,
  ItemLists,
  OptionsData,
  SelectedItems,
  SmdaMasterdataCoordinateSystemFields,
  SmdaMasterdataResultGrouped,
} from "./types";
import {
  AFFECTEDCHECK_LIMIT,
  DUMMYGROUP_NAME,
  emptyFormMasterdataBase,
  emptyFormMasterdataProject,
  emptyFormMasterdataSub,
  emptyItemLists,
  itemsCount,
} from "./utils";

export function resetEditData(
  setProjectData: Dispatch<SetStateAction<FormMasterdataProject>>,
  setAvailableData: Dispatch<SetStateAction<FormMasterdataBase>>,
  setOrphanData: Dispatch<SetStateAction<FormMasterdataSub>>,
) {
  setProjectData(emptyFormMasterdataProject());
  setAvailableData(emptyFormMasterdataBase());
  setOrphanData(emptyFormMasterdataSub({ withDummyGroup: true }));
}

export function handlePrepareEditData(
  masterdata: SmdaMasterdataResultGrouped,
  formApi: AnyFormApi,
  setProjectData: Dispatch<SetStateAction<FormMasterdataProject>>,
  setAvailableData: Dispatch<SetStateAction<FormMasterdataBase>>,
  setOrphanData: Dispatch<SetStateAction<FormMasterdataSub>>,
) {
  const optionsData = createOptions(
    masterdata,
    formApi.getFieldValue("field") as Array<FieldItem>,
  );

  handleErrorUnknownInitialValue(
    formApi.setFieldMeta,
    "coordinate_system",
    optionsData.coordinateSystems,
    formApi.getFieldValue("coordinate_system") as CoordinateSystem,
  );

  handleErrorUnknownInitialValue(
    formApi.setFieldMeta,
    "stratigraphic_column",
    optionsData.stratigraphicColumnsOptions,
    formApi.getFieldValue("stratigraphic_column") as StratigraphicColumn,
  );

  const [projectItems, availableItems, orphanItems] = createItemLists(
    masterdata,
    formApi.getFieldValue("field") as Array<FieldItem>,
    formApi.getFieldValue("country") as Array<CountryItem>,
    formApi.getFieldValue("discovery") as Array<DiscoveryItem>,
  );

  setProjectData({ ...projectItems, ...optionsData });
  setAvailableData({ ...availableItems });
  setOrphanData({
    country: orphanItems.country,
    discovery: orphanItems.discovery,
  });
}

export function createOptions(
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
  projectFields: Array<FieldItem>,
): OptionsData {
  const fieldCount = projectFields.length;

  const defaultCoordinateSystems = Object.entries(smdaMasterdataGrouped).reduce<
    Record<string, SmdaMasterdataCoordinateSystemFields>
  >((acc, fieldData) => {
    const [field, masterdata] = fieldData;
    if (projectFields.find((f) => f.identifier === field)) {
      const csId = masterdata.field_coordinate_system.uuid;
      if (!(csId in acc)) {
        acc[csId] = {
          coordinateSystem: masterdata.field_coordinate_system,
          fields: [],
        };
      }
      acc[csId].fields = acc[csId].fields
        .concat(masterdata.field)
        .sort((a, b) => stringCompare(a.identifier, b.identifier));
    }

    return acc;
  }, {});
  const dcsCount = Object.keys(defaultCoordinateSystems).length;

  const dcsOptions = Object.values(defaultCoordinateSystems)
    .sort((a, b) =>
      stringCompare(a.fields[0].identifier, b.fields[0].identifier),
    )
    .map<CoordinateSystem>((cs) => {
      const defaultText =
        dcsCount > 1
          ? "default for " +
            cs.fields.map((field) => field.identifier).join(", ")
          : "default";

      return {
        ...cs.coordinateSystem,
        identifier: `${cs.coordinateSystem.identifier} [${defaultText}]`,
      };
    });

  return {
    // The list of coordinate systems is the same for all SMDA fields
    coordinateSystems:
      fieldCount > 0
        ? smdaMasterdataGrouped[projectFields[0].identifier].coordinate_systems
        : [],
    coordinateSystemsOptions:
      fieldCount > 0
        ? dcsOptions.concat(
            smdaMasterdataGrouped[
              projectFields[0].identifier
            ].coordinate_systems
              .filter((cs) => !dcsOptions.some((dcs) => dcs.uuid === cs.uuid))
              .sort((a, b) => stringCompare(a.identifier, b.identifier)),
          )
        : [],
    stratigraphicColumns: Object.entries(smdaMasterdataGrouped).reduce<
      Array<StratigraphicColumn>
    >((acc, fieldData) => {
      const [field, masterdata] = fieldData;
      if (projectFields.find((f) => f.identifier === field)) {
        acc.push(...masterdata.stratigraphic_columns);
      }

      return acc;
    }, []),
    stratigraphicColumnsOptions: Object.entries(smdaMasterdataGrouped)
      .reduce<Array<StratigraphicColumn>>((acc, fieldData) => {
        const [field, masterdata] = fieldData;
        if (projectFields.find((f) => f.identifier === field)) {
          acc.push(
            ...masterdata.stratigraphic_columns.map((value) => ({
              ...value,
              identifier:
                value.identifier + (fieldCount > 1 ? ` [${field}]` : ""),
            })),
          );
        }

        return acc;
      }, [])
      .sort((a, b) => stringCompare(a.identifier, b.identifier)),
  };
}

export function createItemLists(
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
  projectFields: Array<FieldItem>,
  projectCountries: Array<CountryItem>,
  projectDiscoveries: Array<DiscoveryItem>,
): [ItemLists, ItemLists, ItemLists] {
  const project = projectFields.reduce<ItemLists>((acc, curr) => {
    acc.discovery[curr.identifier] = [];

    return acc;
  }, emptyItemLists());
  const available = Object.keys(smdaMasterdataGrouped).reduce<ItemLists>(
    (acc, curr) => {
      acc.discovery[curr] = [];

      return acc;
    },
    emptyItemLists(),
  );
  const orphan = emptyItemLists({ withDummyGroup: true });
  const seen = {
    discovery: [] as Array<string>,
  };

  Object.entries(smdaMasterdataGrouped).forEach(([fieldGroup, masterdata]) => {
    masterdata.field.forEach((field) => {
      if (projectFields.find((f) => f.uuid === field.uuid)) {
        if (!project.field.find((f) => f.uuid === field.uuid)) {
          project.field.push(field);
        }
      } else if (!available.field.find((f) => f.uuid === field.uuid)) {
        available.field.push(field);
      }
    });

    masterdata.country.forEach((country) => {
      if (projectCountries.find((c) => c.uuid === country.uuid)) {
        if (!project.country.find((c) => c.uuid === country.uuid)) {
          project.country.push(country);
        }
      } else if (!available.country.find((c) => c.uuid === country.uuid)) {
        available.country.push(country);
      }
    });

    if (fieldGroup in project.discovery) {
      masterdata.discovery.forEach((discovery) => {
        if (projectDiscoveries.find((d) => d.uuid === discovery.uuid)) {
          project.discovery[fieldGroup].push(discovery);
          seen.discovery.push(discovery.uuid);
        } else {
          available.discovery[fieldGroup].push(discovery);
        }
      });
    } else {
      available.discovery[fieldGroup].push(...masterdata.discovery);
    }
  });

  orphan.discovery[DUMMYGROUP_NAME].push(
    ...projectDiscoveries.filter(
      (discovery) => !seen.discovery.includes(discovery.uuid),
    ),
  );

  return [project, available, orphan];
}

export function handleErrorUnknownInitialValue(
  setFieldMeta: (field: keyof Smda, updater: Updater<AnyFieldMetaBase>) => void,
  field: keyof Smda,
  array: IdentifierUuidType[],
  initialValue: IdentifierUuidType,
): void {
  setFieldMeta(field, (meta) => ({
    ...meta,
    errorMap: {
      onChange: findOptionValueInNameUuidArray(
        [emptyIdentifierUuid(), ...array],
        initialValue.uuid,
      )
        ? undefined
        : `Initial value "${initialValue.identifier}" does not exist in selection list`,
    },
  }));
}

export function prepareSelectedItems(
  operation: ListOperation,
  itemType: FieldItemType,
  item: NameUuidType,
  setSelectedItems: Dispatch<SetStateAction<SelectedItems | undefined>>,
) {
  setSelectedItems({
    operation,
    items: {
      ...emptyItemLists({ withDummyGroup: true }),
      [itemType]:
        itemType === "discovery" ? { [DUMMYGROUP_NAME]: [item] } : [item],
    },
  });
}

export function checkForAffectedItems(
  operation: ListOperation,
  checkItems: ItemLists,
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
  projectFields: Array<FieldItem>,
  projectCountries: Array<CountryItem>,
  projectDiscoveries: Array<DiscoveryItem>,
): ItemLists {
  const affectedItems = emptyItemLists({ withDummyGroup: true });

  if (operation === "addition") {
    checkItems.field.forEach((field) => {
      // Find masterdata for this Field
      Object.values(smdaMasterdataGrouped).forEach((masterdata) => {
        if (masterdata.field.find((f) => f.uuid === field.uuid)) {
          // Find corresponding Country, and mark as affected if not present in project
          const affected = masterdata.country.filter(
            (country) =>
              !projectCountries.find((c) => c.uuid === country.uuid) &&
              !affectedItems.country.find((c) => c.uuid === country.uuid),
          );
          affectedItems.country.push(...affected);
        }
      });
    });
    checkItems.discovery[DUMMYGROUP_NAME].forEach((discovery) => {
      // Find masterdata for this Discovery
      Object.values(smdaMasterdataGrouped).forEach((masterdata) => {
        if (masterdata.discovery.find((d) => d.uuid === discovery.uuid)) {
          // Find corresponding Field, and mark as affected if not present in project
          const affected = masterdata.field.filter(
            (field) =>
              !projectFields.find((f) => f.uuid === field.uuid) &&
              !affectedItems.field.find((f) => f.uuid === field.uuid),
          );
          affectedItems.field.push(...affected);
        }
      });
    });
  } else {
    // Check items for removal
    checkItems.field.forEach((field) => {
      // Find masterdata for this Field
      Object.values(smdaMasterdataGrouped).forEach((masterdata) => {
        if (masterdata.field.find((f) => f.uuid === field.uuid)) {
          // Find corresponding Discoveries, and mark as affected if present in project
          const affected = masterdata.discovery.filter(
            (discovery) =>
              projectDiscoveries.find((d) => d.uuid === discovery.uuid) &&
              !affectedItems.discovery[DUMMYGROUP_NAME].find(
                (d) => d.uuid === discovery.uuid,
              ),
          );
          affectedItems.discovery[DUMMYGROUP_NAME].push(...affected);
        }
      });
    });
    checkItems.country.forEach((country) => {
      // Find masterdata for this Country
      Object.values(smdaMasterdataGrouped).forEach((masterdata) => {
        if (masterdata.country.find((c) => c.uuid === country.uuid)) {
          // Find corresponding Fields, and mark as affected if present in project
          const affected = masterdata.field.filter(
            (field) =>
              projectFields.find((f) => f.uuid === field.uuid) &&
              !affectedItems.field.find((f) => f.uuid === field.uuid),
          );
          affectedItems.field.push(...affected);
        }
      });
    });
  }

  return affectedItems;
}

export function handleAffectedItems(
  selectedItems: SelectedItems,
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
  projectFields: Array<FieldItem>,
  projectCountries: Array<CountryItem>,
  projectDiscoveries: Array<DiscoveryItem>,
): ItemLists {
  let checkItems = selectedItems.items;
  const affectedItems = emptyItemLists({ withDummyGroup: true });
  const checkedItems = emptyItemLists({ withDummyGroup: true });

  let checkCount = 0;
  while (itemsCount(checkItems)) {
    checkCount += 1;
    const affected = checkForAffectedItems(
      selectedItems.operation,
      checkItems,
      smdaMasterdataGrouped,
      projectFields,
      projectCountries,
      projectDiscoveries,
    );

    checkedItems.field.push(...checkItems.field);
    checkedItems.country.push(...checkItems.country);
    checkedItems.discovery[DUMMYGROUP_NAME].push(
      ...checkItems.discovery[DUMMYGROUP_NAME],
    );
    checkItems = emptyItemLists({ withDummyGroup: true });

    affected.field.forEach((field) => {
      if (!affectedItems.field.find((f) => f.uuid === field.uuid)) {
        affectedItems.field.push(field);
      }
      if (!checkedItems.field.find((f) => f.uuid === field.uuid)) {
        checkItems.field.push(field);
      }
    });
    affected.country.forEach((country) => {
      if (!affectedItems.country.find((c) => c.uuid === country.uuid)) {
        affectedItems.country.push(country);
      }
      if (!checkedItems.country.find((c) => c.uuid === country.uuid)) {
        checkItems.country.push(country);
      }
    });
    affected.discovery[DUMMYGROUP_NAME].forEach((discovery) => {
      if (
        !affectedItems.discovery[DUMMYGROUP_NAME].find(
          (d) => d.uuid === discovery.uuid,
        )
      ) {
        affectedItems.discovery[DUMMYGROUP_NAME].push(discovery);
      }
      if (
        !checkedItems.discovery[DUMMYGROUP_NAME].find(
          (d) => d.uuid === discovery.uuid,
        )
      ) {
        checkItems.discovery[DUMMYGROUP_NAME].push(discovery);
      }
    });

    if (checkCount > AFFECTEDCHECK_LIMIT) {
      console.warn(
        "Check count limit reached when checking for affected items on moving:",
        checkCount,
      );
      break;
    }
  }

  return affectedItems;
}
