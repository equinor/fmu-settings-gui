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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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

const DUMMYGROUP_NAME = "none";

type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

type SmdaMasterdataCoordinateSystemFields = {
  coordinateSystem: CoordinateSystem;
  fields: Array<FieldItem>;
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

function emptyItemLists(): ItemLists {
  return {
    field: [],
    country: [],
    discovery: {},
  };
}

function emptyFormMasterdataBase(): FormMasterdataBase {
  return {
    field: [],
    country: [],
    discovery: {},
  };
}

function emptyFormMasterdataSub(): FormMasterdataSub {
  return {
    country: [],
    discovery: {},
  };
}

function emptyFormMasterdataProject(): FormMasterdataProject {
  return {
    ...emptyFormMasterdataBase(),
    ...emptyOptionsData(),
  };
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

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
  const orphan = emptyItemLists();
  orphan.discovery[DUMMYGROUP_NAME] = [];
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

function Items({
  fields,
  projectFields,
  itemListGrouped,
  operation,
}: {
  fields: Array<string>;
  projectFields?: Array<string>;
  itemListGrouped: ItemListGrouped<CountryItem | DiscoveryItem | FieldItem>;
  operation: ListOperation;
}) {
  const fieldContext = useFieldContext();

  const isDummyGroup =
    Object.keys(itemListGrouped).length === 1 &&
    DUMMYGROUP_NAME in itemListGrouped;
  const groups =
    !isDummyGroup && fields.length > 0 ? fields.sort() : [DUMMYGROUP_NAME];

  return (
    <>
      {groups.map((group) => {
        const isRelatedToProjectField =
          group === DUMMYGROUP_NAME || (projectFields?.includes(group) ?? true);

        return (
          <div key={group}>
            {groups.length > 1 && (
              <PageHeader $variant="h6">{group}</PageHeader>
            )}
            <ChipsContainer>
              {group in itemListGrouped && itemListGrouped[group].length > 0 ? (
                itemListGrouped[group]
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
                  .map<React.ReactNode>((item) => {
                    const contents = [];
                    if (isRelatedToProjectField && operation === "addition") {
                      contents.push(<Icon name="arrow_back" />);
                    }
                    contents.push(
                      "short_identifier" in item
                        ? item.short_identifier
                        : item.identifier,
                    );
                    if (operation === "removal") {
                      contents.push(<Icon name="arrow_forward" />);
                    }

                    return (
                      <InfoChip
                        key={item.uuid}
                        onClick={
                          isRelatedToProjectField
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
                        {...contents}
                      </InfoChip>
                    );
                  })
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
  const [smdaFields, setSmdaFields] = useState<Array<string>>([]);
  const [projectData, setProjectData] = useState<FormMasterdataProject>(
    emptyFormMasterdataProject(),
  );
  const [availableData, setAvailableData] = useState<FormMasterdataBase>(
    emptyFormMasterdataBase(),
  );
  const [orphanData, setOrphanData] = useState<FormMasterdataSub>(
    emptyFormMasterdataSub(),
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
    if (smdaMasterdata.isSuccess && Object.keys(smdaMasterdata.data).length) {
      handlePrepareEditData(
        smdaMasterdata.data,
        form,
        setProjectData,
        setAvailableData,
        setOrphanData,
      );
    }
  }, [form, form.setFieldMeta, smdaMasterdata.data, smdaMasterdata.isSuccess]);

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
        }, smdaFields)
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
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: projectData.field,
                              }}
                              operation="removal"
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Field" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields}
                              projectFields={field.state.value.map(
                                (f) => f.identifier,
                              )}
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: availableData.field,
                              }}
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
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: projectData.country,
                              }}
                              operation="removal"
                            />
                          </ItemsContainer>
                        </div>
                        <div>
                          <Label label="Country" />
                          <ItemsContainer>
                            <Items
                              fields={smdaFields}
                              projectFields={fieldList.map((f) => f.identifier)}
                              itemListGrouped={{
                                [DUMMYGROUP_NAME]: availableData.country,
                              }}
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
                        if (
                          DUMMYGROUP_NAME in orphanData.discovery &&
                          orphanData.discovery[DUMMYGROUP_NAME].length > 0
                        ) {
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
                              itemListGrouped={projectData.discovery}
                              operation="removal"
                            />
                          </ItemsContainer>

                          {DUMMYGROUP_NAME in orphanData.discovery &&
                            orphanData.discovery[DUMMYGROUP_NAME].length >
                              0 && (
                              <OrphanTypesContainer>
                                <PageText>
                                  The following discoveries are currently
                                  present in the project masterdata but they
                                  belong to fields which are not present there.
                                  They will be removed when the project
                                  masterdata is saved.
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
                              projectFields={fieldList.map((f) => f.identifier)}
                              itemListGrouped={availableData.discovery}
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
