import { useState } from "react";

export function useConfirmClose({
  enable,
  determineRequiresConfirmation,
  onCloseConfirmed,
}: {
  enable: boolean;
  determineRequiresConfirmation: () => boolean;
  onCloseConfirmed: () => void;
}) {
  const [confirmCloseDialogOpen, setConfirmCloseDialogOpen] = useState(false);
  const isConfirmCloseDialogOpen = enable && confirmCloseDialogOpen;

  const closeDialogs = () => {
    setConfirmCloseDialogOpen(false);
    onCloseConfirmed();
  };

  const handleCloseRequest = () => {
    if (determineRequiresConfirmation()) {
      setConfirmCloseDialogOpen(true);
    } else {
      closeDialogs();
    }
  };

  const handleDecision = (confirm: boolean) => {
    if (confirm) {
      closeDialogs();
    } else {
      setConfirmCloseDialogOpen(false);
    }
  };

  return {
    confirmCloseDialogOpen: isConfirmCloseDialogOpen,
    handleCloseRequest,
    handleDecision,
  };
}
