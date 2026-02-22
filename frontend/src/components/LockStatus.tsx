import { Button, Icon, Popover, Table } from "@equinor/eds-core-react";
import { lock, lock_open } from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
  projectPostLockAcquireMutation,
} from "#client/@tanstack/react-query.gen";
import type { LockInfo, LockStatus } from "#client/types.gen";
import { Banner } from "#styles/common";
import { displayTimestamp } from "#utils/datetime";

function EnableEditingButton({ lockStatus }: { lockStatus?: LockStatus }) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    ...projectPostLockAcquireMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
  });

  return (
    <Button
      onClick={() => {
        mutate(
          {},
          {
            onSuccess: (data) => {
              if (data.message !== "Project lock acquired.") {
                toast.error(
                  "An error occured and project remains read-only. " +
                    (lockStatus?.last_lock_acquire_error ?? ""),
                );
              }
            },
          },
        );
      }}
    >
      Enable editing
    </Button>
  );
}

function LockInformation({ lock_info }: { lock_info: LockInfo }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const openPopover = () => {
    setIsOpen(true);
  };
  const closePopover = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        ref={anchorRef}
        onClick={openPopover}
        aria-haspopup
        aria-expanded={isOpen}
      >
        Show lock information
      </Button>

      <Popover
        anchorEl={anchorRef.current}
        open={isOpen}
        onClose={closePopover}
        placement="top"
      >
        <Popover.Header>Lock information</Popover.Header>

        <Popover.Content>
          <LockInfoTable lock_info={lock_info} />
        </Popover.Content>
      </Popover>
    </>
  );
}

function LockInfoTable({ lock_info }: { lock_info: LockInfo }) {
  return (
    <Table>
      <Table.Body>
        <Table.Row>
          <Table.Cell>User</Table.Cell>
          <Table.Cell>{lock_info.user}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Host</Table.Cell>
          <Table.Cell>{lock_info.hostname}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Locked since</Table.Cell>
          <Table.Cell>{displayTimestamp(lock_info.acquired_at)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Expires at</Table.Cell>
          <Table.Cell>{displayTimestamp(lock_info.expires_at)}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  );
}

export function LockIcon({ isReadOnly }: { isReadOnly: boolean }) {
  return (
    <Icon
      data={isReadOnly ? lock : lock_open}
      color={
        isReadOnly
          ? tokens.colors.interactive.danger__resting.hex
          : tokens.colors.interactive.primary__resting.hex
      }
      size={24}
    />
  );
}

export function LockStatusBanner({ lockStatus }: { lockStatus?: LockStatus }) {
  const isReadOnly = !(lockStatus?.is_lock_acquired ?? false);

  return (
    <Banner>
      <Banner.Icon>
        <LockIcon isReadOnly={isReadOnly} />
      </Banner.Icon>

      <Banner.Message>
        {`Project is ${isReadOnly ? "read-only" : "editable"}`}
      </Banner.Message>

      {isReadOnly && (
        <Banner.Actions>
          {lockStatus?.lock_info ? (
            <LockInformation lock_info={lockStatus.lock_info} />
          ) : (
            <EnableEditingButton lockStatus={lockStatus} />
          )}
        </Banner.Actions>
      )}
    </Banner>
  );
}
