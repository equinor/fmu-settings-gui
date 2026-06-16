import { Dialog } from "@equinor/eds-core-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  rmsDeleteRmsProjectMutation,
  rmsGetZonesOptions,
  sessionGetSessionOptions,
  sessionGetSessionQueryKey,
} from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import { sessionRmsExpireNotificationThreshold } from "#config";
import { useProject } from "#services/project";
import { GenericDialog, PageText } from "#styles/common";

function getSecondsUntilRmsExpiry(rmsExpiresAt?: string | null) {
  return rmsExpiresAt
    ? Math.max(0, Math.ceil((Date.parse(rmsExpiresAt) - Date.now()) / 1000))
    : Number.POSITIVE_INFINITY;
}

export function RmsExpireNotification() {
  const project = useProject();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isCheckingThreshold = useRef(false);
  const [timeUntilExpire, setTimeUntilExpire] = useState<number>(
    Number.POSITIVE_INFINITY,
  );
  const rmsExpiresAt = project.rmsExpiresAt;
  const isExpired = !rmsExpiresAt;

  const queryClient = useQueryClient();

  const rmsRefreshMutation = useMutation({
    mutationFn: async () => {
      // Invalidate an rms query to trigger rms session extension.
      await queryClient.fetchQuery({
        ...rmsGetZonesOptions(),
        staleTime: 0,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
      setIsDialogOpen(false);
    },
    meta: {
      errorPrefix: "Error refreshing RMS access",
    },
  });

  const rmsCloseMutation = useMutation({
    ...rmsDeleteRmsProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
      setIsDialogOpen(false);
    },
    meta: {
      errorPrefix: "Error closing the RMS project",
    },
  });

  useEffect(() => {
    const initialTimeLeft = getSecondsUntilRmsExpiry(rmsExpiresAt);
    setTimeUntilExpire(initialTimeLeft);

    if (!Number.isFinite(initialTimeLeft) || initialTimeLeft <= 0) {
      return;
    }

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
  }, [rmsExpiresAt]);

  useEffect(() => {
    if (timeUntilExpire === 0) {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
    } else if (
      !isExpired &&
      !isDialogOpen &&
      timeUntilExpire <= sessionRmsExpireNotificationThreshold
    ) {
      if (isCheckingThreshold.current) {
        return;
      }

      isCheckingThreshold.current = true;

      void queryClient
        .fetchQuery({
          ...sessionGetSessionOptions(),
          staleTime: 0,
        })
        .then((freshSession) => {
          const freshTimeUntilExpire = getSecondsUntilRmsExpiry(
            freshSession.rms_expires_at,
          );

          setTimeUntilExpire(freshTimeUntilExpire);

          setIsDialogOpen(
            freshTimeUntilExpire <= sessionRmsExpireNotificationThreshold,
          );
        })
        .finally(() => {
          isCheckingThreshold.current = false;
        });
    }
  }, [queryClient, timeUntilExpire, isDialogOpen, isExpired]);

  const onRmsAccessRefresh = () => {
    rmsRefreshMutation.mutate();
  };

  const onRmsAccessRelease = () => {
    rmsCloseMutation.mutate({});
  };

  return (
    <GenericDialog open={isDialogOpen} $width="35em">
      <Dialog.Header>
        {isExpired ? "RMS access expired" : "RMS access is about to expire"}
      </Dialog.Header>

      <Dialog.Content>
        {isExpired ? (
          <PageText $marginBottom="0">
            Your RMS access has expired. The RMS project can be reopened for
            access from the RMS page.
          </PageText>
        ) : (
          <>
            <PageText>
              Your RMS access will expire in <b>{timeUntilExpire}</b> seconds.
            </PageText>

            <PageText $marginBottom="0">
              Do you want to continue accessing data from this RMS project?
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
            <GeneralButton
              label="Continue RMS access"
              isPending={rmsRefreshMutation.isPending}
              disabled={rmsCloseMutation.isPending}
              onClick={onRmsAccessRefresh}
            />

            <GeneralButton
              label="Close RMS access"
              variant="outlined"
              isPending={rmsCloseMutation.isPending}
              disabled={rmsRefreshMutation.isPending}
              onClick={onRmsAccessRelease}
            />
          </>
        )}
      </Dialog.Actions>
    </GenericDialog>
  );
}
