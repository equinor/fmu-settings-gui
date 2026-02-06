import {
  Button,
  Dialog,
  Icon,
  Label,
  List,
  Typography,
} from "@equinor/eds-core-react";
import { arrow_back, arrow_forward } from "@equinor/eds-icons";
import {
  AnyFieldMetaBase,
  AnyFormApi,
  createFormHook,
  Updater,
} from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  Smda,
  SmdaMasterdataResult,
  StratigraphicColumn,
} from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchMasterdataMutation,
  smdaPostMasterdataOptions,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { Select } from "#components/form/field";
import {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form";
import {
  ChipsContainer,
  EditDialog,
  InfoChip,
  PageHeader,
  PageList,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import {
  fieldContext,
  findOptionValueInNameUuidArray,
  formContext,
  handleNameUuidListOperation,
  handleNameUuidListOperationOnForm,
  identifierUuidArrayToOptionsArray,
  ListOperation,
} from "#utils/form";
import {
  emptyIdentifierUuid,
  getNameFromMultipleNameUuidValues,
  getNameFromNameUuidValue,
  IdentifierUuidType,
  NameUuidType,
} from "#utils/model";
import { stringCompare } from "#utils/string";
import {
  FieldsContainer,
  ItemsContainer,
  OrphanTypesContainer,
} from "./Edit.style";
import { FieldSearch } from "./FieldSearch";

Icon.add({ arrow_back, arrow_forward });

const DUMMYGROUP_NAME = "none";
const AFFECTEDCHECK_LIMIT = 5;

type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

type SmdaMasterdataCoordinateSystemFields = {
  coordinateSystem: CoordinateSystem;
  fields: Array<FieldItem>;
};

type MasterdataItemType = CountryItem | DiscoveryItem | FieldItem;
type FieldItemType = "country" | "discovery" | "field";

type SelectedItems = {
  operation: ListOperation;
  items: ItemLists;
};

type ItemListGrouped<T> = Record<string, Array<T>>;

type OptionsData = {
  coordinateSystems: Array<CoordinateSystem>;
  coordinateSystemsOptions: Array<CoordinateSystem>;
  stratigraphicColumns: Array<StratigraphicColumn>;
  stratigraphicColumnsOptions: Array<StratigraphicColumn>;
};

type ItemLists = {
  field: Array<FieldItem>;
  country: Array<CountryItem>;
  discovery: ItemListGrouped<DiscoveryItem>;
};

type FormMasterdataBase = {
  field: Array<FieldItem>;
  country: Array<CountryItem>;
  discovery: ItemListGrouped<DiscoveryItem>;
};

type FormMasterdataSub = Omit<FormMasterdataBase, "field">;

type FormMasterdataProject = FormMasterdataBase & OptionsData;

function emptyOptionsData(): OptionsData {
  return {
    coordinateSystems: [],
    coordinateSystemsOptions: [],
    stratigraphicColumns: [],
    stratigraphicColumnsOptions: [],
  };
}

function emptyItemLists({
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

function emptyFormMasterdataBase(): FormMasterdataBase {
  return {
    field: [],
    country: [],
    discovery: {},
  };
}

function emptyFormMasterdataSub({
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

function emptyFormMasterdataProject(): FormMasterdataProject {
  return {
    ...emptyFormMasterdataBase(),
    ...emptyOptionsData(),
  };
}

function itemsCount(itemLists: ItemLists) {
  let count = 0;

  count += itemLists.field.length;
  count += itemLists.country.length;

  count += Object.values(itemLists.discovery).reduce((acc, curr) => {
    acc += curr.length;

    return acc;
  }, 0);

  return count;
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

function resetEditData(
  setProjectData: Dispatch<SetStateAction<FormMasterdataProject>>,
  setAvailableData: Dispatch<SetStateAction<FormMasterdataBase>>,
  setOrphanData: Dispatch<SetStateAction<FormMasterdataSub>>,
) {
  setProjectData(emptyFormMasterdataProject());
  setAvailableData(emptyFormMasterdataBase());
  setOrphanData(emptyFormMasterdataSub({ withDummyGroup: true }));
}

function handlePrepareEditData(
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

function createOptions(
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

function createItemLists(
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
  const selected = {
    country: [] as Array<string>,
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
          selected.country.push(country.uuid);
        }
      } else if (!available.country.find((c) => c.uuid === country.uuid)) {
        available.country.push(country);
      }
    });

    if (fieldGroup in project.discovery) {
      masterdata.discovery.forEach((discovery) => {
        if (projectDiscoveries.find((d) => d.uuid === discovery.uuid)) {
          project.discovery[fieldGroup].push(discovery);
          selected.discovery.push(discovery.uuid);
        } else {
          available.discovery[fieldGroup].push(discovery);
        }
      });
    } else {
      available.discovery[fieldGroup].push(...masterdata.discovery);
    }
  });

  // Detection of country orphans is currently not implemented
  orphan.discovery[DUMMYGROUP_NAME].push(
    ...projectDiscoveries.filter(
      (discovery) => !selected.discovery.includes(discovery.uuid),
    ),
  );

  return [project, available, orphan];
}

function handleErrorUnknownInitialValue(
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

function prepareSelectedItems(
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

function checkForAffectedItems(
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

function handleAffectedItems(
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

function ConfirmItemsOperationDialog({
  isOpen,
  selectedItems,
  affectedItems,
  handleConfirmItemsOperationDecision,
}: {
  isOpen: boolean;
  selectedItems: SelectedItems | undefined;
  affectedItems: ItemLists | undefined;
  handleConfirmItemsOperationDecision: (confirm: boolean) => void;
}) {
  if (selectedItems === undefined) {
    return;
  }

  const hasAffectedItems =
    affectedItems !== undefined && itemsCount(affectedItems) > 0;

  let textItemType = "(unknown type)";
  let textItemName = "(unknown name)";
  if (selectedItems.items.field.length) {
    textItemType = "field";
    textItemName = getNameFromMultipleNameUuidValues(selectedItems.items.field);
  } else if (selectedItems.items.country.length) {
    textItemType = "country";
    textItemName = getNameFromMultipleNameUuidValues(
      selectedItems.items.country,
    );
  } else if (selectedItems.items.discovery[DUMMYGROUP_NAME].length) {
    textItemType = "discovery";
    textItemName = getNameFromMultipleNameUuidValues(
      selectedItems.items.discovery[DUMMYGROUP_NAME],
    );
  }

  let textItemsDescription = "selected";
  if (hasAffectedItems) {
    textItemsDescription += " and dependant";
  }

  return (
    <EditDialog open={isOpen} $minWidth="32em" $extraPaddingBottom={false}>
      <Dialog.Header>
        <Dialog.Title>
          {selectedItems.operation === "addition" ? "Add" : "Remove"} items
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <PageText>
          The {textItemType} <span className="emphasis">{textItemName}</span>{" "}
          has been selected for{" "}
          {selectedItems.operation === "addition"
            ? "addition to"
            : "removal from"}{" "}
          the project.
        </PageText>

        {hasAffectedItems && (
          <>
            <PageText>
              The following items will also be{" "}
              {selectedItems.operation === "addition"
                ? "added to"
                : "removed from"}{" "}
              the project, as they are dependant on this {textItemType}:
            </PageText>

            <PageList>
              {affectedItems.field.length > 0 && (
                <List.Item>
                  Field:{" "}
                  {affectedItems.field
                    .map((f) => f.identifier)
                    .sort((a, b) => stringCompare(a, b))
                    .join(", ")}
                </List.Item>
              )}
              {affectedItems.country.length > 0 && (
                <List.Item>
                  Country:{" "}
                  {affectedItems.country
                    .map((c) => c.identifier)
                    .sort((a, b) => stringCompare(a, b))
                    .join(", ")}
                </List.Item>
              )}
              {affectedItems.discovery[DUMMYGROUP_NAME].length > 0 && (
                <List.Item>
                  Discovery:{" "}
                  {affectedItems.discovery[DUMMYGROUP_NAME]
                    .map((d) => d.short_identifier)
                    .sort((a, b) => stringCompare(a, b))
                    .join(", ")}
                </List.Item>
              )}
            </PageList>
          </>
        )}

        <PageText $marginBottom="0">
          Do you want to{" "}
          {selectedItems.operation === "addition" ? "add" : "remove"} the{" "}
          {textItemsDescription} items?
        </PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label="OK"
          onClick={() => {
            handleConfirmItemsOperationDecision(true);
          }}
        />
        <CancelButton
          onClick={() => {
            handleConfirmItemsOperationDecision(false);
          }}
        />
      </Dialog.Actions>
    </EditDialog>
  );
}

function Items({
  fields,
  itemType,
  itemListGrouped,
  operation,
  setSelectedItems,
}: {
  fields: Array<string>;
  itemType: FieldItemType;
  itemListGrouped: ItemListGrouped<MasterdataItemType>;
  operation: ListOperation;
  setSelectedItems: Dispatch<SetStateAction<SelectedItems | undefined>>;
}) {
  const isDummyGroup =
    Object.keys(itemListGrouped).length === 1 &&
    DUMMYGROUP_NAME in itemListGrouped;
  const groups =
    !isDummyGroup && fields.length ? fields.sort() : [DUMMYGROUP_NAME];

  return (
    <>
      {groups.map((group) => (
        <div key={group}>
          {groups.length > 1 && <PageHeader $variant="h6">{group}</PageHeader>}
          <ChipsContainer>
            {group in itemListGrouped && itemListGrouped[group].length > 0 ? (
              itemListGrouped[group]
                .sort((a, b) =>
                  stringCompare(
                    getNameFromNameUuidValue(a),
                    getNameFromNameUuidValue(b),
                  ),
                )
                .map<React.ReactNode>((item) => {
                  const contents = [];
                  if (operation === "addition") {
                    contents.push(<Icon name="arrow_back" />);
                  }
                  contents.push(getNameFromNameUuidValue(item));
                  if (operation === "removal") {
                    contents.push(<Icon name="arrow_forward" />);
                  }

                  return (
                    <InfoChip
                      key={item.uuid}
                      onClick={() => {
                        prepareSelectedItems(
                          operation,
                          itemType,
                          item,
                          setSelectedItems,
                        );
                      }}
                    >
                      {...contents}
                    </InfoChip>
                  );
                })
            ) : (
              <Typography>none</Typography>
            )}
          </ChipsContainer>
        </div>
      ))}
    </>
  );
}

export function Edit({
  projectMasterdata,
  projectReadOnly,
  isOpen,
  closeDialog,
}: {
  projectMasterdata: Smda;
  projectReadOnly: boolean;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [confirmItemsOperationDialogOpen, setConfirmItemsOperationDialogOpen] =
    useState(false);
  const [smdaFields, setSmdaFields] = useState<Array<string>>([]);
  const [projectData, setProjectData] = useState<FormMasterdataProject>(
    emptyFormMasterdataProject(),
  );
  const [availableData, setAvailableData] = useState<FormMasterdataBase>(
    emptyFormMasterdataBase(),
  );
  const [orphanData, setOrphanData] = useState<FormMasterdataSub>(
    emptyFormMasterdataSub({ withDummyGroup: true }),
  );
  const [isOngoingItemsOperation, setIsOngoingItemsOperation] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    SelectedItems | undefined
  >();
  const [affectedItems, setAffectedItems] = useState<ItemLists | undefined>();
  const queryClient = useQueryClient();

  const masterdataMutation = useMutation({
    ...projectPatchMasterdataMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message);
      }
    },
    meta: {
      errorPrefix: "Error saving masterdata",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  const smdaMasterdata = useQueries({
    queries: smdaFields.map((field) =>
      smdaPostMasterdataOptions({ body: [{ identifier: field }] }),
    ),
    combine: (results) => ({
      data: results.reduce<SmdaMasterdataResultGrouped>((acc, curr, idx) => {
        if (curr.data !== undefined) {
          const field =
            (curr.data.field.length && curr.data.field[0].identifier) ||
            `index-${String(idx)}`;
          acc[field] = curr.data;
        }

        return acc;
      }, {}),
      isPending: results.some((result) => result.isPending),
      isSuccess: results.every((result) => result.isSuccess),
    }),
  });

  const form = useAppForm({
    defaultValues: projectMasterdata,
    listeners: {
      onChange: ({ formApi }) => {
        handlePrepareEditData(
          smdaMasterdata.data,
          formApi,
          setProjectData,
          setAvailableData,
          setOrphanData,
        );
      },
    },
    onSubmit: ({ formApi, value }) => {
      if (!projectReadOnly) {
        mutationCallback({
          formValue: value,
          formSubmitCallback,
          formReset: formApi.reset,
        });
      }
    },
  });

  const handleItemsOperation = useCallback(() => {
    if (selectedItems === undefined || itemsCount(selectedItems.items) === 0) {
      return;
    }

    const fields = selectedItems.items.field.concat(affectedItems?.field ?? []);
    if (fields.length) {
      handleNameUuidListOperationOnForm(
        form,
        selectedItems.operation,
        "field",
        fields,
      );
    }

    const countries = selectedItems.items.country.concat(
      affectedItems?.country ?? [],
    );
    if (countries.length) {
      handleNameUuidListOperationOnForm(
        form,
        selectedItems.operation,
        "country",
        countries,
      );
    }

    const discoveries = selectedItems.items.discovery[DUMMYGROUP_NAME].concat(
      affectedItems?.discovery[DUMMYGROUP_NAME] ?? [],
    );
    if (discoveries.length) {
      handleNameUuidListOperationOnForm(
        form,
        selectedItems.operation,
        "discovery",
        discoveries,
      );
    }
  }, [selectedItems, affectedItems, form]);

  const finishItemsOperation = useCallback(() => {
    setSelectedItems(undefined);
    setAffectedItems(undefined);
    setIsOngoingItemsOperation(false);
  }, []);

  const startItemsOperation = useCallback(
    (selectedItems: SelectedItems) => {
      setIsOngoingItemsOperation(true);

      const affectedItems = handleAffectedItems(
        selectedItems,
        smdaMasterdata.data,
        form.getFieldValue("field"),
        form.getFieldValue("country"),
        form.getFieldValue("discovery"),
      );

      const requireItemsOperationConfirmation =
        itemsCount(selectedItems.items) > 1 || itemsCount(affectedItems) > 0;

      if (requireItemsOperationConfirmation) {
        setAffectedItems(affectedItems);
        setConfirmItemsOperationDialogOpen(true);
      } else {
        handleItemsOperation();
        finishItemsOperation();
      }
    },
    [smdaMasterdata.data, form, handleItemsOperation, finishItemsOperation],
  );

  useEffect(() => {
    if (isOpen) {
      setSmdaFields(
        projectMasterdata.field
          .map((field) => field.identifier)
          .sort((a, b) => stringCompare(a, b)),
      );
    }
  }, [isOpen, projectMasterdata]);

  useEffect(() => {
    if (
      isOpen &&
      smdaMasterdata.isSuccess &&
      Object.keys(smdaMasterdata.data).length
    ) {
      handlePrepareEditData(
        smdaMasterdata.data,
        form,
        setProjectData,
        setAvailableData,
        setOrphanData,
      );
    }
  }, [
    form,
    form.setFieldMeta,
    isOpen,
    smdaMasterdata.data,
    smdaMasterdata.isSuccess,
  ]);

  useEffect(() => {
    if (
      !isOngoingItemsOperation &&
      selectedItems !== undefined &&
      itemsCount(selectedItems.items) > 0 &&
      smdaMasterdata.isSuccess &&
      Object.keys(smdaMasterdata.data).length
    ) {
      startItemsOperation(selectedItems);
    }
  }, [
    isOngoingItemsOperation,
    selectedItems,
    smdaMasterdata.data,
    smdaMasterdata.isSuccess,
    startItemsOperation,
  ]);

  function handleClose({ formReset }: { formReset: () => void }) {
    formReset();
    resetEditData(setProjectData, setAvailableData, setOrphanData);
    closeDialog();
  }

  function openSearchDialog() {
    setSearchDialogOpen(true);
  }

  function closeSearchDialog() {
    setSearchDialogOpen(false);
  }

  function addFields(fields: Array<string>) {
    setSmdaFields((smdaFields) =>
      fields
        .reduce((acc, curr) => {
          if (!acc.includes(curr)) {
            acc.push(curr);
          }

          return acc;
        }, smdaFields)
        .sort((a, b) => stringCompare(a, b)),
    );
  }

  function handleConfirmItemsOperationDecision(confirm: boolean) {
    if (confirm) {
      handleItemsOperation();
    }
    setConfirmItemsOperationDialogOpen(false);
    finishItemsOperation();
  }

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<Smda>) => {
    masterdataMutation.mutate(
      {
        body: formValue,
      },
      {
        onSuccess: (data) => {
          formSubmitCallback({ message: data.message, formReset });
          closeDialog();
        },
      },
    );
  };

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
    resetEditData(setProjectData, setAvailableData, setOrphanData);
  };

  return (
    <>
      <FieldSearch
        isOpen={searchDialogOpen}
        addFields={addFields}
        closeDialog={closeSearchDialog}
      />

      <ConfirmItemsOperationDialog
        isOpen={confirmItemsOperationDialogOpen}
        selectedItems={selectedItems}
        affectedItems={affectedItems}
        handleConfirmItemsOperationDecision={
          handleConfirmItemsOperationDecision
        }
      />

      <EditDialog open={isOpen} $maxWidth="200em">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>Edit masterdata</Dialog.Header>

          <Dialog.CustomContent>
            <form.Subscribe selector={(state) => state.values.field}>
              {(fieldList) => (
                <FieldsContainer>
                  <PageHeader $variant="h4">Project masterdata</PageHeader>
                  <PageHeader $variant="h4">Available masterdata</PageHeader>

                  <form.AppField name="field" mode="array">
                    {(field) => (
                      <>
                        <div>
                          <Label label="Field" htmlFor={field.name} />
                          <ItemsContainer>
                            <Items
                              fields={field.state.value.map(
                                (f) => f.identifier,
                              )}
                              itemType="field"
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: projectData.field,
                              }}
                              operation="removal"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Field" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields}
                              itemType="field"
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: availableData.field,
                              }}
                              operation="addition"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>
                        </div>
                      </>
                    )}
                  </form.AppField>

                  <div></div>
                  <div>
                    <Button variant="outlined" onClick={openSearchDialog}>
                      Search for fields
                    </Button>
                  </div>

                  <form.AppField name="country" mode="array">
                    {(field) => (
                      <>
                        <div>
                          <Label label="Country" htmlFor={field.name} />
                          <ItemsContainer>
                            <Items
                              fields={fieldList.map((f) => f.identifier)}
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: projectData.country,
                              }}
                              itemType="country"
                              operation="removal"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Country" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields}
                              itemType="country"
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: availableData.country,
                              }}
                              operation="addition"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>
                        </div>
                      </>
                    )}
                  </form.AppField>

                  <form.AppField
                    name="coordinate_system"
                    validators={{
                      onChange:
                        undefined /* Resets any errors set by setFieldMeta */,
                    }}
                  >
                    {(field) => (
                      <>
                        <field.Select
                          label="Coordinate system"
                          value={field.state.value.uuid}
                          options={identifierUuidArrayToOptionsArray([
                            emptyIdentifierUuid() as CoordinateSystem,
                            ...projectData.coordinateSystemsOptions,
                          ])}
                          loadingOptions={smdaMasterdata.isPending}
                          onChange={(value) => {
                            field.handleChange(
                              findOptionValueInNameUuidArray(
                                projectData.coordinateSystems,
                                value,
                              ) ?? (emptyIdentifierUuid() as CoordinateSystem),
                            );
                          }}
                        ></field.Select>
                        <div></div>
                      </>
                    )}
                  </form.AppField>

                  <form.AppField
                    name="stratigraphic_column"
                    validators={{
                      onChange:
                        undefined /* Resets any errors set by setFieldMeta */,
                    }}
                  >
                    {(field) => (
                      <>
                        <field.Select
                          label="Stratigraphic column"
                          value={field.state.value.uuid}
                          options={identifierUuidArrayToOptionsArray([
                            emptyIdentifierUuid() as StratigraphicColumn,
                            ...projectData.stratigraphicColumnsOptions,
                          ])}
                          loadingOptions={smdaMasterdata.isPending}
                          onChange={(value) => {
                            field.handleChange(
                              findOptionValueInNameUuidArray(
                                projectData.stratigraphicColumns,
                                value,
                              ) ??
                                (emptyIdentifierUuid() as StratigraphicColumn),
                            );
                          }}
                        />
                        <div></div>
                      </>
                    )}
                  </form.AppField>

                  <form.AppField
                    name="discovery"
                    mode="array"
                    listeners={{
                      onSubmit: ({ fieldApi }) => {
                        if (orphanData.discovery[DUMMYGROUP_NAME].length) {
                          handleNameUuidListOperation(
                            fieldApi,
                            "removal",
                            orphanData.discovery[DUMMYGROUP_NAME],
                          );
                        }
                      },
                    }}
                  >
                    {(field) => (
                      <>
                        <div>
                          <Label label="Discoveries" htmlFor={field.name} />
                          <ItemsContainer>
                            <Items
                              fields={fieldList.map((f) => f.identifier)}
                              itemType="discovery"
                              itemListGrouped={projectData.discovery}
                              operation="removal"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>

                          {orphanData.discovery[DUMMYGROUP_NAME].length > 0 && (
                            <OrphanTypesContainer>
                              <PageText>
                                The following discoveries are currently present
                                in the project masterdata but they belong to
                                fields which are not present there. They will be
                                removed when the project masterdata is saved.
                              </PageText>
                              <PageList>
                                {orphanData.discovery[
                                  DUMMYGROUP_NAME
                                ].map<React.ReactNode>((discovery) => (
                                  <List.Item key={discovery.uuid}>
                                    {discovery.short_identifier}
                                  </List.Item>
                                ))}
                              </PageList>
                            </OrphanTypesContainer>
                          )}
                        </div>
                        <div>
                          <Label label="Discoveries" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields}
                              itemType="discovery"
                              itemListGrouped={availableData.discovery}
                              operation="addition"
                              setSelectedItems={setSelectedItems}
                            />
                          </ItemsContainer>
                        </div>
                      </>
                    )}
                  </form.AppField>
                </FieldsContainer>
              )}
            </form.Subscribe>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <form.AppForm>
              <form.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <>
                    <form.SubmitButton
                      label="Save"
                      disabled={
                        !canSubmit ||
                        smdaMasterdata.isPending ||
                        projectReadOnly
                      }
                      isPending={masterdataMutation.isPending}
                      helperTextDisabled={
                        projectReadOnly ? "Project is read-only" : undefined
                      }
                    />

                    <form.CancelButton
                      onClick={() => {
                        handleClose({ formReset: form.reset });
                      }}
                    />
                  </>
                )}
              </form.Subscribe>
            </form.AppForm>
          </Dialog.Actions>
        </form>
      </EditDialog>
    </>
  );
}
