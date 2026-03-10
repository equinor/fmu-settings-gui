import { Accordion } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import { InfoBox, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDescription,
  ChangeItem,
  ChangeItemHeader,
  ChangeItemMeta,
  ChangeList,
  ChangeTypeBadge,
  ChangeTypeDot,
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

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBriefDescription(change: string) {
  const compact = change.replace(/\s+/g, " ").trim();
  const withoutDiffPayload = compact
    .replace(/Old value:\s*[\s\S]*$/i, "")
    .replace(/New value:\s*[\s\S]*$/i, "")
    .replace(/\s*->\s*/g, " ")
    .trim();
  const concise = withoutDiffPayload || compact;

  if (concise.length <= 96) {
    return concise;
  }

  return `${concise.slice(0, 93)}...`;
}

function getTypeLabel(changeType: string) {
  return toTitleCase(changeType);
}

export function ChangeLog() {
  const [open, setOpen] = useState(true);
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
    <>
      <Accordion>
        <Accordion.Item isExpanded={open} onExpandedChange={setOpen}>
          <Accordion.Header>Changelog</Accordion.Header>
          <Accordion.Panel>
            <PageText>
              Quick summary of the latest project configuration changes.
            </PageText>
            <InfoBox>
              <PageText $marginBottom="0">
                {latestChanges.length} changes since last snapshot.
              </PageText>
              <ChangeList>
                {latestChanges.map((entry) => (
                  <ChangeItem
                    key={`${entry.timestamp ?? "no-time"}-${entry.user}-${entry.change_type}-${entry.file}-${entry.path}-${entry.key}`}
                  >
                    <ChangeItemHeader>
                      <ChangeTypeDot $changeType={entry.change_type} />
                      <ChangeTypeBadge $changeType={entry.change_type}>
                        {getTypeLabel(entry.change_type)}
                      </ChangeTypeBadge>
                    </ChangeItemHeader>
                    <ChangeDescription>
                      {formatBriefDescription(entry.change)}
                    </ChangeDescription>
                    <ChangeItemMeta>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      <span>{entry.user}</span>
                      <span>Type: {getTypeLabel(entry.change_type)}</span>
                      <span>Key: {entry.key}</span>
                    </ChangeItemMeta>
                  </ChangeItem>
                ))}
              </ChangeList>
            </InfoBox>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  );
}
