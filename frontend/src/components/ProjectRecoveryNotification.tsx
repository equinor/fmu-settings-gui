import { Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { projectGetCache, projectPostCacheRestore } from "#client";
import {
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
} from "#client/@tanstack/react-query.gen";
import type { CacheResource } from "#client/types.gen";
import { CancelButton, GeneralButton } from "#components/form/button";
import { useProject } from "#services/project";
import { GenericDialog, PageText } from "#styles/common";
import { HTTP_STATUS_UNPROCESSABLE_CONTENT } from "#utils/api";

const CACHE_RESOURCE_PROJECT_CONFIG: CacheResource = "config.json";

export function ProjectRecoveryNotification() {
  const project = useProject();
  const queryClient = useQueryClient();
  const selectProjectInvalidAttempt = useRouteContext({
    from: "__root__",
    select: (context) => context.selectProjectInvalidAttempt,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [latestRevision, setLatestRevision] = useState<string | null>(null);

  const { mutate: restoreFromLatestCache, isPending: isRestorePending } =
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
        void queryClient.invalidateQueries({
          queryKey: projectGetProjectQueryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: projectGetLockStatusQueryKey(),
        });
        setIsOpen(false);
      },
      meta: { errorPrefix: "Error restoring project from latest snapshot" },
    });

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectProjectInvalidAttempt intentionally retriggers this effect
  useEffect(() => {
    async function checkSnapshots() {
      try {
        const { data } = await projectGetCache({
          query: { resource: CACHE_RESOURCE_PROJECT_CONFIG },
          throwOnError: true,
        });
        setLatestRevision(
          data.revisions.length > 0
            ? data.revisions[data.revisions.length - 1]
            : null,
        );
        setIsOpen(true);
      } catch {
        setLatestRevision(null);
        setIsOpen(true);
      }
    }

    if (project.errorStatus === HTTP_STATUS_UNPROCESSABLE_CONTENT) {
      void checkSnapshots();
    } else {
      setLatestRevision(null);
      setIsOpen(false);
    }
  }, [project.errorStatus, selectProjectInvalidAttempt]);

  return (
    <GenericDialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
      $maxWidth="35em"
    >
      <Dialog.Header>
        <Dialog.Title>Project configuration is invalid</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        {latestRevision ? (
          <PageText $marginBottom="0">
            This project configuration is invalid or corrupted. Do you want to
            restore it from the latest snapshot?
          </PageText>
        ) : (
          <PageText $marginBottom="0">
            This project configuration is invalid or corrupted and no snapshots
            were found in cache. You may be able to restore it by finding a
            backup on the project disk in the <code>.snapshots</code> folder.
          </PageText>
        )}
      </Dialog.CustomContent>

      <Dialog.Actions>
        {latestRevision && (
          <GeneralButton
            label="Restore"
            isPending={isRestorePending}
            disabled={isRestorePending}
            onClick={() => {
              restoreFromLatestCache();
            }}
          />
        )}
        {latestRevision ? (
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
