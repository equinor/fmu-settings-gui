import { Button, Dialog } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";

import type { ChangeInfo } from "#client";
import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import { GenericDialog, InfoBox, PageHeader, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDetailsCode,
  ChangeDetailsMeta,
  ChangeLogTable,
  TypeCell,
} from "./ChangeLog.style";

function formatTimestamp(value?: string) {
  if (!value) {
    return "unknown";
  }

  return displayDateTime(value);
}

function timestampToNumber(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatChangeDescription(change: string) {
  return change
    .replace(/Old value:\s*/g, "Old value:\n")
    .replace(/\s*->\s*New value:\s*/g, "\n\nNew value:\n");
}

export function ChangeLog() {
  const [selectedChange, setSelectedChange] = useState<ChangeInfo | null>(null);
  const { data, isPending, isError, error } = useQuery(
    projectGetChangelogOptions(),
  );

  if (isPending) {
    return <PageText>Loading changelog...</PageText>;
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <PageText>No changelog found for this project.</PageText>;
    }

    return <PageText>Unable to load changelog.</PageText>;
  }

  if (data.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  const latestChanges = [...data]
    .sort(
      (a, b) => timestampToNumber(b.timestamp) - timestampToNumber(a.timestamp),
    )
    .slice(0, 5);

  return (
    <InfoBox>
      <PageHeader $variant="h4">Recent changes (last 5)</PageHeader>

      <ChangeLogTable>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {latestChanges.map((entry) => (
            <tr
              key={`${entry.timestamp ?? "no-time"}-${entry.user}-${entry.change_type}-${entry.file}-${entry.path}-${entry.key}`}
            >
              <td>{formatTimestamp(entry.timestamp)}</td>
              <td>{entry.user}</td>
              <td>
                <TypeCell>
                  {entry.change_type}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedChange(entry);
                    }}
                  >
                    Details
                  </Button>
                </TypeCell>
              </td>
            </tr>
          ))}
        </tbody>
      </ChangeLogTable>

      <GenericDialog
        isDismissable={true}
        open={selectedChange !== null}
        onClose={() => {
          setSelectedChange(null);
        }}
        $maxWidth="56em"
      >
        <Dialog.Header>
          <Dialog.Title>Change details</Dialog.Title>
        </Dialog.Header>

        <Dialog.Content>
          {selectedChange && (
            <>
              <ChangeDetailsMeta>
                <tbody>
                  <tr>
                    <th>Time</th>
                    <td>{formatTimestamp(selectedChange.timestamp)}</td>
                  </tr>
                  <tr>
                    <th>User</th>
                    <td>{selectedChange.user}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{selectedChange.change_type}</td>
                  </tr>
                  <tr>
                    <th>Key</th>
                    <td>{selectedChange.key}</td>
                  </tr>
                  <tr>
                    <th>File</th>
                    <td>{selectedChange.file}</td>
                  </tr>
                  <tr>
                    <th>Path</th>
                    <td>{selectedChange.path}</td>
                  </tr>
                </tbody>
              </ChangeDetailsMeta>
              <PageText>
                <span className="emphasis">Description:</span>
              </PageText>
              <ChangeDetailsCode>
                {formatChangeDescription(selectedChange.change)}
              </ChangeDetailsCode>
            </>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            onClick={() => {
              setSelectedChange(null);
            }}
          >
            Close
          </Button>
        </Dialog.Actions>
      </GenericDialog>
    </InfoBox>
  );
}
