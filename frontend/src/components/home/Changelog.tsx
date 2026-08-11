import { Typography } from "@equinor/eds-core-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { Suspense } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import type { ChangeInfo } from "#client/types.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import {
  FILE_LABELS,
  formatEntryDescription,
  getTypeLabel,
} from "#components/project/changelog/utils";
import { PageHeader, PageText } from "#styles/common";
import {
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDescription,
  ChangeItem,
  ChangeItemHeader,
  ChangeItemMeta,
  ChangeList,
  ChangelogHeader,
  ChangeTypeChip,
} from "./Changelog.style";

const RECENT_CHANGE_COUNT = 5;

function getEntryKey(entry: ChangeInfo, index: number) {
  return [
    entry.timestamp ?? "no-time",
    entry.user,
    entry.file,
    entry.key || entry.path || "no-field",
    entry.change_type,
    index,
  ].join(":");
}

function useChangelogEntries() {
  const { data } = useSuspenseQuery({
    ...projectGetChangelogOptions({
      query: { max_entries: RECENT_CHANGE_COUNT },
    }),
    meta: {
      preventDefaultErrorHandling: [
        HTTP_STATUS_404_NOT_FOUND,
        HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
      ],
      resetQueryOnError: [
        HTTP_STATUS_404_NOT_FOUND,
        HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
      ],
    },
    retry: (failureCount, queryError) =>
      !(
        isAxiosError(queryError) &&
        [
          HTTP_STATUS_404_NOT_FOUND,
          HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
        ].includes(queryError.response?.status ?? 0)
      ) && failureCount < 3,
  });

  return [...data].sort((a, b) =>
    (b.timestamp ?? "").localeCompare(a.timestamp ?? ""),
  );
}

function ChangelogEntry({ entry }: { entry: ChangeInfo }) {
  return (
    <ChangeItem $changeType={entry.change_type}>
      <ChangeItemHeader>
        <ChangeDescription>
          {formatEntryDescription(entry)}
          {entry.change_type !== "init" && (
            <>
              {" "}
              <span style={{ fontWeight: "normal" }}>in</span>{" "}
              {FILE_LABELS[entry.file] ?? entry.file}
            </>
          )}
        </ChangeDescription>
        <ChangeTypeChip $changeType={entry.change_type}>
          {getTypeLabel(entry.change_type)}
        </ChangeTypeChip>
      </ChangeItemHeader>
      <ChangeItemMeta>
        {entry.timestamp ? displayDateTime(entry.timestamp) : "(unknown date)"}{" "}
        by {entry.user}
      </ChangeItemMeta>
    </ChangeItem>
  );
}

function Content() {
  const changes = useChangelogEntries();

  if (changes.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  return (
    <>
      <PageText>
        {changes.length === 1
          ? "Showing the most recent change to this project's settings."
          : `Showing the ${changes.length} most recent changes to this project's settings.`}{" "}
        <Typography link as={Link} to="/project/changelog">
          View full changelog
        </Typography>
      </PageText>

      <ChangeList>
        {changes.map((entry, index) => (
          <ChangelogEntry key={getEntryKey(entry, index)} entry={entry} />
        ))}
      </ChangeList>
    </>
  );
}

export function Changelog() {
  return (
    <>
      <ChangelogHeader>
        <PageHeader $variant="h3" $marginBottom="0">
          Changelog
        </PageHeader>
      </ChangelogHeader>

      <QueryErrorBoundary
        statusCodeHandling={{
          [HTTP_STATUS_404_NOT_FOUND]: {
            message: "No changelog found for this project.",
            enableRetry: false,
          },
          [HTTP_STATUS_422_UNPROCESSABLE_CONTENT]: {
            message: "The changelog contains invalid data and cannot be shown.",
            enableRetry: false,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <Content />
        </Suspense>
      </QueryErrorBoundary>
    </>
  );
}
