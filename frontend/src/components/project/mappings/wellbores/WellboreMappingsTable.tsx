import { Dialog, List } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { createFormHook } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import type {
  InternalWellboreIdentifierMapping,
  SmdaWellHeader,
} from "#client";
import { ConfirmCloseDialog } from "#components/common";
import { CancelButton, SubmitButton } from "#components/form/button";
import {
  AutocompleteField,
  type OptionProps,
  TextField,
} from "#components/form/field";
import {
  createMutationValue,
  handleErrorUnknownInitialValue,
  updatedElementMapping,
} from "#components/project/common/mapping/functions";
import type {
  ElementMapping,
  ElementMappings,
  ElementMappingTargetUpdates,
} from "#components/project/common/mapping/types";
import {
  createSpecialOptions,
  emptyName,
  getElementMappingTargetName,
  getElementMappingTargetNameOptionsInitialValue,
  specialOptions,
} from "#components/project/common/mapping/utils";
import type { SaveWellboreMappings } from "#services/mappings";
import { EditDialog, PageCode, PageList, PageText } from "#styles/common";
import { dataGridHeight } from "#styles/dataGrid";
import { fieldContext, formContext } from "#utils/form";
import { stringCompare } from "#utils/string";
import { useConfirmClose } from "#utils/ui";
import {
  MappingEditFields,
  SmdaOptionDivider,
  WellboreMappingsContainer,
} from "./WellboreMappingsTable.style";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { AutocompleteField, TextField },
  formComponents: { CancelButton, SubmitButton },
});

type WellboreMappingColumnId = "rmsWellboreName" | "simulatorName" | "smdaName";
type ColumnFilters = Array<{ id: string; value: unknown }>;
type InaccessibleSmdaData = { name: string; uuid: string };
const WELLBORE_MAPPINGS_GRID_MAX_HEIGHT = 480;

const wellboreMappingDisplayValue: Record<
  WellboreMappingColumnId,
  (row: ElementMapping) => string
> = {
  rmsWellboreName: (row) => row.name,
  simulatorName: (row) => getElementMappingTargetName(row, "simulator"),
  smdaName: (row) => getElementMappingTargetName(row, "smda"),
};

function matchesColumnFilters(
  row: ElementMapping,
  columnFilters: ColumnFilters,
) {
  return columnFilters.every(({ id, value }) => {
    const displayValue =
      wellboreMappingDisplayValue[id as WellboreMappingColumnId];
    const filterValues = (Array.isArray(value) ? value : [value]).filter(
      Boolean,
    );

    return (
      filterValues.length === 0 || filterValues.includes(displayValue(row))
    );
  });
}

function smdaOptions(
  headers: SmdaWellHeader[],
  inaccessibleSmdaData: InaccessibleSmdaData | undefined,
): OptionProps[] {
  const options = createSpecialOptions("wellbore", headers.length > 0);

  if (inaccessibleSmdaData) {
    options.splice(options.indexOf(specialOptions.unmappableWellbore) + 1, 0, {
      value: inaccessibleSmdaData.uuid,
      label: `${inaccessibleSmdaData.name} (currently unavailable in SMDA)`,
    });
  }

  return [
    ...options,
    ...headers
      .map((header) => ({
        value: header.wellbore_uuid,
        label: header.unique_wellbore_identifier,
      }))
      .sort((a, b) => stringCompare(a.label, b.label)),
  ];
}

