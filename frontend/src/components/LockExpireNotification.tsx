import { Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  projectGetLockStatusQueryKey,
  projectPostLockRefreshMutation,
  projectPostLockReleaseMutation,
} from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import { projectLockExpireNotificationThreshold } from "#config";
import { useProject } from "#services/project";
import { GenericDialog, PageText } from "#styles/common";

export function LockExpireNotification() {
  const project = useProject();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeUntilExpire, setTimeUntilExpire] = useState<number>(
    Number.POSITIVE_INFINITY,
  );

  const lockInfo = project.lockStatus?.lock_info;
  const isLockAcquired = project.lockStatus?.is_lock_acquired;
  const isExpired = !isLockAcquired;

  const queryClient = useQueryClient();

  const lockRefreshMutation = useMutation({
    ...projectPostLockRefreshMutation(),
    onSuccess: () => {
      setTimeUntilExpire(Number.POSITIVE_INFINITY);
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      setIsDialogOpen(false);
    },
    meta: {
      errorPrefix: "Error refreshing the lock",
    },
  });

  const lockReleaseMutation = useMutation({
    ...projectPostLockReleaseMutation(),
    onSuccess: () => {
      setTimeUntilExpire(Number.POSITIVE_INFINITY);
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      setIsDialogOpen(false);
    },
    meta: {
      errorPrefix: "Error releasing the lock",
    },
  });

  useEffect(() => {
    if (!isLockAcquired || !lockInfo) {
      setTimeUntilExpire(Number.POSITIVE_INFINITY);

      return;
    }

    const initialTimeLeft = Math.max(
      0,
      Math.ceil(lockInfo.expires_at - Date.now() / 1000),
    );

    setTimeUntilExpire(initialTimeLeft);

    const interval = setInterval(() => {
      setTimeUntilExpire((currentTimeLeft) => {
        if (!Number.isFinite(currentTimeLeft) || currentTimeLeft <= 0) {
          return currentTimeLeft;
        }

        return currentTimeLeft - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isLockAcquired, lockInfo]);

  useEffect(() => {
    if (timeUntilExpire === 0) {
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
    } else if (
      isLockAcquired &&
      !isDialogOpen &&
      timeUntilExpire <= projectLockExpireNotificationThreshold
    ) {
      setIsDialogOpen(true);
    } else if (
      !isLockAcquired &&
      timeUntilExpire !== Number.POSITIVE_INFINITY
    ) {
      setTimeUntilExpire(Number.POSITIVE_INFINITY);
    }
  }, [isDialogOpen, isLockAcquired, timeUntilExpire, queryClient]);

  const onLockRefresh = () => {
    lockRefreshMutation.mutate({});
  };

  const onLockRelease = () => {
    lockReleaseMutation.mutate({});
  };

  return (
    <GenericDialog open={isDialogOpen} $width="35em">
      <Dialog.Header>
        {isExpired ? "Lock expired" : "Lock about to expire"}
      </Dialog.Header>

      <Dialog.Content>
        {isExpired ? (
          <PageText $marginBottom="0">
            Your lock has expired. Project is now read-only. It can be opened
            for editing from the project overview page.
          </PageText>
        ) : (
          <>
            <PageText>
              Your lock will expire and the project will become read-only in{" "}
              <b>{timeUntilExpire}</b> seconds.
            </PageText>

            <PageText $marginBottom="0">
              Do you want to extend the lock?
            </PageText>
          </>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        {isExpired ? (
          <GeneralButton
            label="Close"
            onClick={() => {
              setIsDialogOpen(false);
            }}
          />
        ) : (
          <>
            <GeneralButton label="Extend lock" onClick={onLockRefresh} />
            <GeneralButton
              label="Release lock"
              variant="outlined"
              onClick={onLockRelease}
            />
          </>
        )}
      </Dialog.Actions>
    </GenericDialog>
  );
}
