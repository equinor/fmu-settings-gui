import { Dialog } from "@equinor/eds-core-react";
import { type AnyFormApi, createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "react-toastify";

import type {
  RmsHorizon,
  RmsProject,
  RmsStratigraphicFramework,
  RmsStratigraphicZone,
} from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectPatchRmsStratigraphicFrameworkMutation,
  rmsGetHorizonsOptions,
  rmsGetZonesOptions,
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
  GenericDialog,
  PageCode,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api.ts";
import { fieldContext, formContext, useFormContext } from "#utils/form";
import { useConfirmClose } from "#utils/ui.ts";
import { StratigraphicFramework } from "../stratigraphicFramework/StratigraphicFramework.tsx";
import { Horizons, Zones } from "./StratigraphicFramework";
import { StratigraphyEditorContainer } from "./Stratigraphy.style";
import { namesNotInReference, useItemHandlers } from "./utils.ts";

type ConfirmAction = "add" | "remove" | "";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: { StratigraphyEditor, CancelButton, SubmitButton },
});

function ConfirmActionDialog({
  setConfirmAction,
  onConfirm,
  confirmAction,
}: {
  onConfirm: () => void;
  setConfirmAction: Dispatch<SetStateAction<ConfirmAction>>;
  confirmAction: ConfirmAction;
}) {
  const resetConfirmAction = () => {
    setConfirmAction("");
  };

  return (
    <GenericDialog open={!!confirmAction} $minWidth="25em">
      <Dialog.Header>Confirm action</Dialog.Header>

      <Dialog.CustomContent>
        <PageText>
          {confirmAction === "add"
            ? "This will add all available stratigraphy to the project."
            : "This will remove all stratigraphy from the project."}
        </PageText>

        <PageText $marginBottom="0">Do you want to continue? </PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label="Ok"
          onClick={() => {
            onConfirm();
            resetConfirmAction();
          }}
        />
        <CancelButton onClick={resetConfirmAction} />
      </Dialog.Actions>
    </GenericDialog>
  );
}