function EditMappingDialog({
  row,
  elementMappings,
  smdaHeaders,
  inaccessibleSmdaData,
  smdaHealthStatus,
  projectReadOnly,
  isPending,
  closeDialog,
  saveMapping,
}: {
  row: ElementMapping;
  elementMappings: ElementMappings;
  smdaHeaders: SmdaWellHeader[];
  inaccessibleSmdaData: InaccessibleSmdaData | undefined;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  isPending: boolean;
  closeDialog: () => void;
  saveMapping: (formValue: ElementMapping) => void;
}) {
  const form = useAppForm({
    defaultValues: {
      ...row,
      ...(row.targets.smda && {
        targets: {
          ...row.targets,
          smda: {
            ...row.targets.smda,
            uuid: getElementMappingTargetNameOptionsInitialValue(row, "smda")
              .value,
          },
        },
      }),
    },
    onSubmit: ({ value }) => {
      if (!projectReadOnly) {
        saveMapping(value);
      }
    },
  });
  const confirmClose = useConfirmClose({
    enable: !projectReadOnly,
    determineRequiresConfirmation: () =>
      !projectReadOnly && !form.state.isDefaultValue,
    onCloseConfirmed: () => {
      form.reset();
      closeDialog();
    },
  });
  const options = useMemo(
    () => smdaOptions(smdaHeaders, inaccessibleSmdaData),
    [inaccessibleSmdaData, smdaHeaders],
  );

  useEffect(() => {
    handleErrorUnknownInitialValue(
      form.setFieldMeta,
      "targets.smda.uuid",
      options,
      getElementMappingTargetNameOptionsInitialValue(row, "smda"),
    );
  }, [form.setFieldMeta, options, row]);

  const simulatorNameValidation = useMemo(
    () =>
      z
        .string()
        .refine(
          (simulatorName) =>
            !simulatorName.trim() ||
            !Object.values(elementMappings).some(
              (elementMapping) =>
                elementMapping.name !== row.name &&
                elementMapping.targets.simulator?.name === simulatorName.trim(),
            ),
          {
            error:
              "This simulator name is already mapped to another RMS wellbore",
          },
        ),
    [elementMappings, row.name],
  );
  const smdaHelperText = row.meta.planned
    ? "SMDA mapping is disabled because this is a planned wellbore"
    : !smdaHealthStatus
      ? "Connect to SMDA to edit the SMDA name"
      : inaccessibleSmdaData
        ? "This existing mapping is unavailable in the current SMDA results"
        : undefined;

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={true}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
        $minWidth="30em"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>Edit wellbore: {row.name}</Dialog.Header>

          <Dialog.CustomContent>
            <MappingEditFields>
              <form.AppField
                name="targets.simulator.name"
                validators={{
                  onMount: simulatorNameValidation,
                  onBlur: simulatorNameValidation,
                }}
              >
                {(field) => (
                  <field.TextField
                    label="Simulator name"
                    placeholder={emptyName}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="targets.smda.uuid"
                validators={{
                  onChange:
                    undefined /* Resets errors set by setFieldMeta after the user selects an option */,
                }}
              >
                {(field) => (
                  <field.AutocompleteField
                    label="SMDA name"
                    options={options}
                    optionValue={(option) => option.value}
                    emptyValue={specialOptions.empty.value}
                    disabled={(row.meta.planned ?? false) || !smdaHealthStatus}
                    helperText={smdaHelperText}
                    optionLabel={(option) => option.label}
                    optionComponent={(option) =>
                      option.value === specialOptions.divider.value ? (
                        <SmdaOptionDivider />
                      ) : undefined
                    }
                    optionDisabled={(option) =>
                      option.value === specialOptions.divider.value
                    }
                    noOptionsText="No SMDA names found"
                  />
                )}
              </form.AppField>
            </MappingEditFields>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <form.AppForm>
              <form.Subscribe
                selector={(state) =>
                  [state.isDefaultValue, state.canSubmit] as const
                }
              >
                {([isDefaultValue, canSubmit]) => (
                  <>
                    <form.SubmitButton
                      label="Save"
                      disabled={
                        isDefaultValue ||
                        !canSubmit ||
                        projectReadOnly ||
                        isPending
                      }
                      isPending={isPending}
                      helperTextDisabled={
                        projectReadOnly
                          ? "Project is read-only"
                          : "Form can be saved when the values have changed"
                      }
                    />
                    <form.CancelButton
                      onClick={(event) => {
                        event.preventDefault();
                        confirmClose.handleCloseRequest();
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

const wellboreMappingColumns: ColumnDef<ElementMapping>[] = [
  {
    id: "rmsWellboreName",
    accessorFn: wellboreMappingDisplayValue.rmsWellboreName,
    header: "RMS",
    size: 210,
  },
  {
    id: "simulatorName",
    accessorFn: wellboreMappingDisplayValue.simulatorName,
    header: "Simulator",
    size: 210,
  },
  {
    id: "smdaName",
    accessorFn: wellboreMappingDisplayValue.smdaName,
    header: "SMDA",
    size: 210,
    sortingFn: (rowA, rowB) => {
      const valueForSorting = (row: ElementMapping) => {
        const smdaTarget = row.targets.smda;
        if (!smdaTarget?.name && !smdaTarget?.unmappable) {
          return { rank: 0, name: "" };
        }
        if (smdaTarget.unmappable) {
          return {
            rank: 1,
            name: getElementMappingTargetName(row, "smda"),
          };
        }

        return { rank: 2, name: smdaTarget.name };
      };
      const valueA = valueForSorting(rowA.original);
      const valueB = valueForSorting(rowB.original);

      return (
        valueA.rank - valueB.rank || stringCompare(valueA.name, valueB.name)
      );
    },
  },
];

export function WellboreMappingsTable({
  elementMappings,
  smdaHeaders,
  smdaHeadersError,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
  isSaving,
  saveMappings,
}: {
  elementMappings: ElementMappings;
  smdaHeaders: SmdaWellHeader[];
  smdaHeadersError: boolean;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
  isSaving: boolean;
  saveMappings: SaveWellboreMappings;
}) {
  const [activeRow, setActiveRow] = useState<ElementMapping>();
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>(
    [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>([]);
  const rows = useMemo(() => Object.values(elementMappings), [elementMappings]);
  const filteredRowCount = useMemo(
    () => rows.filter((row) => matchesColumnFilters(row, columnFilters)).length,
    [columnFilters, rows],
  );
  const manualSmdaMappingCount = useMemo(
    () =>
      rows.filter(
        (row) =>
          !row.meta.planned &&
          !row.targets.smda?.name &&
          !row.targets.smda?.unmappable,
      ).length,
    [rows],
  );
  const inaccessibleSmdaData = useMemo(() => {
    const smdaTarget = activeRow?.targets.smda;
    const smdaResultsIncomplete = smdaHeadersError || !smdaHealthStatus;
    if (
      !smdaResultsIncomplete ||
      !smdaTarget?.uuid ||
      smdaHeaders.some((header) => header.wellbore_uuid === smdaTarget.uuid)
    ) {
      return undefined;
    }

    return { name: smdaTarget.name, uuid: smdaTarget.uuid };
  }, [activeRow, smdaHeaders, smdaHeadersError, smdaHealthStatus]);

  const saveEditedMapping = (formValue: ElementMapping) => {
    const smdaUuid = formValue.targets.smda?.uuid ?? "";
    const targetUpdates: ElementMappingTargetUpdates = {
      simulator: {
        name: formValue.targets.simulator?.name.trim() ?? "",
        uuid: "",
      },
      smda: {
        name:
          (inaccessibleSmdaData?.uuid === smdaUuid
            ? inaccessibleSmdaData.name
            : smdaHeaders.find((header) => header.wellbore_uuid === smdaUuid)
                ?.unique_wellbore_identifier) ?? "",
        uuid: smdaUuid,
      },
    };
    const updated = updatedElementMapping(formValue, targetUpdates);

    const mutationValue =
      createMutationValue<InternalWellboreIdentifierMapping>(
        "wellbore",
        "rms",
        { ...elementMappings, [formValue.name]: updated },
      );

    saveMappings(mutationValue, {
      successMessage: "Wellbore mappings saved",
      onSuccess: () => {
        setActiveRow(undefined);
      },
    });
  };

  return (
    <>
      {activeRow && (
        <EditMappingDialog
          row={activeRow}
          elementMappings={elementMappings}
          smdaHeaders={smdaHeaders}
          inaccessibleSmdaData={inaccessibleSmdaData}
          smdaHealthStatus={smdaHealthStatus}
          projectReadOnly={projectReadOnly}
          isPending={isSaving}
          closeDialog={() => {
            setActiveRow(undefined);
          }}
          saveMapping={saveEditedMapping}
        />
      )}

      {editMode && !projectReadOnly && rows.length > 0 && (
        <PageText>
          Select a row to edit its simulator and SMDA names. Planned wellbores
          can only be mapped to simulator names.
        </PageText>
      )}

      {rows.length ? (
        <>
          <PageText>
            <span className="emphasis">{rows.length}</span> wellbores are stored
            in the project.
            <br />
            <span className="emphasis">{manualSmdaMappingCount}</span> wellbores
            need SMDA mapping.
          </PageText>

          <WellboreMappingsContainer>
            <EdsDataGrid
              stickyHeader
              enableVirtual
              height={dataGridHeight(
                filteredRowCount,
                WELLBORE_MAPPINGS_GRID_MAX_HEIGHT,
              )}
              rows={rows}
              columns={wellboreMappingColumns}
              getRowId={(row) => row.name}
              enableSorting
              sortingState={sorting}
              onSortingChange={setSorting}
              enableColumnFiltering
              columnFiltersState={columnFilters}
              onColumnFiltersChange={setColumnFilters}
              rowClass={(row) =>
                [
                  editMode && !projectReadOnly && "editable-row",
                  row.original.meta.planned && "planned-row",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              onRowClick={(selectedRow) => {
                if (editMode && !projectReadOnly) {
                  setActiveRow(selectedRow.original);
                }
              }}
              emptyMessage="No RMS wellbores match the current filters."
            />
          </WellboreMappingsContainer>

          <PageText $marginBottom="0">Table controls:</PageText>
          <PageList>
            <List.Item>Select a column title to sort the table</List.Item>
            <List.Item>
              Hover over a column title and select the filter icon to filter its
              values
            </List.Item>
            <List.Item>
              For example, filter SMDA by{" "}
              <span className="emphasis">"{emptyName}"</span> to find wellbores
              without an SMDA mapping
            </List.Item>
          </PageList>
        </>
      ) : (
        <PageCode>
          No RMS wellbores are currently included for wellbore mapping.
        </PageCode>
      )}
    </>
  );
}
