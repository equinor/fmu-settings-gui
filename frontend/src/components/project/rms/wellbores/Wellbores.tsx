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
  WellboreFilterContainer,
  WellboreSearch,
  WellboresContainer,
} from "./Wellbores.style";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: { WellboresEditor, CancelButton, SubmitButton },
});

function sortWellboresByAvailableOrder(
  wellbores: RmsWell[],
  availableWellbores: RmsWell[],
): RmsWell[] {
  const order = new Map(
    availableWellbores.map((wellbore, idx) => [wellbore.name, idx]),
  );

  return [...wellbores].sort(
    (wellboreA, wellboreB) =>
      (order.get(wellboreA.name) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(wellboreB.name) ?? Number.MAX_SAFE_INTEGER),
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

const storedWellboreColumns: ColumnDef<RmsWell>[] = [
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

function WellboresEditor({
  availableWellbores,
}: {
  availableWellbores: RmsWell[];
}) {
  const form: AnyFormApi = useFormContext();
  const projectWellbores = form.getFieldValue("wells") as RmsWell[];
  const [wellboreFilter, setWellboreFilter] = useState("");

  const availableWellboreNames = useMemo(
    () => new Set(availableWellbores.map((wellbore) => wellbore.name)),
    [availableWellbores],
  );
  const selectedWellboreNames = new Set(
    projectWellbores.map((wellbore) => wellbore.name),
  );
  const plannedByWellboreName = useRef(
    new Map(
      projectWellbores.map((wellbore) => [
        wellbore.name,
        wellbore.planned ?? false,
      ]),
    ),
  );

  const orphanWellboreNames = projectWellbores
    .filter((wellbore) => !availableWellboreNames.has(wellbore.name))
    .map((wellbore) => wellbore.name);
  const hasOrphans = orphanWellboreNames.length > 0;
  const includedWellboreCount = projectWellbores.filter((wellbore) =>
    availableWellboreNames.has(wellbore.name),
  ).length;
  const normalizedWellboreFilter = wellboreFilter
    .trim()
    .toLocaleLowerCase(applicationLocale);
  const visibleWellbores = useMemo(
    () =>
      normalizedWellboreFilter
        ? availableWellbores.filter((wellbore) =>
            wellbore.name
              .toLocaleLowerCase(applicationLocale)
              .includes(normalizedWellboreFilter),
          )
        : availableWellbores,
    [availableWellbores, normalizedWellboreFilter],
  );
  const visibleWellboreNames = useMemo(
    () => new Set(visibleWellbores.map((wellbore) => wellbore.name)),
    [visibleWellbores],
  );

  const setWellbores = (wellbores: RmsWell[]) => {
    form.setFieldValue(
      "wells",
      sortWellboresByAvailableOrder(wellbores, availableWellbores),
    );
  };

  const toggleWellboreSelected = (wellboreName: string) => {
    if (selectedWellboreNames.has(wellboreName)) {
      setWellbores(
        projectWellbores.filter((wellbore) => wellbore.name !== wellboreName),
      );
    } else {
      setWellbores([
        ...projectWellbores,
        {
          name: wellboreName,
          planned: plannedByWellboreName.current.get(wellboreName) ?? false,
        },
      ]);
    }
  };

  const toggleWellborePlanned = (wellboreName: string) => {
    const planned = !(plannedByWellboreName.current.get(wellboreName) ?? false);
    plannedByWellboreName.current.set(wellboreName, planned);
    setWellbores(
      projectWellbores.map((wellbore) =>
        wellbore.name === wellboreName ? { ...wellbore, planned } : wellbore,
      ),
    );
  };

  const selectVisibleWellbores = () => {
    setWellbores([
      ...projectWellbores,
      ...visibleWellbores
        .filter((wellbore) => !selectedWellboreNames.has(wellbore.name))
        .map((wellbore) => ({
          name: wellbore.name,
          planned: plannedByWellboreName.current.get(wellbore.name) ?? false,
        })),
    ]);
  };

  const deselectVisibleWellbores = () => {
    setWellbores(
      projectWellbores.filter(
        (wellbore) => !visibleWellboreNames.has(wellbore.name),
      ),
    );
  };

  const allVisibleWellboresSelected =
    visibleWellbores.length > 0 &&
    visibleWellbores.every((wellbore) =>
      selectedWellboreNames.has(wellbore.name),
    );
  const someVisibleWellboresSelected = visibleWellbores.some((wellbore) =>
    selectedWellboreNames.has(wellbore.name),
  );

  const wellboreColumns: ColumnDef<RmsWell>[] = [
    {
      id: "include",
      header: "Include",
      enableColumnFilter: false,
      enableSorting: false,
      size: 90,
      cell: ({ row }) => {
        const wellboreName = row.original.name;

        return (
          <Checkbox
            checked={selectedWellboreNames.has(wellboreName)}
            onChange={() => {
              toggleWellboreSelected(wellboreName);
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
        const wellboreName = row.original.name;
        const isSelected = selectedWellboreNames.has(wellboreName);

        return (
          <Checkbox
            checked={plannedByWellboreName.current.get(wellboreName) ?? false}
            disabled={!isSelected}
            onChange={() => {
              toggleWellborePlanned(wellboreName);
            }}
          />
        );
      },
    },
  ];

  return (
    <>
      <PageText>
        <span className="emphasis">{includedWellboreCount}</span> of{" "}
        {availableWellbores.length} RMS{" "}
        {availableWellbores.length === 1 ? "wellbore" : "wellbores"}{" "}
        {includedWellboreCount === 1 ? "is" : "are"} included.
      </PageText>

      <WellboreFilterContainer>
        <WellboreSearch
          placeholder="Filter wellbores"
          value={wellboreFilter}
          onChange={(event) => {
            setWellboreFilter(event.target.value);
          }}
        />
        {normalizedWellboreFilter && (
          <PageText $marginBottom="0">
            Filter is showing{" "}
            <span className="emphasis">{visibleWellbores.length}</span> of{" "}
            {availableWellbores.length} wellbores.
          </PageText>
        )}
      </WellboreFilterContainer>

      <WellboresContainer>
        <EdsDataGrid
          stickyHeader
          enableVirtual
          height={gridHeight(visibleWellbores.length, 391)}
          rows={visibleWellbores}
          columns={wellboreColumns}
          getRowId={(row) => row.name}
          rowClass={(row) =>
            plannedByWellboreName.current.get(row.original.name)
              ? "planned-row"
              : ""
          }
          enableSorting
          emptyMessage={
            normalizedWellboreFilter
              ? "No wellbores match the filter."
              : "No RMS wellbores available."
          }
        />
      </WellboresContainer>

      <ActionButtonsContainer>
        <GeneralButton
          label={
            normalizedWellboreFilter
              ? "Select all filtered wellbores"
              : "Select all wellbores"
          }
          variant="outlined"
          disabled={!visibleWellbores.length || allVisibleWellboresSelected}
          onClick={selectVisibleWellbores}
        />
        <GeneralButton
          label={
            normalizedWellboreFilter
              ? "Deselect all filtered wellbores"
              : "Deselect all wellbores"
          }
          variant="outlined"
          disabled={!someVisibleWellboresSelected}
          onClick={deselectVisibleWellbores}
        />
      </ActionButtonsContainer>

      {hasOrphans && (
        <OrphanWarningBox
          message={`${orphanWellboreNames.length} ${
            orphanWellboreNames.length === 1
              ? "wellbore stored"
              : "wellbores stored"
          } in the project ${
            orphanWellboreNames.length === 1 ? "is" : "are"
          } currently not available in RMS. ${
            orphanWellboreNames.length === 1 ? "It" : "They"
          } will be removed when you save.`}
          listItems={orphanWellboreNames}
        />
      )}

      <PageText $marginBottom="0">💡 Tips:</PageText>
      <PageList $marginBottom="0">
        <List.Item>
          When there are no wellbores stored in the project, all available RMS
          wellbores in the list are initially selected
        </List.Item>
        <List.Item>
          The list can be filtered by wellbore name, and <i>Select</i> and{" "}
          <i>Deselect</i> buttons will then operate on the filtered list
        </List.Item>
        <List.Item>
          Use the <i>Include</i> checkboxes to select individual wellbores for
          storing to the project
        </List.Item>
        <List.Item>
          Mark a wellbore as planned to store it in the project without making
          it available for wellbore mapping
        </List.Item>
      </PageList>
    </>
  );
}

function Edit({
  projectWellbores,
  projectReadOnly,
  isDialogOpen,
  closeDialog,
  isRmsProjectOpen,
}: {
  projectWellbores: RmsWell[];
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  closeDialog: () => void;
  isRmsProjectOpen: boolean;
}) {
  const availableWellboresQuery = useQuery({
    ...rmsGetWellsOptions(),
    enabled: isRmsProjectOpen,
  });
  const isInitialized = useRef(false);
  const availableWellboresLoaded = availableWellboresQuery.isSuccess;

  const queryClient = useQueryClient();

  const rmsWellboresMutation = useMutation({
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
      wells: projectWellbores,
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
    const availableWellboreNames = new Set(
      availableWellboresQuery.data?.map((wellbore) => wellbore.name),
    );

    rmsWellboresMutation.mutate(
      {
        body: formValue.wells.filter((wellbore) =>
          availableWellboreNames.has(wellbore.name),
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

  // Auto-select all available wellbores when opening the dialog with no stored
  // wellbores. The user must still save the selection explicitly.
  useEffect(() => {
    if (!isDialogOpen) {
      isInitialized.current = false;

      return;
    }

    if (isInitialized.current || !availableWellboresQuery.isSuccess) {
      return;
    }

    if (projectWellbores.length === 0) {
      form.setFieldValue(
        "wells",
        availableWellboresQuery.data.map((wellbore) => ({
          name: wellbore.name,
          planned: false,
        })),
      );
    }

    isInitialized.current = true;
  }, [
    isDialogOpen,
    availableWellboresQuery.data,
    availableWellboresQuery.isSuccess,
    projectWellbores.length,
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
          {availableWellboresQuery.isPending ? (
            <PageText>Loading RMS wellbores...</PageText>
          ) : availableWellboresQuery.isError ? (
            <PageText>
              Could not load wellbores from RMS. Reload the RMS project and try
              again.
            </PageText>
          ) : (
            <>
              {availableWellboresQuery.data.length === 0 && (
                <PageText>
                  No wellbores are available in RMS. Add wellbores to the RMS
                  project, then reload the RMS project.
                </PageText>
              )}

              {(availableWellboresQuery.data.length > 0 ||
                projectWellbores.length > 0) && (
                <form.AppForm>
                  <form.Subscribe selector={(state) => state.values}>
                    {() => (
                      <form.WellboresEditor
                        key={isDialogOpen ? "open" : "closed"}
                        availableWellbores={availableWellboresQuery.data}
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
        <Dialog.Actions>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Subscribe
              selector={(state) =>
                [
                  state.isDefaultValue,
                  state.canSubmit,
                  state.values.wells,
                ] as const
              }
            >
              {([isDefaultValue, canSubmit, wellbores]) => {
                const availableWellboreNames = new Set(
                  availableWellboresQuery.data?.map(
                    (wellbore) => wellbore.name,
                  ),
                );
                const hasOrphans = wellbores.some(
                  (wellbore) => !availableWellboreNames.has(wellbore.name),
                );

                return (
                  <form.SubmitButton
                    label="Save"
                    disabled={
                      (isDefaultValue && !hasOrphans) ||
                      !canSubmit ||
                      projectReadOnly ||
                      !availableWellboresLoaded ||
                      rmsWellboresMutation.isPending
                    }
                    isPending={rmsWellboresMutation.isPending}
                    helperTextDisabled={
                      projectReadOnly
                        ? "Project is read-only"
                        : !availableWellboresLoaded
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
          </form>
        </Dialog.Actions>
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

  const projectWellbores = rmsData?.wells ?? [];

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

      {projectWellbores.length ? (
        <>
          <PageText>
            <span className="emphasis">{projectWellbores.length}</span>{" "}
            {projectWellbores.length === 1 ? "wellbore is" : "wellbores are"}{" "}
            included in the project.
          </PageText>

          <WellboresContainer>
            <EdsDataGrid
              stickyHeader
              enableVirtual
              height={gridHeight(projectWellbores.length, 576)}
              rows={projectWellbores}
              columns={storedWellboreColumns}
              getRowId={(row) => row.name}
              rowClass={(row) => (row.original.planned ? "planned-row" : "")}
              enableSorting
              enableColumnFiltering
            />
          </WellboresContainer>
        </>
      ) : (
        <PageCode>No wellbores are currently stored in the project.</PageCode>
      )}

      <GeneralButton
        label={projectWellbores.length ? "Edit" : "Add"}
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
        projectWellbores={projectWellbores}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        closeDialog={closeDialog}
        isRmsProjectOpen={isRmsProjectOpen}
      />
    </>
  );
}
