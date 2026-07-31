import { Dialog } from "@equinor/eds-core-react";
import { useState } from "react";

import type { InternalWellboreMappings } from "#client";
import { CancelButton, GeneralButton } from "#components/form/button";
import { getUnmappableOption } from "#components/project/common/mapping/utils";
import type { SaveWellboreMappings } from "#services/mappings";
import { GenericDialog, PageText } from "#styles/common";

type RemoveMappingsOperation = "simulator" | "smda";

const mappingNames: Record<
  RemoveMappingsOperation,
  { label: string; title: string }
> = {
  simulator: { label: "simulator", title: "Simulator" },
  smda: { label: "SMDA", title: "SMDA" },
};

export function RemoveMappingsAction({
  operation,
  mappingsAfterRemoval,
  projectReadOnly,
  isSaving,
  saveMappings,
}: {
  operation: RemoveMappingsOperation;
  mappingsAfterRemoval: () => InternalWellboreMappings;
  projectReadOnly: boolean;
  isSaving: boolean;
  saveMappings: SaveWellboreMappings;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { label, title } = mappingNames[operation];

  const removeMappings = () => {
    saveMappings(mappingsAfterRemoval(), {
      successMessage: `${title} names removed`,
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  return (
    <>
      {dialogOpen && (
        <GenericDialog
          open={true}
          isDismissable={true}
          onClose={() => {
            setDialogOpen(false);
          }}
          $width="34em"
        >
          <Dialog.Header>Remove all {label} names</Dialog.Header>

          <Dialog.CustomContent>
            <PageText>
              {operation === "smda"
                ? "This clears all SMDA names and “" +
                  `${getUnmappableOption("wellbore").label}” selections. RMS ` +
                  "and simulator names will stay unchanged."
                : "This clears all simulator names from the wellbore " +
                  "mappings. RMS and SMDA names will stay unchanged."}
            </PageText>
            <PageText $marginBottom="0">
              Do you want to remove all {label} names?
            </PageText>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <GeneralButton
              label={`Remove all ${label} names`}
              color="danger"
              disabled={projectReadOnly || isSaving}
              isPending={isSaving}
              onClick={removeMappings}
            />
            <CancelButton
              onClick={() => {
                setDialogOpen(false);
              }}
            />
          </Dialog.Actions>
        </GenericDialog>
      )}

      <GeneralButton
        label={`Remove all ${label} names`}
        variant="outlined"
        color="danger"
        disabled={projectReadOnly}
        tooltipText={projectReadOnly ? "Project is read-only" : undefined}
        onClick={() => {
          setDialogOpen(true);
        }}
      />
    </>
  );
}
