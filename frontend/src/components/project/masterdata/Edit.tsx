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
  createFormHook,
  Updater,
} from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { CancelButton, SubmitButton } from "#components/form/button";
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
  identifierUuidArrayToOptionsArray,
  ListOperation,
  useFieldContext,
} from "#utils/form";
import { emptyIdentifierUuid, IdentifierUuidType } from "#utils/model";
import { stringCompare } from "#utils/string";
import {
  FieldsContainer,
  ItemsContainer,
  OrphanTypesContainer,
} from "./Edit.style";
import { FieldSearch } from "./FieldSearch";

Icon.add({ arrow_back, arrow_forward });

type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

type SmdaReferenceData = {
  coordinateSystems: Array<CoordinateSystem>;
  stratigraphicColumns: Array<StratigraphicColumn>;
  stratigraphicColumnsOptions: Array<StratigraphicColumn>;
};

type ItemType = "country" | "discovery" | "field";
type DiscoveryListGrouped = Record<string, Array<DiscoveryItem>>;
type ItemLists = {
  field: Array<FieldItem>;
  country: Array<CountryItem>;
  discovery: DiscoveryListGrouped;
};
type OrphanItemLists = {
  country?: Array<CountryItem>;
  discovery: Array<DiscoveryItem>;
};

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

