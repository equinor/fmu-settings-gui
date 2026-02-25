import {
  Button,
  Dialog,
  Icon,
  Label,
  List,
  Typography,
} from "@equinor/eds-core-react";
import { arrow_back, arrow_forward } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import type { CoordinateSystem, Smda, StratigraphicColumn } from "#client";
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
import type {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form";
import {
  ChipsContainer,
  EditDialog,
  GenericDialog,
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
  type ListOperation,
} from "#utils/form";
import {
  emptyIdentifierUuid,
  getNameFromMultipleNameUuidValues,
  getNameFromNameUuidValue,
} from "#utils/model";
import { stringCompare } from "#utils/string";
import {
  FieldsContainer,
  ItemsContainer,
  OrphanTypesContainer,
} from "./Edit.style";
import { FieldSearch } from "./FieldSearch";
import {
  handleAffectedItems,
  handlePrepareEditData,
  prepareSelectedItems,
  resetEditData,
} from "./functions";
import type {
  FieldItemType,
  FormMasterdataBase,
  FormMasterdataProject,
  FormMasterdataSub,
  ItemListGrouped,
  ItemLists,
  MasterdataItemType,
  SelectedItems,
  SmdaMasterdataResultGrouped,
} from "./types";
import {
  DUMMYGROUP_NAME,
  emptyFormMasterdataBase,
  emptyFormMasterdataProject,
  emptyFormMasterdataSub,
  itemsCount,
} from "./utils";

Icon.add({ arrow_back, arrow_forward });

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

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
    <GenericDialog open={isOpen} $minWidth="32em">
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
    </GenericDialog>
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
