import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetProjectQueryKey,
  projectGetRestoreCheckOptions,
  projectPostRestoreMutation,
} from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import { DeletedFilesRecoveryDialog } from "#components/history/DeletedFilesRecoveryDialog";
import { formatRecoveredFilesMessage } from "#components/history/utils";
import { PageHeader, PageText } from "#styles/common";
import {
  queryKeyProjectGetCache,
  queryKeyProjectGetCacheDiff,
  queryKeyProjectGetMappings,
  queryKeyProjectGetRestoreCheck,
} from "#utils/query";

export function ProjectFileRecovery({
  hasProject,
  projectReadOnly,
}: {
  hasProject: boolean;
  projectReadOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const showDialog = hasProject && isDialogOpen;

  const restoreCheckQuery = useQuery({
    ...projectGetRestoreCheckOptions(),
    enabled: showDialog,
    staleTime: 0,
    refetchOnMount: "always",
    meta: { errorPrefix: "Error checking deleted FMU project files" },
  });

  const restoreMutation = useMutation({
    ...projectPostRestoreMutation(),
    meta: { errorPrefix: "Error recovering deleted FMU project files" },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as { _id?: string } | undefined;

          return [
            queryKeyProjectGetCache,
            queryKeyProjectGetCacheDiff,
            queryKeyProjectGetMappings,
            queryKeyProjectGetRestoreCheck,
          ].includes(key?._id ?? "");
        },
      });
      toast.info(formatRecoveredFilesMessage(data.files, "FMU project"));
      setIsDialogOpen(false);
    },
  });

  const isCheckingFiles =
    showDialog && (restoreCheckQuery.isPending || restoreCheckQuery.isFetching);
  const restorableFiles = isCheckingFiles
    ? []
    : (restoreCheckQuery.data?.files ?? []);

  return (
    <>
      <DeletedFilesRecoveryDialog
        isOpen={showDialog}
        title="Recover deleted FMU project files"
        files={restorableFiles}
        emptyMessage="No deleted FMU project files were found."
        checkErrorMessage="Unable to check for deleted FMU project files."
        isCheckPending={isCheckingFiles}
        isCheckError={restoreCheckQuery.isError}
        isRecoverPending={restoreMutation.isPending}
        isRecoverDisabled={projectReadOnly || restoreMutation.isPending}
        recoverTooltipText={
          projectReadOnly ? "FMU project is read-only" : undefined
        }
        onRecover={() => {
          restoreMutation.mutate({});
        }}
        onClose={() => {
          setIsDialogOpen(false);
        }}
      />

      <PageHeader $variant="h3">Recover deleted FMU project files</PageHeader>

      {hasProject ? (
        <>
          <PageText>
            Deleted FMU project files can be recovered from the current FMU
            project's .fmu directory.
          </PageText>

          <PageText>
            Files can only be recovered if they were deleted while the
            application was running. Files that were not deleted will not be
            affected.
          </PageText>

          <GeneralButton
            label="Check for deleted files"
            isPending={restoreMutation.isPending}
            onClick={() => {
              setIsDialogOpen(true);
            }}
          />
        </>
      ) : (
        <PageText>
          FMU project not set. Select an FMU project to check for deleted FMU
          project files.
        </PageText>
      )}
    </>
  );
}
