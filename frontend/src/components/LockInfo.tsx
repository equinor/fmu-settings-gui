import { Button, Icon, Popover, Table, Tooltip } from "@equinor/eds-core-react";
import { lock, lock_open } from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { useRef, useState } from "react";

import { LockInfo } from "#client";
import { displayTimestamp } from "#utils/datetime";
import { LockInfoContainer } from "./LockInfo.style";

export function LockInfoPopOver({ lock_info }: { lock_info: LockInfo }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <LockInfoContainer>
      <Button
        variant="outlined"
        ref={anchorRef}
        onMouseOver={() => {
          setIsOpen(true);
        }}
        onMouseLeave={() => {
          setIsOpen(false);
        }}
      >
        <LockIcon isReadOnly={true} /> Project is read only
      </Button>

      <Popover anchorEl={anchorRef.current} open={isOpen} placement="right">
        <Popover.Header>Lock information</Popover.Header>

        <Popover.Content>
          <LockInfoTable lock_info={lock_info} />
        </Popover.Content>
      </Popover>
    </LockInfoContainer>
  );
}
export function LockInfoTable({ lock_info }: { lock_info: LockInfo }) {
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
          <Table.Cell>PID</Table.Cell>
          <Table.Cell>{lock_info.pid}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  );
}

export function LockIcon({
  isReadOnly,
  toolTipText,
}: {
  isReadOnly: boolean;
  toolTipText?: string;
}) {
  return (
    <Tooltip title={toolTipText ?? (isReadOnly ? "Locked" : "Unlocked")}>
      <Icon
        data={isReadOnly ? lock : lock_open}
        color={
          isReadOnly
            ? tokens.colors.infographic.primary__energy_red_100.rgba
            : tokens.colors.infographic.primary__moss_green_100.rgba
        }
        size={18}
      />
    </Tooltip>
  );
}