function StratigraphyEditor({
  availableHorizons,
  availableZones,
}: {
  availableHorizons: RmsHorizon[];
  availableZones: RmsStratigraphicZone[];
}) {
  const form: AnyFormApi = useFormContext();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("");

  const projectHorizons = form.getFieldValue("horizons") as RmsHorizon[];
  const projectZones = form.getFieldValue("zones") as RmsStratigraphicZone[];

  const { removeItems, addItems, addAll, removeAll } = useItemHandlers(
    projectHorizons,
    projectZones,
    availableHorizons,
    availableZones,
  );

  const unselectedZoneNames = namesNotInReference(availableZones, projectZones);
  const unselectedHorizonNames = namesNotInReference(
    availableHorizons,
    projectHorizons,
  );

  const addHorizon = (horizon: RmsHorizon) => {
    addItems("horizons", [horizon.name]);
  };

  const addZone = (zone: RmsStratigraphicZone) => {
    addItems("zones", [zone.name]);
    addItems("horizons", [zone.top_horizon_name, zone.base_horizon_name]);
  };

  const removeHorizon = (horizon: RmsHorizon) => {
    removeItems("horizons", [horizon.name]);
    const zonesUsingHorizon = projectZones
      .filter(
        (z) =>
          z.top_horizon_name === horizon.name ||
          z.base_horizon_name === horizon.name,
      )
      .map((z) => z.name);
    removeItems("zones", zonesUsingHorizon);
  };

  const removeZone = (zone: RmsStratigraphicZone) => {
    removeItems("zones", [zone.name]);
  };

  const orphanZoneNames = namesNotInReference(projectZones, availableZones);
  const orphanHorizonNames = namesNotInReference(
    projectHorizons,
    availableHorizons,
  );
  const hasOrphans =
    orphanHorizonNames.length > 0 || orphanZoneNames.length > 0;
  const orphanCount = orphanHorizonNames.length + orphanZoneNames.length;
  const orphanTypeCounts = [
    orphanHorizonNames.length > 0
      ? `${orphanHorizonNames.length} ${
          orphanHorizonNames.length === 1 ? "horizon" : "horizons"
        }`
      : "",
    orphanZoneNames.length > 0
      ? `${orphanZoneNames.length} ${
          orphanZoneNames.length === 1 ? "zone" : "zones"
        }`
      : "",
  ].filter(Boolean);
  const orphanListItems = [
    ...orphanHorizonNames.map((name) => `Horizon: ${name}`),
    ...orphanZoneNames.map((name) => `Zone: ${name}`),
  ];

  return (
    <StratigraphyEditorContainer>
      <div>
        <PageHeader $variant="h4">Project stratigraphy</PageHeader>

        <StratigraphicFramework
          maxHeight="55vh"
          horizons={projectHorizons}
          zones={projectZones}
          orphanHorizonNames={orphanHorizonNames}
          orphanZoneNames={orphanZoneNames}
          onZoneClick={(zone) => {
            removeZone(zone);
          }}
          onHorizonClick={(horizon) => {
            removeHorizon(horizon);
          }}
        >
          <Horizons />
          <Zones />
        </StratigraphicFramework>

        {hasOrphans && (
          <OrphanWarningBox
            message={`${orphanTypeCounts.join(" and ")} stored in the project ${
              orphanCount === 1 ? "is" : "are"
            } currently not available in RMS. ${
              orphanCount === 1 ? "It" : "They"
            } will be removed when you save.`}
            listItems={orphanListItems}
          />
        )}

        <ActionButtonsContainer>
          <GeneralButton
            label="Remove all"
            variant="outlined"
            disabled={!projectHorizons.length && !projectZones.length}
            onClick={() => {
              setConfirmAction("remove");
            }}
          />
        </ActionButtonsContainer>
      </div>

      <div>
        <PageHeader $variant="h4">Available RMS stratigraphy</PageHeader>

        <StratigraphicFramework
          maxHeight="55vh"
          horizons={availableHorizons}
          zones={availableZones}
          unselectedHorizonNames={unselectedHorizonNames}
          unselectedZoneNames={unselectedZoneNames}
          onZoneClick={(zone, isUnselected) => {
            isUnselected ? addZone(zone) : removeZone(zone);
          }}
          onHorizonClick={(horizon, isUnselected) => {
            isUnselected ? addHorizon(horizon) : removeHorizon(horizon);
          }}
        >
          <Horizons />
          <Zones />
        </StratigraphicFramework>

        <ActionButtonsContainer>
          <GeneralButton
            variant="outlined"
            label="Add all"
            disabled={
              projectHorizons.length === availableHorizons.length &&
              projectZones.length === availableZones.length
            }
            onClick={() => {
              setConfirmAction("add");
            }}
          />
        </ActionButtonsContainer>

        <PageText>
          💡 Click on horizons or zones to add or remove them from the project
          stratigraphy.
        </PageText>
      </div>

      <ConfirmActionDialog
        confirmAction={confirmAction}
        setConfirmAction={setConfirmAction}
        onConfirm={confirmAction === "add" ? addAll : removeAll}
      />
    </StratigraphyEditorContainer>
  );
}

