import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import { PageHeader, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDescription,
  ChangeItem,
  ChangeItemHeader,
  ChangeItemMeta,
  ChangeList,
  ChangeTypeChip,
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

  if (concise.length <= 72) {
    return concise;
  }

  return `${concise.slice(0, 69)}...`;
}

function getTypeLabel(changeType: string) {
  return toTitleCase(changeType);
}

export function ChangeLog() {
  const { data, isPending, isError, error } = useQuery(
    projectGetChangelogOptions(),
  );

  if (isPending) {
    return (
      <>
        <PageHeader $variant="h3">Changelog</PageHeader>
        <PageText>Loading changelog...</PageText>
      </>
    );
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <>
          <PageHeader $variant="h3">Changelog</PageHeader>
          <PageText>No changelog found for this project.</PageText>
        </>
      );
    }

    return (
      <>
        <PageHeader $variant="h3">Changelog</PageHeader>
        <PageText>Unable to load changelog.</PageText>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <PageHeader $variant="h3">Changelog</PageHeader>
        <PageText>No changelog entries yet.</PageText>
      </>
    );
  }

  const latestChanges = [...data]
    .sort(
      (a, b) => timestampToNumber(b.timestamp) - timestampToNumber(a.timestamp),
    )
    .slice(0, 5);

  return (
    <>
      <PageHeader $variant="h3">Changelog</PageHeader>
      <PageText>Recent changes to this project&apos;s settings.</PageText>
      <PageText $marginBottom="0">
        Showing the last {latestChanges.length} change
        {latestChanges.length === 1 ? "" : "s"}.
      </PageText>
      <ChangeList>
        {latestChanges.map((entry) => {
          return (
            <ChangeItem
              key={`${entry.timestamp ?? "no-time"}-${entry.user}-${entry.change_type}-${entry.file}-${entry.path}-${entry.key}`}
            >
              <ChangeItemHeader>
                <span>{formatTimestamp(entry.timestamp)}</span>
                <ChangeTypeChip $changeType={entry.change_type}>
                  {getTypeLabel(entry.change_type)}
                </ChangeTypeChip>
              </ChangeItemHeader>

              <ChangeDescription>
                {formatBriefDescription(entry.change)}
              </ChangeDescription>
              <ChangeItemMeta>
                <span>{entry.user}</span>
                <span>Key: {entry.key}</span>
              </ChangeItemMeta>
            </ChangeItem>
          );
        })}
      </ChangeList>
    </>
  );
}
