import { Checkbox, Dialog, List } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { type AnyFormApi, createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import type { RmsProject, RmsWell } from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectPatchRmsWellsMutation,
  rmsGetWellsOptions,
} from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog, OrphanWarningBox } from "#components/common";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import type {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form.tsx";
import {
  ActionButtonsContainer,
  EditDialog,
  PageCode,
  PageList,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api.ts";
import { fieldContext, formContext, useFormContext } from "#utils/form";
import { useConfirmClose } from "#utils/ui.ts";
import { WellsContainer } from "./Wellbores.style";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: { WellboresEditor, CancelButton, SubmitButton },
});

function sortByAvailableOrder(
  wells: RmsWell[],
  availableWells: RmsWell[],
): RmsWell[] {
  const order = new Map(availableWells.map((well, idx) => [well.name, idx]));

  return [...wells].sort(
    (a, b) =>
      (order.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(b.name) ?? Number.MAX_SAFE_INTEGER),
  );
}

// The grid header and each row are 48px high at the EDS comfortable density.
// Firefox also uses this fixed estimate because EDS disables dynamic row
// measurement there.
const GRID_ROW_HEIGHT = 48;

// Keep short grids only as tall as their header and rows. Cap long grids at
// maxHeight so they scroll and virtualize instead of expanding the page.
function gridHeight(rowCount: number, maxHeight: number): number {
  return Math.min((rowCount + 1) * GRID_ROW_HEIGHT, maxHeight);
}

const storedWellColumns: ColumnDef<RmsWell>[] = [
  {
    accessorKey: "name",
    header: "Well",
    size: 200,
  },
  {
    id: "planned",
    header: "Planned",
    accessorFn: (row) => (row.planned ? "Yes" : "No"),
    size: 200,
  },
];

