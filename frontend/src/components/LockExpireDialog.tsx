import { Button, Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {projectLockTimeoutWarningThreshold} from "#config";
import { displayTimestamp } from "#utils/datetime";

import { LockStatus } from "#client";
import {
  projectPostLockRefreshMutation, 
  projectGetLockStatusQueryKey
} from "#client/@tanstack/react-query.gen";
import { EditDialog, PageText } from "#styles/common";

export function LockExpireDialog({lockStatus}: {lockStatus: LockStatus})
{
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility
  const [timeUntilExpire, setTimeUntilExpire] = useState<number>(200000);
  const queryClient = useQueryClient();
  const [isExpired, setIsExpired] = useState(false); 
  // Extract lock information and expiration time
  const lockExpireAt = lockStatus.lock_info?.expires_at
    ? new Date(lockStatus.lock_info.expires_at * 1000).getTime()
    : undefined;

  // This is how define a mutation : refresh the lock
    const { mutate, isPending } = useMutation({
    ...projectPostLockRefreshMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      setIsDialogOpen(false);
    },
    meta: {
      errorPrefix: "Error refreshing the lock",
    },
  });

  const onLockRefresh = () => {
      mutate({});
  };
  
  // The Timer : TODO Add the icon to see how it looks 
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
  console.log("LockExpireDialog lockInfo:", lockStatus.lock_info);
  console.log("LockExpireDialog lockExpireAt:", displayTimestamp(lockExpireAt) );
  console.log("LockExpireDialog rendered. Time until expire:", timeUntilExpire);

  useEffect(() => {
    if (timeUntilExpire === 0) {
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      setIsExpired(true);
    }
  }, [timeUntilExpire, queryClient]);

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
              Your lock will expire and the project will become read-only in{" "}. 
              <b>{Math.ceil(timeUntilExpire / 1000)}</b> seconds. <br />
              Do you want to extend the lock?
            </PageText>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          {isExpired ? (
            <>
          <Button onClick={onLockRefresh}>Extend Lock</Button>  
          <Button
              onClick={() => {
                setIsDialogOpen(false);
              }}
              variant="contained"
            >
              Release Lock
            </Button>  </>) : 
          <Button
              onClick={() => {
                setIsDialogOpen(false);
              }}
              variant="contained"
            >
              Ok
            </Button> 
          }
            
        </Dialog.Actions>
          </EditDialog>
        );
    }