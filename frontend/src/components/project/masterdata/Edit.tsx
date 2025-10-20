import { Dialog, Icon, Label, Typography } from "@equinor/eds-core-react";
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
  DiscoveryItem,
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
} from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import {
  fieldContext,
  findOptionValueInIdentifierUuidArray,
  formContext,
  handleIdentifierUuidListOperation,
  identifierUuidArrayToOptionsArray,
  ListOperation,
  useFieldContext,
} from "#utils/form";
import { emptyIdentifierUuid, IdentifierUuidType } from "#utils/model";
import { stringCompare } from "#utils/string";
import { DiscoveriesContainer, FieldsContainer } from "./Edit.style";

Icon.add({ arrow_back, arrow_forward });

type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

type SmdaReferenceData = {
  coordinateSystems: Array<CoordinateSystem>;
  stratigraphicColumns: Array<StratigraphicColumn>;
  stratigraphicColumnsOptions: Array<StratigraphicColumn>;
};

type DiscoveryListGrouped = Record<string, Array<DiscoveryItem>>;

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Select },
  formComponents: { CancelButton, SubmitButton },
});

function createReferenceData(
  masterdataGrouped: SmdaMasterdataResultGrouped,
): SmdaReferenceData {
  const fieldCount = Object.keys(masterdataGrouped).length;

  return {
    // The list of coordinate systems is the same for all SMDA fields
    coordinateSystems:
      fieldCount > 0
        ? Object.values(masterdataGrouped)[0].coordinate_systems.sort((a, b) =>
            stringCompare(a.identifier, b.identifier),
          )
        : [],
    stratigraphicColumns: Object.values(masterdataGrouped)
      .reduce<Array<StratigraphicColumn>>((acc, masterdata) => {
        acc.push(...masterdata.stratigraphic_columns);

        return acc;
      }, [])
      .sort((a, b) => stringCompare(a.identifier, b.identifier)),
    stratigraphicColumnsOptions: Object.entries(masterdataGrouped)
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

function createDiscoveryLists(
  smdaMasterdataGrouped: SmdaMasterdataResultGrouped,
  projectMasterdataDiscoveries: Array<DiscoveryItem>,
): [DiscoveryListGrouped, DiscoveryListGrouped] {
  const project: DiscoveryListGrouped = {};
  const available: DiscoveryListGrouped = {};

  Object.entries(smdaMasterdataGrouped).forEach(([field, masterdata]) => {
    if (!(field in project)) {
      project[field] = [];
    }
    if (!(field in available)) {
      available[field] = [];
    }
    masterdata.discovery.forEach((discovery) => {
      if (projectMasterdataDiscoveries.find((d) => d.uuid === discovery.uuid)) {
        project[field].push(discovery);
      } else {
        available[field].push(discovery);
      }
    });
  });

  return [project, available];
}

function setErrorUnknownInitialValue(
  setFieldMeta: (field: keyof Smda, updater: Updater<AnyFieldMetaBase>) => void,
  field: keyof Smda,
  identifierUuidArray: IdentifierUuidType[],
  initialValue: IdentifierUuidType,
): void {
  setFieldMeta(field, (meta) => ({
    ...meta,
    errorMap: {
      onChange: findOptionValueInIdentifierUuidArray(
        identifierUuidArray,
        initialValue.uuid,
      )
        ? undefined
        : `Initial value "${initialValue.identifier}" does not exist in selection list`,
    },
  }));
}

function Discoveries({
  fields,
  discoveries,
  operation,
}: {
  fields: Array<string>;
  discoveries?: DiscoveryListGrouped;
  operation: ListOperation;
}) {
  const fieldContext = useFieldContext();

  return (
    <>
      {fields.map((field) => (
        <div key={field}>
          {fields.length > 1 && <PageHeader $variant="h6">{field}</PageHeader>}
          <ChipsContainer>
            {discoveries !== undefined &&
              (field in discoveries && discoveries[field].length > 0 ? (
                discoveries[field]
                  .sort((a, b) =>
                    stringCompare(a.short_identifier, b.short_identifier),
                  )
                  .map<React.ReactNode>((discovery) => (
                    <InfoChip
                      key={discovery.uuid}
                      onClick={() => {
                        handleIdentifierUuidListOperation(
                          fieldContext,
                          operation,
                          discovery,
                        );
                      }}
                    >
                      {operation === "addition" ? (
                        <Icon name="arrow_back" />
                      ) : (
                        ""
                      )}
                      {discovery.short_identifier}
                      {operation === "removal" ? (
                        <Icon name="arrow_forward" />
                      ) : (
                        ""
                      )}
                    </InfoChip>
                  ))
              ) : (
                <Typography>none</Typography>
              ))}
          </ChipsContainer>
        </div>
      ))}
    </>
  );
}

export function Edit({
  masterdata,
  isOpen,
  closeDialog,
}: {
  masterdata: Smda;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const [smdaFields, setSmdaFields] = useState<Array<string> | undefined>();
  const [smdaReferenceData, setSmdaReferenceData] = useState<
    SmdaReferenceData | undefined
  >();
  const [projectDiscoveries, setProjectDiscoveries] =
    useState<DiscoveryListGrouped>();
  const [availableDiscoveries, setAvailableDiscoveries] =
    useState<DiscoveryListGrouped>();

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

  // console.log(">>> Edit masterdata =", masterdata);

  const form = useAppForm({
    defaultValues: masterdata,
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
        masterdata.field
          .map((field) => field.identifier)
          .sort((a, b) => stringCompare(a, b)),
      );
    }
  }, [isOpen, masterdata]);

  useEffect(() => {
    if (smdaFields !== undefined && smdaMasterdata.isSuccess) {
      // console.log("  ::: smdaMasterdata.data =", smdaMasterdata.data);
      const refData = createReferenceData(smdaMasterdata.data);
      // console.log("  ::: refData =", refData);
      setSmdaReferenceData(refData);
      setErrorUnknownInitialValue(
        form.setFieldMeta,
        "coordinate_system",
        refData.coordinateSystems,
        masterdata.coordinate_system,
      );
      setErrorUnknownInitialValue(
        form.setFieldMeta,
        "stratigraphic_column",
        refData.stratigraphicColumnsOptions,
        masterdata.stratigraphic_column,
      );
      const [projectDiscoveries, availableDiscoveries] = createDiscoveryLists(
        smdaMasterdata.data,
        masterdata.discovery,
      );
      setProjectDiscoveries(projectDiscoveries);
      setAvailableDiscoveries(availableDiscoveries);
    }
  }, [
    form,
    masterdata.coordinate_system,
    masterdata.discovery,
    masterdata.stratigraphic_column,
    smdaFields,
    smdaMasterdata.data,
    smdaMasterdata.isSuccess,
  ]);

  function handleClose({ formReset }: { formReset: () => void }) {
    formReset();
    closeDialog();
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
    <EditDialog open={isOpen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Dialog.Header>Edit masterdata</Dialog.Header>

        <Dialog.CustomContent>
          <FieldsContainer>
            <PageHeader $variant="h4">Project masterdata</PageHeader>
            <PageHeader $variant="h4">Available masterdata</PageHeader>

            <form.AppField
              name="coordinate_system"
              validators={{
                onChange: undefined /* Resets any errors set by setFieldMeta */,
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
                        findOptionValueInIdentifierUuidArray(
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
                onChange: undefined /* Resets any errors set by setFieldMeta */,
              }}
            >
              {(field) => (
                <>
                  <field.Select
                    label="Stratigraphic column"
                    value={field.state.value.uuid}
                    options={identifierUuidArrayToOptionsArray([
                      emptyIdentifierUuid() as StratigraphicColumn,
                      ...(smdaReferenceData?.stratigraphicColumnsOptions ?? []),
                    ])}
                    loadingOptions={smdaMasterdata.isPending}
                    onChange={(value) => {
                      field.handleChange(
                        findOptionValueInIdentifierUuidArray(
                          smdaReferenceData?.stratigraphicColumns ?? [],
                          value,
                        ) ?? (emptyIdentifierUuid() as StratigraphicColumn),
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
                onChange: ({ value }) => {
                  const [projectDiscoveries, availableDiscoveries] =
                    createDiscoveryLists(smdaMasterdata.data, value);
                  setProjectDiscoveries(projectDiscoveries);
                  setAvailableDiscoveries(availableDiscoveries);
                },
              }}
            >
              {(field) => (
                <>
                  <div>
                    <Label label="Discoveries" htmlFor={field.name} />
                    <DiscoveriesContainer>
                      {smdaMasterdata.isSuccess && (
                        <Discoveries
                          fields={smdaFields ?? []}
                          discoveries={projectDiscoveries}
                          operation="removal"
                        />
                      )}
                    </DiscoveriesContainer>
                  </div>
                  <div>
                    <Label label="Discoveries" />
                    <DiscoveriesContainer>
                      {smdaMasterdata.isSuccess && (
                        <Discoveries
                          fields={smdaFields ?? []}
                          discoveries={availableDiscoveries}
                          operation="addition"
                        />
                      )}
                    </DiscoveriesContainer>
                  </div>
                </>
              )}
            </form.AppField>
          </FieldsContainer>
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
  );
}
