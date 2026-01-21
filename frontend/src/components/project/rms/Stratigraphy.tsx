import { Dialog, Icon, List } from "@equinor/eds-core-react";
import { warning_outlined } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { RmsHorizon, RmsProject, RmsStratigraphicZone } from "#client";
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
import {
  namesNotInReference,
  useStratigraphyHandlers,
} from "#services/stratigraphy";
import {
  Banner,
  EditDialog,
  PageCode,
  PageHeader,
  PageText,
} from "#styles/common";
import { fieldContext, formContext, useFormContext } from "#utils/form";
import { StratigraphicFramework } from "./StratigraphicFramework";
import {
  ActionButtonsContainer,
  StratigraphyEditorContainer,
} from "./Stratigraphy.style";

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
  setConfirmAction: React.Dispatch<React.SetStateAction<ConfirmAction>>;
  confirmAction: ConfirmAction;
}) {
  const resetConfirmAction = () => {
    setConfirmAction("");
  };

  return (
    <EditDialog open={!!confirmAction} $minWidth="max-content">
      <Dialog.Header>Confirm action</Dialog.Header>

      <Dialog.Content>
        <PageText $marginBottom="0">
          {confirmAction === "add"
            ? "This will add all available stratigraphy to the project."
            : "This will remove all stratigraphy from the project."}
          <br />
          Do you wish to continue?
        </PageText>
      </Dialog.Content>

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

function OrphanBanner({
  orphanZoneNames,
  orphanHorizonNames,
}: {
  orphanZoneNames: string[];
  orphanHorizonNames: string[];
}) {
  return (
    <Banner>
      <Banner.Icon variant="warning">
        <Icon data={warning_outlined} />
      </Banner.Icon>

      <div>
        <PageText $marginBottom="0">
          There are zones or horizons in the project stratigraphy that are no
          longer available in RMS. They need to be removed before data can be
          saved.
        </PageText>

        <List>
          <List.Item>
            {[...orphanHorizonNames, ...orphanZoneNames].join(", ")}
          </List.Item>
        </List>
      </div>
    </Banner>
  );
}

function StratigraphyEditor({
  projectHorizons,
  projectZones,
  availableHorizons,
  availableZones,
}: {
  projectHorizons: RmsHorizon[];
  projectZones: RmsStratigraphicZone[];
  availableHorizons: RmsHorizon[];
  availableZones: RmsStratigraphicZone[];
}) {
  const form = useFormContext();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("");

  const { handleRemoveItems, handleAddItems, handleAddAll, handleRemoveAll } =
    useStratigraphyHandlers(
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

  const handleAddHorizon = (horizon: RmsHorizon) => {
    handleAddItems("horizons", [horizon.name]);
  };
  const handleAddZone = (zone: RmsStratigraphicZone) => {
    handleAddItems("zones", [zone.name]);
    handleAddItems("horizons", [zone.top_horizon_name, zone.base_horizon_name]);
  };

  const handleRemoveHorizon = (horizon: RmsHorizon) => {
    handleRemoveItems("horizons", [horizon.name]);
    const zonesUsingHorizon = projectZones
      .filter(
        (z) =>
          z.top_horizon_name === horizon.name ||
          z.base_horizon_name === horizon.name,
      )
      .map((z) => z.name);
    handleRemoveItems("zones", zonesUsingHorizon);
  };
  const handleRemoveZone = (zone: RmsStratigraphicZone) => {
    handleRemoveItems("zones", [zone.name]);
  };

  const orphanZoneNames = namesNotInReference(projectZones, availableZones);
  const orphanHorizonNames = namesNotInReference(
    projectHorizons,
    availableHorizons,
  );
  const hasOrphans =
    orphanHorizonNames.length > 0 || orphanZoneNames.length > 0;

  form.setErrorMap({
    onChange: hasOrphans ? ["Orphan zones or horizons present"] : undefined,
  });

  return (
    <>
      {hasOrphans && (
        <OrphanBanner
          orphanZoneNames={orphanZoneNames}
          orphanHorizonNames={orphanHorizonNames}
        />
      )}

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
              handleRemoveZone(zone);
            }}
            onHorizonClick={(horizon) => {
              handleRemoveHorizon(horizon);
            }}
          />

          <ActionButtonsContainer>
            <GeneralButton
              variant="outlined"
              label="Add all available"
              disabled={
                projectHorizons.length === availableHorizons.length &&
                projectZones.length === availableZones.length
              }
              onClick={() => {
                setConfirmAction("add");
              }}
            />
            <GeneralButton
              label="Remove all"
              variant="outlined"
              color="danger"
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
              isUnselected ? handleAddZone(zone) : handleRemoveZone(zone);
            }}
            onHorizonClick={(horizon, isUnselected) => {
              isUnselected
                ? handleAddHorizon(horizon)
                : handleRemoveHorizon(horizon);
            }}
          />

          <PageText>
            💡 Click on horizons or zones to add or remove them from the project
            stratigraphy.
          </PageText>
        </div>

        <ConfirmActionDialog
          confirmAction={confirmAction}
          setConfirmAction={setConfirmAction}
          onConfirm={confirmAction === "add" ? handleAddAll : handleRemoveAll}
        />
      </StratigraphyEditorContainer>
    </>
  );
}

function Edit({
  projectHorizons,
  projectZones,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: {
  projectHorizons: RmsHorizon[];
  projectZones: RmsStratigraphicZone[];
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const handleClose = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const { data: availableHorizons } = useQuery(rmsGetHorizonsOptions());
  const { data: availableZones } = useQuery(rmsGetZonesOptions());

  const queryClient = useQueryClient();

  const rmsStratigraphyMutation = useMutation({
    ...projectPatchRmsStratigraphicFrameworkMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating project stratigraphy" },
  });

  const form = useAppForm({
    defaultValues: {
      zones: projectZones,
      horizons: projectHorizons,
    },

    onSubmit: ({ value, formApi }) => {
      rmsStratigraphyMutation.mutate(
        { body: value },
        {
          onSuccess: () => {
            toast.info("Successfully updated project stratigraphy.");
            handleClose({ formReset: formApi.reset });
          },
        },
      );
    },
  });

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

        <Dialog.Content>
          <form.AppForm>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <form.StratigraphyEditor
                  projectHorizons={values.horizons}
                  projectZones={values.zones}
                  availableHorizons={availableHorizons ?? []}
                  availableZones={availableZones ?? []}
                />
              )}
            </form.Subscribe>
          </form.AppForm>
        </Dialog.Content>

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
                    : "Form can be submitted when it has been changed and is valid"
                }
              />
            )}
          </form.Subscribe>
          <form.CancelButton
            onClick={(e) => {
              e.preventDefault();
              handleClose({ formReset: form.reset });
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

  return (
    <>
      <PageHeader $variant="h3">Stratigraphy</PageHeader>

      <PageText>
        The following is the model stratigraphy stored in the project, this can
        be a subset or the full RMS stratigraphy. <br />
        It is only the stored stratigraphy that will be possible to map to
        official stratigraphic names.
      </PageText>

      {!projectHorizons.length ? (
        <PageCode>
          No stratigraphy information currently stored in the project.
        </PageCode>
      ) : (
        <StratigraphicFramework
          horizons={projectHorizons}
          zones={projectZones}
        />
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
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      {isRmsProjectOpen && (
        <Edit
          projectHorizons={projectHorizons}
          projectZones={projectZones}
          projectReadOnly={projectReadOnly}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      )}
    </>
  );
}
