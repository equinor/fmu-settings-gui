import { Dialog, ListItem } from "@equinor/eds-core-react";

import { GeneralButton } from "#components/form/button";
import { GenericDialog, PageList, PageText } from "#styles/common";

type DeletedFilesRecoveryDialogProps = {
  isOpen: boolean;
  title: string;
  files: string[];
  emptyMessage: string;
  checkErrorMessage: string;
  isCheckPending: boolean;
  isCheckError: boolean;
  isRecoverPending: boolean;
  isRecoverDisabled: boolean;
  recoverTooltipText?: string;
  onRecover: () => void;
  onClose: () => void;
};

export function DeletedFilesRecoveryDialog({
  isOpen,
  title,
  files,
  emptyMessage,
  checkErrorMessage,
  isCheckPending,
  isCheckError,
  isRecoverPending,
  isRecoverDisabled,
  recoverTooltipText,
  onRecover,
  onClose,
}: DeletedFilesRecoveryDialogProps) {
  const shouldShowRecover =
    !isCheckPending && !isCheckError && files.length > 0;

  return (
    <GenericDialog open={isOpen} $maxWidth="36em">
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>

      <Dialog.Content>
        {isCheckPending && (
          <PageText $marginBottom="0">Checking for deleted files...</PageText>
        )}

        {isCheckError && (
          <PageText $marginBottom="0">{checkErrorMessage}</PageText>
        )}

        {!isCheckPending && !isCheckError && files.length === 0 && (
          <PageText $marginBottom="0">{emptyMessage}</PageText>
        )}

        {!isCheckPending && !isCheckError && files.length > 0 && (
          <>
            <PageText>The following files can be recovered:</PageText>

            <PageList>
              {files.map((file) => (
                <ListItem key={file}>{file}</ListItem>
              ))}
            </PageList>
          </>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        {shouldShowRecover && (
          <GeneralButton
            label="Recover"
            isPending={isRecoverPending}
            disabled={isRecoverDisabled}
            tooltipText={recoverTooltipText}
            onClick={onRecover}
          />
        )}

        <GeneralButton
          label="Close"
          variant={shouldShowRecover ? "outlined" : undefined}
          onClick={onClose}
        />
      </Dialog.Actions>
    </GenericDialog>
  );
}
