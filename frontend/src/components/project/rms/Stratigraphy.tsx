import { Dialog, List } from "@equinor/eds-core-react";
import { type AnyFormApi, createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";

import type {
  RmsHorizon,
  RmsProject,
  RmsStratigraphicFramework,
  RmsStratigraphicZone,
} from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchRmsStratigraphicFrameworkMutation,
  rmsGetHorizonsOptions,
  rmsGetZonesOptions,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import type {
  FormSubmitCallbackProps,
  MutationCallbackProps,
} from "#components/form/form.tsx";
import { EditDialog, PageCode, PageHeader, PageText } from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api.ts";
import { fieldContext, formContext, useFormContext } from "#utils/form";
import { StratigraphicFramework } from "./StratigraphicFramework";
import {
  ActionButtonsContainer,
  OrphanTypesContainer,
  StratigraphyEditorContainer,
} from "./Stratigraphy.style";
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
    <EditDialog open={!!confirmAction} $minWidth="25em">
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
    </EditDialog>
  );
}

function OrphanWarningBox({
  orphanZoneNames,
  orphanHorizonNames,
}: {
  orphanZoneNames: string[];
  orphanHorizonNames: string[];
}) {
  return (
    <OrphanTypesContainer>
      <PageText>
        There are horizons or zones in the project stratigraphy that are no
        longer available in RMS. They need to be removed before data can be
        saved.
      </PageText>

      <List>
        {orphanHorizonNames.length > 0 && (
          <List.Item>{orphanHorizonNames.join(", ")}</List.Item>
        )}
        {orphanZoneNames.length > 0 && (
          <List.Item>{orphanZoneNames.join(", ")}</List.Item>
        )}
      </List>
    </OrphanTypesContainer>
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

  useEffect(() => {
    form.setErrorMap({
      onChange: hasOrphans ? ["Orphan horizons or zones present"] : undefined,
    });
  }, [form, hasOrphans]);

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
        />

        {hasOrphans && (
          <OrphanWarningBox
            orphanZoneNames={orphanZoneNames}
            orphanHorizonNames={orphanHorizonNames}
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
        />

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
  const { data: availableHorizons } = useQuery({
    ...rmsGetHorizonsOptions(),
    enabled: isRmsProjectOpen,
  });
  const { data: availableZones } = useQuery({
    ...rmsGetZonesOptions(),
    enabled: isRmsProjectOpen,
  });

  const queryClient = useQueryClient();

  const rmsStratigraphyMutation = useMutation({
    ...projectPatchRmsStratigraphicFrameworkMutation(),
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
      errorPrefix: "Error updating project stratigraphy",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
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
    rmsStratigraphyMutation.mutate(
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

  return (
    <EditDialog open={isDialogOpen} $minWidth="60em" $maxWidth="">
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
            selector={(state) => [state.isDefaultValue, state.canSubmit]}
          >
            {([isDefaultValue, canSubmit]) => (
              <form.SubmitButton
                label="Save"
                disabled={isDefaultValue || !canSubmit || projectReadOnly}
                isPending={rmsStratigraphyMutation.isPending}
                helperTextDisabled={
                  projectReadOnly
                    ? "Project is read-only"
                    : "Form can be submitted when the values have changed"
                }
              />
            )}
          </form.Subscribe>
          <form.CancelButton
            onClick={(e) => {
              e.preventDefault();
              form.reset();
              closeDialog();
            }}
          />
        </Dialog.Actions>
      </form>
    </EditDialog>
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
      <PageHeader $variant="h3">Stratigraphy</PageHeader>

      <PageText>
        The following is the model stratigraphy stored in the project, this can
        be a subset or the full RMS stratigraphy. It is only the stored
        stratigraphy that will be possible to map to official stratigraphic
        names.
      </PageText>

      {projectHorizons.length ? (
        <StratigraphicFramework
          horizons={projectHorizons}
          zones={projectZones}
        />
      ) : (
        <PageCode>
          No stratigraphy information currently stored in the project.
        </PageCode>
      )}

      <GeneralButton
        label={projectHorizons.length ? "Edit" : "Add"}
        disabled={projectReadOnly || !isRmsProjectOpen}
        tooltipText={
          projectReadOnly
            ? "Project is read-only"
            : !isRmsProjectOpen
              ? "RMS project is not open"
              : undefined
        }
        onClick={openDialog}
      />

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
