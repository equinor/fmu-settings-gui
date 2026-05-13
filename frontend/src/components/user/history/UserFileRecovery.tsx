import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import {
  sessionGetRestoreCheckOptions,
  sessionPostRestoreMutation,
  userGetUserQueryKey,
} from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import { DeletedFilesRecoveryDialog } from "#components/history/DeletedFilesRecoveryDialog";
import { formatRecoveredFilesMessage } from "#components/history/utils";
import { PageText } from "#styles/common";
import { queryKeySessionGetRestoreCheck } from "#utils/query";

export function UserFileRecovery() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const restoreCheckQuery = useQuery({
    ...sessionGetRestoreCheckOptions(),
    enabled: isDialogOpen,
    staleTime: 0,
    refetchOnMount: "always",
    meta: { errorPrefix: "Error checking deleted user files" },
  });

  const restoreMutation = useMutation({
    ...sessionPostRestoreMutation(),
    meta: { errorPrefix: "Error recovering deleted user files" },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: userGetUserQueryKey(),
      });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as { _id?: string } | undefined;

          return key?._id === queryKeySessionGetRestoreCheck;
        },
      });
      toast.info(formatRecoveredFilesMessage(data.files, "user"));
      setIsDialogOpen(false);
    },
  });

  const isCheckingFiles =
    isDialogOpen &&
    (restoreCheckQuery.isPending || restoreCheckQuery.isFetching);
  const restorableFiles = isCheckingFiles
    ? []
    : (restoreCheckQuery.data?.files ?? []);

  return (
    <>
      <DeletedFilesRecoveryDialog
        isOpen={isDialogOpen}
        title="Recover deleted user files"
        files={restorableFiles}
        emptyMessage="No deleted user files were found."
        checkErrorMessage="Unable to check for deleted user files."
        isCheckPending={isCheckingFiles}
        isCheckError={restoreCheckQuery.isError}
        isRecoverPending={restoreMutation.isPending}
        isRecoverDisabled={restoreMutation.isPending}
        onRecover={() => {
          restoreMutation.mutate({});
        }}
        onClose={() => {
          setIsDialogOpen(false);
        }}
      />

      <PageText>
        Deleted user files can be recovered from your user .fmu directory.
      </PageText>

      <PageText>
        Files can only be recovered if they were deleted while the application
        was running. Files that were not deleted will not be affected.
      </PageText>

      <GeneralButton
        label="Check for deleted files"
        isPending={restoreMutation.isPending}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />
    </>
  );
}