function Edit({
  projectHorizons,
  projectZones,
  projectReadOnly,
  isDialogOpen,
  closeDialog,
  isRmsProjectOpen,
}: {
  projectHorizons: RmsHorizon[];
  projectZones: RmsStratigraphicZone[];
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  closeDialog: () => void;
  isRmsProjectOpen: boolean;
}) {
  const { data: availableHorizons, isSuccess: availableHorizonsLoaded } =
    useQuery({
      ...rmsGetHorizonsOptions(),
      enabled: isRmsProjectOpen,
    });
  const { data: availableZones, isSuccess: availableZonesLoaded } = useQuery({
    ...rmsGetZonesOptions(),
    enabled: isRmsProjectOpen,
  });
  const availableStratigraphyLoaded =
    availableHorizonsLoaded && availableZonesLoaded;

  const queryClient = useQueryClient();

  const rmsStratigraphyMutation = useMutation({
    ...projectPatchRmsStratigraphicFrameworkMutation(),
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
      errorPrefix: "Error updating project stratigraphy",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const form = useAppForm({
    defaultValues: {
      zones: projectZones,
      horizons: projectHorizons,
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
  }: MutationCallbackProps<RmsStratigraphicFramework>) => {
    const availableHorizonNames = new Set(
      availableHorizons?.map((horizon) => horizon.name),
    );
    const availableZoneNames = new Set(
      availableZones?.map((zone) => zone.name),
    );

    rmsStratigraphyMutation.mutate(
      {
        body: {
          horizons: formValue.horizons.filter((horizon) =>
            availableHorizonNames.has(horizon.name),
          ),
          zones: formValue.zones.filter((zone) =>
            availableZoneNames.has(zone.name),
          ),
        },
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
        $minWidth="60em"
        $maxWidth=""
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>Set project stratigraphy</Dialog.Header>

          <Dialog.CustomContent>
            <form.AppForm>
              <form.Subscribe selector={(state) => state.values}>
                {() => (
                  <form.StratigraphyEditor
                    availableHorizons={availableHorizons ?? []}
                    availableZones={availableZones ?? []}
                  />
                )}
              </form.Subscribe>
            </form.AppForm>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <form.Subscribe
              selector={(state) =>
                [
                  state.isDefaultValue,
                  state.canSubmit,
                  state.values.horizons,
                  state.values.zones,
                ] as const
              }
            >
              {([isDefaultValue, canSubmit, horizons, zones]) => {
                const hasOrphans =
                  availableStratigraphyLoaded &&
                  (namesNotInReference(horizons, availableHorizons).length >
                    0 ||
                    namesNotInReference(zones, availableZones).length > 0);

                return (
                  <form.SubmitButton
                    label="Save"
                    disabled={
                      projectReadOnly ||
                      (isDefaultValue && !hasOrphans) ||
                      !canSubmit ||
                      !availableStratigraphyLoaded
                    }
                    isPending={rmsStratigraphyMutation.isPending}
                    helperTextDisabled={
                      projectReadOnly
                        ? "Project is read-only"
                        : !availableStratigraphyLoaded
                          ? "RMS stratigraphy must be loaded before saving"
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

export function Stratigraphy({
  rmsData,
  projectReadOnly,
  isRmsProjectOpen,
}: {
  rmsData: RmsProject | undefined | null;
  projectReadOnly: boolean;
  isRmsProjectOpen: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectHorizons = rmsData?.horizons ?? [];
  const projectZones = rmsData?.zones ?? [];

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
          The following is the model stratigraphy stored in the project, this
          can be a subset or the full RMS stratigraphy. It is only the stored
          stratigraphy that will be possible to map to official stratigraphic
          names.
        </PageText>
      </PageSectionWidthConstrained>

      {projectHorizons.length ? (
        <StratigraphicFramework
          horizons={projectHorizons}
          zones={projectZones}
          disablePointerEvents={false}
          enableWidthExpansion={true}
        >
          <Horizons />
          <Zones />
        </StratigraphicFramework>
      ) : (
        <PageSectionWidthConstrained>
          <PageCode>
            No stratigraphy information currently stored in the project.
          </PageCode>
        </PageSectionWidthConstrained>
      )}

      <PageSectionWidthConstrained>
        <GeneralButton
          label={projectHorizons.length ? "Edit" : "Add"}
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
        projectHorizons={projectHorizons}
        projectZones={projectZones}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        closeDialog={closeDialog}
        isRmsProjectOpen={isRmsProjectOpen}
      />
    </>
  );
}
