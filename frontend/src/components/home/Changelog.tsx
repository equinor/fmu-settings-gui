import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
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
import { FILE_LABELS, formatEntryDescription, getTypeLabel } from "./utils";

function timestampToNumber(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function Content() {
  const { data } = useSuspenseQuery({
    ...projectGetChangelogOptions(),
    meta: { preventDefaultErrorHandling: [404] },
  });

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
      <PageText>
        {latestChanges.length === 1
          ? "Showing the most recent change to this project's settings."
          : `Showing the ${latestChanges.length} most recent changes to this project's settings.`}
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
          404: {
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