function createReferenceData(
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
): SmdaReferenceData {
  const fieldCount = Object.keys(smdaMasterdataGrouped).length;

  return {
    // The list of coordinate systems is the same for all SMDA fields
    coordinateSystems:
      fieldCount > 0
        ? Object.values(smdaMasterdataGrouped)[0].coordinate_systems.sort(
            (a, b) => stringCompare(a.identifier, b.identifier),
          )
        : [],
    stratigraphicColumns: Object.values(smdaMasterdataGrouped)
      .reduce<Array<StratigraphicColumn>>((acc, masterdata) => {
        acc.push(...masterdata.stratigraphic_columns);

        return acc;
      }, [])
      .sort((a, b) => stringCompare(a.identifier, b.identifier)),
    stratigraphicColumnsOptions: Object.entries(smdaMasterdataGrouped)
      .reduce<Array<StratigraphicColumn>>((acc, fieldData) => {
        const [field, masterdata] = fieldData;
        acc.push(
          ...masterdata.stratigraphic_columns.map((value) => ({
            ...value,
            identifier:
              value.identifier + (fieldCount > 1 ? ` [${field}]` : ""),
          })),
        );

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
): [ItemLists, ItemLists, OrphanItemLists] {
  const project = projectFields.reduce<ItemLists>(
    (acc, curr) => {
      acc.discovery[curr.identifier] = [];

      return acc;
    },
    { field: [], country: [], discovery: {} },
  );
  const available = Object.keys(smdaMasterdataGrouped).reduce<ItemLists>(
    (acc, curr) => {
      acc.discovery[curr] = [];

      return acc;
    },
    { field: [], country: [], discovery: {} },
  );
  const orphan: OrphanItemLists = { discovery: [] };
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

  // Detection of country orphans are currently not implemented
  orphan.discovery.push(
    ...projectDiscoveries.filter(
      (discovery) => !selected.discovery.includes(discovery.uuid),
    ),
  );

  return [project, available, orphan];
}

function setErrorUnknownInitialValue(
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

function Items({
  fields,
  selectedFields,
  itemLists,
  itemType,
  operation,
}: {
  fields: Array<string>;
  selectedFields?: Array<string>;
  itemLists: ItemLists;
  itemType: ItemType;
  operation: ListOperation;
}) {
  const fieldContext = useFieldContext();
  const groups = itemType === "discovery" ? fields.sort() : ["none"];

  if (Object.keys(itemLists).length === 0) {
    return;
  }

  return (
    <>
      {groups.map((group) => {
        const isSelectedField =
          group === "none" ? true : (selectedFields?.includes(group) ?? true);
        const items: Record<
          string,
          Array<CountryItem | DiscoveryItem | FieldItem>
        > = itemType === "discovery"
          ? itemLists[itemType]
          : { none: itemLists[itemType] };

        return (
          <div key={group}>
            {groups.length > 1 && (
              <PageHeader $variant="h6">{group}</PageHeader>
            )}
            <ChipsContainer>
              {group in items && items[group].length > 0 ? (
                items[group]
                  .sort((a, b) =>
                    stringCompare(
                      "short_identifier" in a
                        ? a.short_identifier
                        : a.identifier,
                      "short_identifier" in b
                        ? b.short_identifier
                        : b.identifier,
                    ),
                  )
                  .map<React.ReactNode>((item) => (
                    <InfoChip
                      key={item.uuid}
                      onClick={
                        isSelectedField
                          ? () => {
                              handleNameUuidListOperation(
                                fieldContext,
                                operation,
                                item,
                              );
                            }
                          : undefined
                      }
                    >
                      {isSelectedField && operation === "addition" ? (
                        <Icon name="arrow_back" />
                      ) : (
                        ""
                      )}
                      {"short_identifier" in item
                        ? item.short_identifier
                        : item.identifier}
                      {operation === "removal" ? (
                        <Icon name="arrow_forward" />
                      ) : (
                        ""
                      )}
                    </InfoChip>
                  ))
              ) : (
                <Typography>none</Typography>
              )}
            </ChipsContainer>
          </div>
        );
      })}
    </>
  );
}

export function Edit({
  projectMasterdata,
  isOpen,
  closeDialog,
}: {
  projectMasterdata: Smda;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [smdaFields, setSmdaFields] = useState<Array<string> | undefined>();
  const [smdaReferenceData, setSmdaReferenceData] = useState<
    SmdaReferenceData | undefined
  >();
  const [projectItems, setProjectItems] = useState<ItemLists>({} as ItemLists);
  const [availableItems, setAvailableItems] = useState<ItemLists>(
    {} as ItemLists,
  );
  const [orphanItems, setOrphanItems] = useState<OrphanItemLists>(
    {} as OrphanItemLists,
  );

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
    queries: (smdaFields ?? []).map((field) =>
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
        const [projectItems, availableItems, orphaItems] = createItemLists(
          smdaMasterdata.data,
          formApi.getFieldValue("field"),
          formApi.getFieldValue("country"),
          formApi.getFieldValue("discovery"),
        );
        setProjectItems(projectItems);
        setAvailableItems(availableItems);
        setOrphanItems(orphaItems);
      },
    },
    onSubmit: ({ formApi, value }) => {
      mutationCallback({
        formValue: value,
        formSubmitCallback,
        formReset: formApi.reset,
      });
    },
  });

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
    if (smdaFields !== undefined && smdaMasterdata.isSuccess) {
      const refData = createReferenceData(smdaMasterdata.data);
      setSmdaReferenceData(refData);
      setErrorUnknownInitialValue(
        form.setFieldMeta,
        "coordinate_system",
        refData.coordinateSystems,
        projectMasterdata.coordinate_system,
      );
      setErrorUnknownInitialValue(
        form.setFieldMeta,
        "stratigraphic_column",
        refData.stratigraphicColumnsOptions,
        projectMasterdata.stratigraphic_column,
      );
      const [projectItems, availableItems, orphanItems] = createItemLists(
        smdaMasterdata.data,
        projectMasterdata.field,
        projectMasterdata.country,
        projectMasterdata.discovery,
      );
      setProjectItems(projectItems);
      setAvailableItems(availableItems);
      setOrphanItems(orphanItems);
    }
  }, [
    form,
    projectMasterdata.coordinate_system,
    projectMasterdata.country,
    projectMasterdata.discovery,
    projectMasterdata.field,
    projectMasterdata.stratigraphic_column,
    smdaFields,
    smdaMasterdata.data,
    smdaMasterdata.isSuccess,
  ]);

  function handleClose({ formReset }: { formReset: () => void }) {
    formReset();
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
        }, smdaFields ?? [])
        .sort((a, b) => stringCompare(a, b)),
    );
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
  };

  return (
    <>
      <FieldSearch
        isOpen={searchDialogOpen}
        addFields={addFields}
        closeDialog={closeSearchDialog}
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
                              itemLists={projectItems}
                              itemType="field"
                              operation="removal"
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Field" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields ?? []}
                              selectedFields={field.state.value.map(
                                (f) => f.identifier,
                              )}
                              itemLists={availableItems}
                              itemType="field"
                              operation="addition"
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
                              itemLists={projectItems}
                              itemType="country"
                              operation="removal"
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Country" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields ?? []}
                              selectedFields={fieldList.map(
                                (f) => f.identifier,
                              )}
                              itemLists={availableItems}
                              itemType="country"
                              operation="addition"
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
                            ...(smdaReferenceData?.coordinateSystems ?? []),
                          ])}
                          loadingOptions={smdaMasterdata.isPending}
                          onChange={(value) => {
                            field.handleChange(
                              findOptionValueInNameUuidArray(
                                smdaReferenceData?.coordinateSystems ?? [],
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
                            ...(smdaReferenceData?.stratigraphicColumnsOptions ??
                              []),
                          ])}
                          loadingOptions={smdaMasterdata.isPending}
                          onChange={(value) => {
                            field.handleChange(
                              findOptionValueInNameUuidArray(
                                smdaReferenceData?.stratigraphicColumns ?? [],
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
                        if (orphanItems.discovery.length > 0) {
                          handleNameUuidListOperation(
                            fieldApi,
                            "removal",
                            orphanItems.discovery,
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
                              itemLists={projectItems}
                              itemType="discovery"
                              operation="removal"
                            />
                          </ItemsContainer>

                          {"discovery" in orphanItems &&
                            orphanItems.discovery.length > 0 && (
                              <OrphanTypesContainer>
                                <PageText>
                                  The following discoveries are currently
                                  present in the project masterdata but they
                                  belong to fields which are not present there.
                                  They will be removed when the project
                                  masterdata is saved.
                                </PageText>
                                <PageList>
                                  {orphanItems.discovery.map<React.ReactNode>(
                                    (discovery) => (
                                      <List.Item key={discovery.uuid}>
                                        {discovery.short_identifier}
                                      </List.Item>
                                    ),
                                  )}
                                </PageList>
                              </OrphanTypesContainer>
                            )}
                        </div>
                        <div>
                          <Label label="Discoveries" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields ?? []}
                              selectedFields={fieldList.map(
                                (f) => f.identifier,
                              )}
                              itemLists={availableItems}
                              itemType="discovery"
                              operation="addition"
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
                      disabled={!canSubmit || smdaMasterdata.isPending}
                      isPending={masterdataMutation.isPending}
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
