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
} from "./Changelog.style";
import { FILE_LABELS, formatEntryDescription } from "./utils";

function formatTimestamp(value?: string) {
  if (!value) {
    return "(unknown)";
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

import type { ChangeType } from "./types";

const TYPE_LABELS: Record<ChangeType, string> = {
  update: "Modified",
  add: "Added",
  remove: "Removed",
  reset: "Reset",
  merge: "Merged",
  copy: "Copied",
};

function getTypeLabel(changeType: ChangeType) {
  return TYPE_LABELS[changeType];
}

export function Changelog() {
  const { data, isPending, isError, error } = useQuery({
    ...projectGetChangelogOptions(),
    meta: { preventDefaultErrorHandling: [404] },
    retry: (failureCount, queryError) =>
      !(isAxiosError(queryError) && queryError.response?.status === 404) &&
      failureCount < 3,
  });

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
      <PageText>
        {latestChanges.length === 1
          ? "Showing the most recent change to this project&apos;s .fmu files."
          : `Showing the ${latestChanges.length} most recent changes to this project's .fmu files.`}
      </PageText>
      <ChangeList>
        {latestChanges.map((entry) => {
          return (
            <ChangeItem
              key={`${entry.timestamp ?? "no-time"}-${entry.user}-${entry.change_type}-${entry.file}-${entry.path}-${entry.key}`}
              $changeType={entry.change_type}
            >
              <ChangeItemHeader>
                <ChangeDescription>
                  {formatEntryDescription(entry)} in{" "}
                  {FILE_LABELS[entry.file] ?? entry.file}
                </ChangeDescription>
                <ChangeTypeChip $changeType={entry.change_type}>
                  {getTypeLabel(entry.change_type)}
                </ChangeTypeChip>
              </ChangeItemHeader>
              <ChangeItemMeta>
                {formatTimestamp(entry.timestamp)} by {entry.user}
              </ChangeItemMeta>
            </ChangeItem>
          );
        })}
      </ChangeList>
    </>
  );
}
