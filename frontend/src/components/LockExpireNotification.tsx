import { Button, Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  projectGetLockStatusQueryKey,
  projectPostLockRefreshMutation,
  projectPostLockReleaseMutation,
} from "#client/@tanstack/react-query.gen";
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

    const updateTimeUntilExpire = () => {
      const lockExpireAt = new Date(lockInfo.expires_at * 1000).getTime();
      const timeLeft = Math.max(
        0,
        Math.ceil((lockExpireAt - Date.now()) / 1000) * 1000,
      );

      setTimeUntilExpire(timeLeft);
    };

    updateTimeUntilExpire();

    const interval = setInterval(updateTimeUntilExpire, 1000); // setInterval : countdown

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
    } else {
      return;
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
              <b>{Math.ceil(timeUntilExpire / 1000)}</b> seconds.
            </PageText>

            <PageText $marginBottom="0">
              Do you want to extend the lock?
            </PageText>
          </>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        {isExpired ? (
          <Button
            onClick={() => {
              setIsDialogOpen(false);
            }}
          >
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onLockRefresh}>Extend lock</Button>
            <Button variant="outlined" onClick={onLockRelease}>
              Release lock
            </Button>
          </>
        )}
      </Dialog.Actions>
    </GenericDialog>
  );
}
