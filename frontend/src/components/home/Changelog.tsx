import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Suspense } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import { PageHeader, PageText } from "#styles/common";
import { HTTP_STATUS_404_NOT_FOUND } from "#utils/api";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDescription,
  ChangeItem,
  ChangeItemHeader,
  ChangeItemMeta,
  ChangeList,
  ChangeTypeChip,
} from "./Changelog.style";
import { FILE_LABELS, formatEntryDescription, getTypeLabel } from "./utils";

function Content() {
  const { data } = useSuspenseQuery({
    ...projectGetChangelogOptions(),
    meta: {
      preventDefaultErrorHandling: [HTTP_STATUS_404_NOT_FOUND],
      resetQueryOnError: [HTTP_STATUS_404_NOT_FOUND],
    },
    retry: (failureCount, queryError) =>
      !(
        isAxiosError(queryError) &&
        queryError.response?.status === HTTP_STATUS_404_NOT_FOUND
      ) &&
      failureCount < 3,
  });

  if (data.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  const latestChanges = [...data]
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""))
    .slice(0, 5);

  return (
    <>
      <PageText>
        {latestChanges.length === 1
          ? "Showing the most recent change to this project's settings."
          : `Showing the ${latestChanges.length} most recent changes to this project's settings.`}
      </PageText>

      <ChangeList>
        {latestChanges.map((entry) => {
          return (
            <ChangeItem
              key={entry.timestamp ?? "no-time"}
              $changeType={entry.change_type}
            >
              <ChangeItemHeader>
                <ChangeDescription>
                  {formatEntryDescription(entry)}{" "}
                  <span style={{ fontWeight: "normal" }}>in</span>{" "}
                  {FILE_LABELS[entry.file] ?? entry.file}
                </ChangeDescription>
                <ChangeTypeChip $changeType={entry.change_type}>
                  {getTypeLabel(entry.change_type)}
                </ChangeTypeChip>
              </ChangeItemHeader>
              <ChangeItemMeta>
                {entry.timestamp
                  ? displayDateTime(entry.timestamp)
                  : "(unknown date)"}{" "}
                by {entry.user}
              </ChangeItemMeta>
            </ChangeItem>
          );
        })}
      </ChangeList>
    </>
  );
}

export function Changelog() {
  return (
    <>
      <PageHeader $variant="h3">Changelog</PageHeader>

      <QueryErrorBoundary
        statusCodeHandling={{
          [HTTP_STATUS_404_NOT_FOUND]: {
            message: "No changelog found for this project.",
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
