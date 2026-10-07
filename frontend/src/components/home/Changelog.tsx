import { Typography } from "@equinor/eds-core-react";
import { Link } from "@tanstack/react-router";
import { Suspense } from "react";

import type { ChangeInfo } from "#client/types.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import {
  DEFAULT_CHANGELOG_FILTERS,
  useChangelogEntries,
} from "#components/project/changelog/Changelog";
import { ChangelogEntryHeader } from "#components/project/changelog/ChangelogDetailsDialog";
import { getEntryKey } from "#components/project/changelog/utils";
import { PageHeader, PageText } from "#styles/common";
import {
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import { ChangeItem, ChangeList } from "./Changelog.style";

const RECENT_CHANGE_COUNT = 5;

function ChangelogEntry({ entry }: { entry: ChangeInfo }) {
  return (
    <ChangeItem $changeType={entry.change_type}>
      <ChangelogEntryHeader entry={entry} />
    </ChangeItem>
  );
}

function Content() {
  const changes = useChangelogEntries({
    ...DEFAULT_CHANGELOG_FILTERS,
    entryLimit: RECENT_CHANGE_COUNT,
  });

  if (changes.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  return (
    <>
      <PageText>
        {changes.length === 1
          ? "Showing the most recent change to the project's settings."
          : `Showing the ${changes.length} most recent changes to the project's settings.`}{" "}
        The{" "}
        <Typography link as={Link} to="/project/changelog">
          changelog page
        </Typography>{" "}
        shows all changes.
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
      <PageHeader $variant="h3">Changelog</PageHeader>

      <QueryErrorBoundary
        statusCodeHandling={{
          [HTTP_STATUS_404_NOT_FOUND]: {
            message: "No changelog found for the project.",
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
