import { Button, Dialog } from "@equinor/eds-core-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useProject } from "#services/project";
import {projectLockTimeoutWarningThreshold} from "#config";


import {
  // projectGetProjectQueryKey,
  projectPostLockRefreshMutation, 
  projectGetLockStatusQueryKey
} from "#client/@tanstack/react-query.gen";

import { EditDialog, PageText } from "#styles/common";

type LockStatus = {
  lock_info?: {
    expires_at?: string;
  }
}

export function LockExpireDialog(
  {lockStatus,

}: {lockStatus?: LockStatus;

})
 {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeUntilExpire, setTimeUntilExpire] = useState<number>(0);
  const refreshLockMutation = useProjectPostLockRefreshMutation();  // use generated mutation for lock refresh 
  // const [isExpired, setIsExpired] = useState(false);

  const lockInfo = project.lockStatus?.lock_info;
  const lockExpireAt = lockInfo?.expires_at
    ? new Date(lockInfo.expires_at).getTime()
    : undefined;

  const onLockRefresh = () => {
    // void queryClient.invalidateQueries({
    //   queryKey: projectGetProjectQueryKey(),
    // });
      projectPostLockRefreshMutation.mutate(undefined, {
        onSuccess: () => {
          refreshLockStatus();
        },
      });
  }
    setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      setIsDialogOpen(false);
    }, 100); // 100ms delay to allow API to update session
  };

  useEffect(() => {
    if (lockExpireAt) {
      const updateTimeUntilExpire = () => {
        const timeLeft = Math.max(0, lockExpireAt - Date.now());
        setTimeUntilExpire(timeLeft);

        timeLeft <= projectLockTimeoutWarningThreshold ? setIsDialogOpen(true) : setIsDialogOpen(false);
      };

      updateTimeUntilExpire();

      const interval = setInterval(updateTimeUntilExpire, 1000); // setInterval : countdown 

      return () => {
        clearInterval(interval);
      };
    }
  }, [lockExpireAt]);
  console.log("LockExpireDialog lockInfo:", lockInfo);
  console.log("LockExpireDialog lockExpireAt:", lockExpireAt);
  console.log("LockExpireDialog rendered. Time until expire:", timeUntilExpire);

  return (
    <EditDialog open={isDialogOpen} $minWidth="20em">
      <Dialog.Header>
        {isExpired ? "Lock expired" : "Lock about to expire"}
      </Dialog.Header>

      <Dialog.Content>
        {isExpired ? (
          <PageText>
            Your lock has expired.
            Project is now read-only. It can be opened for editing from the project 
            overview page. 
          </PageText>
        ) : (
          <PageText>
            Your lock will expire in{" "}
            <b>{Math.ceil(timeUntilExpire / 1000)}</b> seconds. <br />
            Do you want to extend the lock?
          </PageText>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        {!isExpired && (<Button onClick={onLockRefresh}>Extend Lock</Button>)}
          <Button
            onClick={() => {
              setIsDialogOpen(false);
              setIsExpired(false);
            }}
            variant="contained"
          >
            Ok
          </Button> 
      </Dialog.Actions>
    </EditDialog>
  );
}