function WellboresEditor({ availableWells }: { availableWells: RmsWell[] }) {
  const form: AnyFormApi = useFormContext();
  const projectWells = form.getFieldValue("wells") as RmsWell[];

  const availableNames = useMemo(
    () => new Set(availableWells.map((well) => well.name)),
    [availableWells],
  );
  const selectedNames = new Set(projectWells.map((well) => well.name));
  const plannedByName = new Map(
    projectWells.map((well) => [well.name, well.planned ?? false]),
  );

  const orphanWellNames = projectWells
    .filter((well) => !availableNames.has(well.name))
    .map((well) => well.name);
  const hasOrphans = orphanWellNames.length > 0;
  const includedCount = projectWells.filter((well) =>
    availableNames.has(well.name),
  ).length;

  useEffect(() => {
    form.setErrorMap({
      onChange: hasOrphans ? ["Outdated wells are present"] : undefined,
    });
  }, [form, hasOrphans]);

  const setWells = (wells: RmsWell[]) => {
    form.setFieldValue("wells", sortByAvailableOrder(wells, availableWells));
  };

  const toggleSelected = (name: string) => {
    if (selectedNames.has(name)) {
      setWells(projectWells.filter((well) => well.name !== name));
    } else {
      setWells([...projectWells, { name, planned: false }]);
    }
  };

  const removeOrphans = () => {
    setWells(projectWells.filter((well) => availableNames.has(well.name)));
  };

  const togglePlanned = (name: string) => {
    setWells(
      projectWells.map((well) =>
        well.name === name ? { ...well, planned: !well.planned } : well,
      ),
    );
  };

  const selectAll = () => {
    setWells(
      availableWells.map((well) => ({
        name: well.name,
        planned: plannedByName.get(well.name) ?? false,
      })),
    );
  };

  const deselectAll = () => {
    setWells([]);
  };

  const allSelected =
    !hasOrphans &&
    projectWells.length === availableWells.length &&
    availableWells.every((well) => selectedNames.has(well.name));

  const columns: ColumnDef<RmsWell>[] = [
    {
      id: "include",
      header: "Include",
      enableColumnFilter: false,
      enableSorting: false,
      size: 90,
      cell: ({ row }) => {
        const name = row.original.name;

        return (
          <Checkbox
            checked={selectedNames.has(name)}
            onChange={() => {
              toggleSelected(name);
            }}
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: "Well",
      size: 200,
    },
    {
      id: "planned",
      header: "Planned",
      enableColumnFilter: false,
      enableSorting: false,
      size: 90,
      cell: ({ row }) => {
        const name = row.original.name;
        const isSelected = selectedNames.has(name);

        return (
          <Checkbox
            checked={plannedByName.get(name) ?? false}
            disabled={!isSelected}
            onChange={() => {
              togglePlanned(name);
            }}
          />
        );
      },
    },
  ];

  return (
    <>
      {hasOrphans && (
        <OrphanWarningBox
          message={`${orphanWellNames.length} ${
            orphanWellNames.length === 1 ? "well stored" : "wells stored"
          } in the project ${
            orphanWellNames.length === 1 ? "is" : "are"
          } no longer available in RMS. Remove ${
            orphanWellNames.length === 1 ? "it" : "them"
          } before saving.`}
          listItems={orphanWellNames}
          buttonLabel="Remove outdated wells"
          onRemove={removeOrphans}
        />
      )}

      <PageText>
        <span className="emphasis">{includedCount}</span> of{" "}
        {availableWells.length} RMS{" "}
        {availableWells.length === 1 ? "well" : "wells"}{" "}
        {includedCount === 1 ? "is" : "are"} included.
      </PageText>

      <WellsContainer>
        <EdsDataGrid
          stickyHeader
          enableVirtual
          height={gridHeight(availableWells.length, 391)}
          rows={availableWells}
          columns={columns}
          getRowId={(row) => row.name}
          // Keep the Well column filter visible because the hint points users
          // to it. Other filter icons appear on hover or focus as usual.
          headerClass={(column) =>
            column.id === "name" ? "persistent-filter" : ""
          }
          enableSorting
          enableColumnFiltering
          emptyMessage="No RMS wells available."
        />
      </WellsContainer>

      <ActionButtonsContainer>
        <GeneralButton
          label="Select all"
          variant="outlined"
          disabled={allSelected}
          onClick={selectAll}
        />
        <GeneralButton
          label="Deselect all"
          variant="outlined"
          disabled={!projectWells.length}
          onClick={deselectAll}
        />
      </ActionButtonsContainer>

      <PageText $marginBottom="0">💡 Tips</PageText>
      <PageList>
        <List.Item>
          When no wells are stored, all available RMS wells are selected when
          you open the editor.
        </List.Item>
        <List.Item>
          Use the filter in the Well column to find wells, then clear their
          checkbox to exclude them from the project.
        </List.Item>
        <List.Item>
          Mark a well as planned to store it without making it available for
          wellbore mapping.
        </List.Item>
      </PageList>
    </>
  );
}

function Edit({
  projectWells,
  projectReadOnly,
  isDialogOpen,
  closeDialog,
  isRmsProjectOpen,
}: {
  projectWells: RmsWell[];
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  closeDialog: () => void;
  isRmsProjectOpen: boolean;
}) {
  const availableWellsQuery = useQuery({
    ...rmsGetWellsOptions(),
    enabled: isRmsProjectOpen,
  });
  const isInitialized = useRef(false);
  const availableWellsLoaded = availableWellsQuery.isSuccess;

  const queryClient = useQueryClient();

  const rmsWellsMutation = useMutation({
    ...projectPatchRmsWellsMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message, { autoClose: false });
      }
    },
    meta: {
      errorPrefix: "Error updating project wells",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const form = useAppForm({
    defaultValues: {
      wells: projectWells,
    },
    onSubmit: ({ value, formApi }) => {
      if (!projectReadOnly) {
        mutationCallback({
          formValue: value.wells,
          formSubmitCallback,
          formReset: formApi.reset,
        });
      }
    },
  });

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<RmsWell[]>) => {
    rmsWellsMutation.mutate(
      { body: formValue },
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

  // Auto-select all available wells when opening the dialog with no stored
  // wells. The user must still save the selection explicitly.
  useEffect(() => {
    if (!isDialogOpen) {
      isInitialized.current = false;

      return;
    }

    if (isInitialized.current || !availableWellsQuery.isSuccess) {
      return;
    }

    if (projectWells.length === 0) {
      form.setFieldValue(
        "wells",
        availableWellsQuery.data.map((well) => ({
          name: well.name,
          planned: false,
        })),
      );
    }

    isInitialized.current = true;
  }, [
    isDialogOpen,
    availableWellsQuery.data,
    availableWellsQuery.isSuccess,
    projectWells.length,
    form,
  ]);

  const confirmClose = useConfirmClose({
    enable: isDialogOpen && !projectReadOnly,
    determineRequiresConfirmation: () =>
      !projectReadOnly && !form.state.isDefaultValue,
    onCloseConfirmed: () => {
      form.reset();
      closeDialog();
    },
  });

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={isDialogOpen}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
        $minWidth="36em"
        $maxWidth="36em"
      >
        <Dialog.Header>Set project wells</Dialog.Header>

        <Dialog.CustomContent>
          {availableWellsQuery.isPending ? (
            <PageText>Loading RMS wells...</PageText>
          ) : availableWellsQuery.isError ? (
            <PageText>
              Could not load wells from RMS. Reload the RMS project and try
              again.
            </PageText>
          ) : availableWellsQuery.data.length === 0 &&
            projectWells.length === 0 ? (
            <PageText>
              No wells are available in RMS. Add wells to the RMS project, then
              reload the RMS project.
            </PageText>
          ) : (
            <form.AppForm>
              <form.Subscribe selector={(state) => state.values}>
                {() => (
                  <form.WellboresEditor
                    availableWells={availableWellsQuery.data}
                  />
                )}
              </form.Subscribe>
            </form.AppForm>
          )}
        </Dialog.CustomContent>

        {/*
          The submit button is kept in its own form element, separate from the
          editor grid above. EdsDataGrid renders its sort/filter controls as
          native buttons/inputs without an explicit type, so having them inside
          a form would cause accidental submits when sorting or filtering.
        */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Actions>
            <form.Subscribe
              selector={(state) =>
                [state.isDefaultValue, state.canSubmit] as const
              }
            >
              {([isDefaultValue, canSubmit]) => (
                <form.SubmitButton
                  label="Save"
                  disabled={
                    isDefaultValue ||
                    !canSubmit ||
                    projectReadOnly ||
                    !availableWellsLoaded ||
                    rmsWellsMutation.isPending
                  }
                  isPending={rmsWellsMutation.isPending}
                  helperTextDisabled={
                    projectReadOnly
                      ? "Project is read-only"
                      : !availableWellsLoaded
                        ? "RMS wells must be loaded before saving"
                        : !canSubmit
                          ? "Remove outdated wells before saving"
                          : "Form can be saved when the values have changed"
                  }
                />
              )}
            </form.Subscribe>
            <form.CancelButton
              onClick={(e) => {
                e.preventDefault();
                confirmClose.handleCloseRequest();
              }}
            />
          </Dialog.Actions>
        </form>
      </EditDialog>
    </>
  );
}

export function Wellbores({
  rmsData,
  projectReadOnly,
  isRmsProjectOpen,
}: {
  rmsData: RmsProject | undefined | null;
  projectReadOnly: boolean;
  isRmsProjectOpen: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectWells = rmsData?.wells ?? [];

  const closeDialog = () => {
    setIsDialogOpen(false);
  };
  const openDialog = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageSectionWidthConstrained>
        <PageText>
          The following wells are stored in the project. Planned wells are
          excluded from wellbore mapping. All other stored wells are available
          for mapping.
        </PageText>
      </PageSectionWidthConstrained>

      {projectWells.length ? (
        <>
          <PageSectionWidthConstrained>
            <PageText>
              <span className="emphasis">{projectWells.length}</span>{" "}
              {projectWells.length === 1 ? "well is" : "wells are"} included in
              the project.
            </PageText>
          </PageSectionWidthConstrained>

          <PageSectionWidthConstrained>
            <WellsContainer>
              <EdsDataGrid
                stickyHeader
                enableVirtual
                height={gridHeight(projectWells.length, 576)}
                rows={projectWells}
                columns={storedWellColumns}
                getRowId={(row) => row.name}
                enableSorting
                enableColumnFiltering
              />
            </WellsContainer>
          </PageSectionWidthConstrained>
        </>
      ) : (
        <PageSectionWidthConstrained>
          <PageCode>No wells currently stored in the project.</PageCode>
        </PageSectionWidthConstrained>
      )}

      <PageSectionWidthConstrained>
        <GeneralButton
          label={projectWells.length ? "Edit" : "Add"}
          disabled={projectReadOnly || !isRmsProjectOpen}
          tooltipText={
            projectReadOnly
              ? "Project is read-only"
              : !isRmsProjectOpen
                ? "RMS project is not ready for access"
                : undefined
          }
          onClick={openDialog}
        />
      </PageSectionWidthConstrained>

      <Edit
        projectWells={projectWells}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        closeDialog={closeDialog}
        isRmsProjectOpen={isRmsProjectOpen}
      />
    </>
  );
}
