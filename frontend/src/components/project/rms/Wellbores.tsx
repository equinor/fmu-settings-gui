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
import { applicationLocale } from "#config";
import {
  ActionButtonsContainer,
  EditDialog,
  PageCode,
  PageList,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api.ts";
import { fieldContext, formContext, useFormContext } from "#utils/form";
import { useConfirmClose } from "#utils/ui.ts";
import {
  WellFilterContainer,
  WellSearch,
  WellsContainer,
} from "./Wellbores.style";

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
  const bodyRowCount = Math.max(rowCount, 1);

  return Math.min((bodyRowCount + 1) * GRID_ROW_HEIGHT, maxHeight);
}

const storedWellColumns: ColumnDef<RmsWell>[] = [
  {
    accessorKey: "name",
    header: "Wellbore",
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
  const [wellFilter, setWellFilter] = useState("");

  const availableNames = useMemo(
    () => new Set(availableWells.map((well) => well.name)),
    [availableWells],
  );
  const selectedNames = new Set(projectWells.map((well) => well.name));
  const plannedByName = useRef(
    new Map(projectWells.map((well) => [well.name, well.planned ?? false])),
  );

  const orphanWellNames = projectWells
    .filter((well) => !availableNames.has(well.name))
    .map((well) => well.name);
  const hasOrphans = orphanWellNames.length > 0;
  const includedCount = projectWells.filter((well) =>
    availableNames.has(well.name),
  ).length;
  const normalizedWellFilter = wellFilter
    .trim()
    .toLocaleLowerCase(applicationLocale);
  const visibleWells = useMemo(
    () =>
      normalizedWellFilter
        ? availableWells.filter((well) =>
            well.name
              .toLocaleLowerCase(applicationLocale)
              .includes(normalizedWellFilter),
          )
        : availableWells,
    [availableWells, normalizedWellFilter],
  );
  const visibleNames = useMemo(
    () => new Set(visibleWells.map((well) => well.name)),
    [visibleWells],
  );

  const setWells = (wells: RmsWell[]) => {
    form.setFieldValue("wells", sortByAvailableOrder(wells, availableWells));
  };

  const toggleSelected = (name: string) => {
    if (selectedNames.has(name)) {
      setWells(projectWells.filter((well) => well.name !== name));
    } else {
      setWells([
        ...projectWells,
        { name, planned: plannedByName.current.get(name) ?? false },
      ]);
    }
  };

  const togglePlanned = (name: string) => {
    const planned = !(plannedByName.current.get(name) ?? false);
    plannedByName.current.set(name, planned);
    setWells(
      projectWells.map((well) =>
        well.name === name ? { ...well, planned } : well,
      ),
    );
  };

  const selectVisible = () => {
    setWells([
      ...projectWells,
      ...visibleWells
        .filter((well) => !selectedNames.has(well.name))
        .map((well) => ({
          name: well.name,
          planned: plannedByName.current.get(well.name) ?? false,
        })),
    ]);
  };

  const deselectVisible = () => {
    setWells(projectWells.filter((well) => !visibleNames.has(well.name)));
  };

  const allVisibleSelected =
    visibleWells.length > 0 &&
    visibleWells.every((well) => selectedNames.has(well.name));
  const someVisibleSelected = visibleWells.some((well) =>
    selectedNames.has(well.name),
  );

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
      header: "Wellbore",
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
            checked={plannedByName.current.get(name) ?? false}
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
            orphanWellNames.length === 1
              ? "wellbore stored"
              : "wellbores stored"
          } in the project ${
            orphanWellNames.length === 1 ? "is" : "are"
          } currently not available in RMS. ${
            orphanWellNames.length === 1 ? "It" : "They"
          } will be removed when you save.`}
          listItems={orphanWellNames}
        />
      )}

      <PageText>
        <span className="emphasis">{includedCount}</span> of{" "}
        {availableWells.length} RMS{" "}
        {availableWells.length === 1 ? "wellbore" : "wellbores"}{" "}
        {includedCount === 1 ? "is" : "are"} included.
      </PageText>

      <WellFilterContainer>
        <WellSearch
          placeholder="Filter wellbores"
          value={wellFilter}
          onChange={(event) => {
            setWellFilter(event.target.value);
          }}
        />
        {normalizedWellFilter && (
          <PageText $marginBottom="0">
            Filter is showing{" "}
            <span className="emphasis">{visibleWells.length}</span> of{" "}
            {availableWells.length} wellbores.
          </PageText>
        )}
      </WellFilterContainer>

      <WellsContainer>
        <EdsDataGrid
          stickyHeader
          enableVirtual
          height={gridHeight(visibleWells.length, 391)}
          rows={visibleWells}
          columns={columns}
          getRowId={(row) => row.name}
          rowClass={(row) =>
            plannedByName.current.get(row.original.name) ? "planned-row" : ""
          }
          enableSorting
          emptyMessage={
            normalizedWellFilter
              ? "No wellbores match the filter."
              : "No RMS wellbores available."
          }
        />
      </WellsContainer>

      <ActionButtonsContainer>
        <GeneralButton
          label={
            normalizedWellFilter
              ? "Select all filtered wellbores"
              : "Select all wellbores"
          }
          variant="outlined"
          disabled={!visibleWells.length || allVisibleSelected}
          onClick={selectVisible}
        />
        <GeneralButton
          label={
            normalizedWellFilter
              ? "Deselect all filtered wellbores"
              : "Deselect all wellbores"
          }
          variant="outlined"
          disabled={!someVisibleSelected}
          onClick={deselectVisible}
        />
      </ActionButtonsContainer>

      <PageText $marginBottom="0">💡 Tips</PageText>
      <PageList>
        <List.Item>
          When no wellbores are stored, all available RMS wellbores are selected
          when you open the editor.
        </List.Item>
        <List.Item>
          Filter the table by wellbore name, then select or deselect all
          wellbores shown by the filter.
        </List.Item>
        <List.Item>
          Use Include checkboxes to select or deselect individual wellbores.
        </List.Item>
        <List.Item>
          Mark a wellbore as planned to store it without making it available for
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
      errorPrefix: "Error updating project wellbores",
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
          formValue: value,
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
  }: MutationCallbackProps<{ wells: RmsWell[] }>) => {
    const availableWellNames = new Set(
      availableWellsQuery.data?.map((well) => well.name),
    );

    rmsWellsMutation.mutate(
      {
        body: formValue.wells.filter((well) =>
          availableWellNames.has(well.name),
        ),
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
        $width="36em"
      >
        <Dialog.Header>Set project wellbores</Dialog.Header>

        <Dialog.CustomContent>
          {availableWellsQuery.isPending ? (
            <PageText>Loading RMS wellbores...</PageText>
          ) : availableWellsQuery.isError ? (
            <PageText>
              Could not load wellbores from RMS. Reload the RMS project and try
              again.
            </PageText>
          ) : (
            <>
              {availableWellsQuery.data.length === 0 && (
                <PageText>
                  No wellbores are available in RMS. Add wellbores to the RMS
                  project, then reload the RMS project.
                </PageText>
              )}

              {(availableWellsQuery.data.length > 0 ||
                projectWells.length > 0) && (
                <form.AppForm>
                  <form.Subscribe selector={(state) => state.values}>
                    {() => (
                      <form.WellboresEditor
                        key={isDialogOpen ? "open" : "closed"}
                        availableWells={availableWellsQuery.data}
                      />
                    )}
                  </form.Subscribe>
                </form.AppForm>
              )}
            </>
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
                [
                  state.isDefaultValue,
                  state.canSubmit,
                  state.values.wells,
                ] as const
              }
            >
              {([isDefaultValue, canSubmit, wells]) => {
                const availableWellNames = new Set(
                  availableWellsQuery.data?.map((well) => well.name),
                );
                const hasOrphans = wells.some(
                  (well) => !availableWellNames.has(well.name),
                );

                return (
                  <form.SubmitButton
                    label="Save"
                    disabled={
                      (isDefaultValue && !hasOrphans) ||
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
                          ? "RMS wellbores must be loaded before saving"
                          : "Form can be saved when the values have changed"
                    }
                  />
                );
              }}
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
      <PageText>
        The following wellbores are stored in the project. Planned wellbores are
        excluded from wellbore mapping. All other stored wellbores are available
        for mapping.
      </PageText>

      {projectWells.length ? (
        <>
          <PageText>
            <span className="emphasis">{projectWells.length}</span>{" "}
            {projectWells.length === 1 ? "wellbore is" : "wellbores are"}{" "}
            included in the project.
          </PageText>

          <WellsContainer>
            <EdsDataGrid
              stickyHeader
              enableVirtual
              height={gridHeight(projectWells.length, 576)}
              rows={projectWells}
              columns={storedWellColumns}
              getRowId={(row) => row.name}
              rowClass={(row) => (row.original.planned ? "planned-row" : "")}
              enableSorting
              enableColumnFiltering
            />
          </WellsContainer>
        </>
      ) : (
        <PageCode>No wellbores are currently stored in the project.</PageCode>
      )}

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
