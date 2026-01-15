import { Dialog, Icon, List } from "@equinor/eds-core-react";
import { warning_outlined } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { RmsHorizon, RmsProject, RmsStratigraphicZone } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchRmsHorizonsMutation,
  projectPatchRmsZonesMutation,
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
  prepareZoneData,
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

      <PageText $marginBottom="0">
        There are zones or horizons in the project stratigraphy that are no
        longer available in RMS. They need to be removed before data can be
        saved.
        <List>
          <List.Item>
            {[...orphanHorizonNames, ...orphanZoneNames].join(", ")}
          </List.Item>
        </List>
      </PageText>
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

  // the preparations below can be removed once we have column information from RMS
  const projectZonesWithIndex = prepareZoneData(projectZones, projectHorizons);
  const availableZonesWithIndex = prepareZoneData(
    availableZones,
    availableHorizons,
  );

  const { handleRemoveItems, handleAddItems, handleAddAll, handleRemoveAll } =
    useStratigraphyHandlers(
      projectHorizons,
      projectZones,
      availableHorizons,
      availableZones,
    );

  const inactiveZoneNames = namesNotInReference(availableZones, projectZones);
  const inactiveHorizonNames = namesNotInReference(
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
            zones={projectZonesWithIndex}
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
            zones={availableZonesWithIndex}
            inactiveHorizonNames={inactiveHorizonNames}
            inactiveZoneNames={inactiveZoneNames}
            onZoneClick={(zone, isInactive) => {
              isInactive ? handleAddZone(zone) : handleRemoveZone(zone);
            }}
            onHorizonClick={(horizon, isInactive) => {
              isInactive
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
  rmsData,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: {
  rmsData: RmsProject | null | undefined;
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const handleClose = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const { data: rmsHorizons } = useQuery(rmsGetHorizonsOptions());
  const { data: rmsZones } = useQuery(rmsGetZonesOptions());

  const queryClient = useQueryClient();

  const rmsHorizonsMutation = useMutation({
    ...projectPatchRmsHorizonsMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating project horizons" },
  });

  const rmsZonesMutation = useMutation({
    ...projectPatchRmsZonesMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating project zones" },
  });

  const form = useAppForm({
    defaultValues: {
      zones: rmsData?.zones ?? [],
      horizons: rmsData?.horizons ?? [],
    },

    onSubmit: async ({ value, formApi }) => {
      await Promise.all([
        rmsHorizonsMutation.mutateAsync({ body: value.horizons }),
        rmsZonesMutation.mutateAsync({ body: value.zones }),
      ]);
      toast.info("Successfully updated project stratigraphy.");
      handleClose({ formReset: formApi.reset });
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
                  availableHorizons={rmsHorizons ?? []}
                  availableZones={rmsZones ?? []}
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
                isPending={
                  rmsHorizonsMutation.isPending || rmsZonesMutation.isPending
                }
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

  const zonesWithColumn = useMemo(
    () => prepareZoneData(rmsData?.zones ?? [], rmsData?.horizons ?? []),
    [rmsData?.zones, rmsData?.horizons],
  );

  return (
    <>
      <PageHeader $variant="h3">Stratigraphy</PageHeader>

      <PageText>
        The following is the model stratigraphy stored in the project, this can
        be a subset or the full RMS stratigraphy. <br />
        It is only the stored stratigraphy that will be possible to map to
        official stratigraphic names.
      </PageText>

      {rmsData?.horizons?.length ? (
        <StratigraphicFramework
          horizons={rmsData.horizons ?? []}
          zones={zonesWithColumn}
        />
      ) : (
        <PageCode>No stratigraphy information found in the project.</PageCode>
      )}

      <GeneralButton
        label={rmsData?.horizons?.length ? "Edit" : "Add"}
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
          rmsData={rmsData}
          projectReadOnly={projectReadOnly}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      )}
    </>
  );
}
