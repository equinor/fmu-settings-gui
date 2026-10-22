import { Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetCache,
  projectGetMigrationBackupCheck,
  projectPostCacheRestore,
  projectPostMigrationBackupRestore,
} from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
} from "#client/@tanstack/react-query.gen";
import type { CacheResource, MigrationBackupStatus } from "#client/types.gen";
import { CancelButton, GeneralButton } from "#components/form/button";
import { useProject } from "#services/project";
import { GenericDialog, PageText, WarningBox } from "#styles/common";
import {
  API_ERROR_CODE_NEWER_SCHEMA_VERSION,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import { displayDateTime } from "#utils/datetime";

const CACHE_RESOURCE_PROJECT_CONFIG: CacheResource = "config.json";

type RecoverySource =
  | { type: "cache"; latestRevision: string | null }
  // backupStatus is null when the backup check failed
  | { type: "migrationBackup"; backupStatus: MigrationBackupStatus | null };

export function ProjectRecoveryNotification() {
  const project = useProject();
  const queryClient = useQueryClient();
  const selectProjectInvalidAttempt = useRouteContext({
    from: "__root__",
    select: (context) => context.selectProjectInvalidAttempt,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [recoverySource, setRecoverySource] = useState<RecoverySource>({
    type: "cache",
    latestRevision: null,
  });

  const invalidateProjectQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: projectGetProjectQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: projectGetLockStatusQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: projectGetChangelogQueryKey(),
    });
  };

  const latestRevision =
    recoverySource.type === "cache" ? recoverySource.latestRevision : null;

  const { mutate: restoreFromLatestCache, isPending: isCacheRestorePending } =
    useMutation<string>({
      mutationFn: async () => {
        if (!latestRevision) {
          throw new Error("No project snapshots were found in cache.");
        }

        await projectPostCacheRestore({
          path: { revision_id: latestRevision },
          query: { resource: CACHE_RESOURCE_PROJECT_CONFIG },
          throwOnError: true,
        });

        return latestRevision;
      },
      onSuccess: (latestRevision) => {
        toast.info(`Project restored from latest snapshot: ${latestRevision}`);
        invalidateProjectQueries();
        setIsOpen(false);
      },
      meta: { errorPrefix: "Error restoring project from latest snapshot" },
    });

  const {
    mutate: restoreFromMigrationBackup,
    isPending: isMigrationBackupRestorePending,
  } = useMutation({
    mutationFn: async () => {
      await projectPostMigrationBackupRestore({ throwOnError: true });
    },
    onSuccess: () => {
      toast.info("Project configuration restored");
      invalidateProjectQueries();
      setIsOpen(false);
    },
    meta: { errorPrefix: "Error restoring project configuration" },
  });

  const isRestorePending =
    isCacheRestorePending || isMigrationBackupRestorePending;
  const canRestore =
    recoverySource.type === "cache"
      ? recoverySource.latestRevision !== null
      : recoverySource.backupStatus?.available === true;

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectProjectInvalidAttempt intentionally retriggers this effect
  useEffect(() => {
    if (
      project.errorStatus === HTTP_STATUS_422_UNPROCESSABLE_CONTENT &&
      project.errorCode === API_ERROR_CODE_NEWER_SCHEMA_VERSION
    ) {
      void projectGetMigrationBackupCheck({ throwOnError: true })
        .then(({ data }) => {
          setRecoverySource({ type: "migrationBackup", backupStatus: data });
          setIsOpen(true);
        })
        .catch(() => {
          setRecoverySource({ type: "migrationBackup", backupStatus: null });
          setIsOpen(true);
        });
    } else if (project.errorStatus === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
      void projectGetCache({
        query: { resource: CACHE_RESOURCE_PROJECT_CONFIG },
        throwOnError: true,
      })
        .then(({ data }) => {
          setRecoverySource({
            type: "cache",
            latestRevision: data.revisions.at(-1) ?? null,
          });
          setIsOpen(true);
        })
        .catch(() => {
          setRecoverySource({ type: "cache", latestRevision: null });
          setIsOpen(true);
        });
    } else {
      void Promise.resolve().then(() => {
        setRecoverySource({ type: "cache", latestRevision: null });
        setIsOpen(false);
      });
    }
  }, [project.errorStatus, project.errorCode, selectProjectInvalidAttempt]);

  return (
    <GenericDialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      $maxWidth="35em"
    >
      <Dialog.Header>
        <Dialog.Title>
          {recoverySource.type === "migrationBackup"
            ? "Project configuration is from a newer version"
            : "Project configuration is invalid"}
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        {recoverySource.type === "migrationBackup" ? (
          recoverySource.backupStatus === null ? (
            <PageText $marginBottom="0">
              The project configuration was saved by a newer version of FMU
              Settings. The version you are currently running cannot open it.
              The application failed to check for a compatible backup. Switch to
              a newer Komodo version to open this project.
            </PageText>
          ) : recoverySource.backupStatus.available ? (
            <>
              <PageText>
                The project configuration was saved by a newer version of FMU
                Settings. The version you are currently running cannot open it.
              </PageText>
              <PageText>
                Use <span className="emphasis">Cancel</span> and switch to a
                newer Komodo version to open the project.
              </PageText>
              <PageText>
                Alternatively, use <span className="emphasis">Restore</span> to
                return to the latest compatible configuration
                {recoverySource.backupStatus.last_modified_at ? (
                  <>
                    , last changed on{" "}
                    <span className="emphasis">
                      {displayDateTime(
                        recoverySource.backupStatus.last_modified_at,
                      )}
                    </span>
                    {recoverySource.backupStatus.last_modified_by && (
                      <>
                        {" "}
                        by{" "}
                        <span className="emphasis">
                          {recoverySource.backupStatus.last_modified_by}
                        </span>
                      </>
                    )}
                  </>
                ) : null}
                .
              </PageText>
              <WarningBox $marginBottom="0">
                <PageText $marginBottom="0">
                  Any changes that have been made after this date will be lost
                  if you restore.
                </PageText>
              </WarningBox>
            </>
          ) : (
            <PageText $marginBottom="0">
              The project configuration was saved by a newer version of FMU
              Settings. The version you are currently running cannot open it. No
              compatible project configuration was found. Switch to a newer
              Komodo version to open this project.
            </PageText>
          )
        ) : latestRevision ? (
          <PageText $marginBottom="0">
            The project configuration is invalid or corrupted. Do you want to
            restore it from the latest snapshot?
          </PageText>
        ) : (
          <PageText $marginBottom="0">
            The project configuration is invalid or corrupted and no snapshots
            were found in cache. You may be able to restore it by finding a
            backup on the project disk in the <code>.snapshots</code> folder.
          </PageText>
        )}
      </Dialog.CustomContent>

      <Dialog.Actions>
        {canRestore && (
          <GeneralButton
            label="Restore"
            isPending={isRestorePending}
            disabled={isRestorePending}
            onClick={() => {
              if (recoverySource.type === "migrationBackup") {
                restoreFromMigrationBackup();
              } else {
                restoreFromLatestCache();
              }
            }}
          />
        )}
        {canRestore ? (
          <CancelButton
            onClick={() => {
              if (isRestorePending) {
                return;
              }
              setIsOpen(false);
            }}
          />
        ) : (
          <GeneralButton
            label="Close"
            onClick={() => {
              setIsOpen(false);
            }}
          />
        )}
      </Dialog.Actions>
    </GenericDialog>
  );
}
