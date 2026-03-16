import { Dialog } from "@equinor/eds-core-react";

import { GeneralButton } from "#components/form/button";
import { GenericDialog, PageText } from "#styles/common";

export function Loading() {
  return <PageText>Loading...</PageText>;
}

export function ConfirmCloseDialog({
  isOpen,
  handleConfirmCloseDecision,
  title = "Discard changes",
  description = "There are unsaved changes in the form. If the editing is cancelled, all changes will be lost.",
  question = "Do you want to discard the changes?",
  confirmLabel = "Keep editing",
  cancelLabel = "Discard changes",
}: {
  isOpen: boolean;
  handleConfirmCloseDecision: (confirm: boolean) => void;
  title?: string;
  description?: string;
  question?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <GenericDialog open={isOpen} $width="32em">
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <PageText>{description}</PageText>
        <PageText $marginBottom="0">{question}</PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label={confirmLabel}
          onClick={() => {
            handleConfirmCloseDecision(false);
          }}
        />
        <GeneralButton
          label={cancelLabel}
          variant="outlined"
          onClick={() => {
            handleConfirmCloseDecision(true);
          }}
        />
      </Dialog.Actions>
    </GenericDialog>
  );
}
