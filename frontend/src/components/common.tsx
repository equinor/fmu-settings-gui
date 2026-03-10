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
  description = "You have unsaved changes. If you close now, all changes in this form will be lost.",
  question = "Do you want to discard your changes?",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
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
    <GenericDialog open={isOpen} $minWidth="32em">
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
            handleConfirmCloseDecision(true);
          }}
        />
        <GeneralButton
          label={cancelLabel}
          variant="outlined"
          onClick={() => {
            handleConfirmCloseDecision(false);
          }}
        />
      </Dialog.Actions>
    </GenericDialog>
  );
}
