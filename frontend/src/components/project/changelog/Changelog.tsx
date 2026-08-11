import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { type ChangeEvent, Suspense, useState } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import type { ChangeInfo, ChangeType } from "#client/types.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import { PageContainerNotWidthConstrained, PageText } from "#styles/common";
import {
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import {
  ChangelogFilterBar,
  ChangelogFilterField,
  ChangelogFilterSelect,
} from "./Changelog.style";
import { ChangelogTable } from "./ChangelogTable";
import { getTypeLabel } from "./utils";

type EntryLimit = "all" | "10" | "25" | "50" | "100";

type ChangelogFilters = {
  changeType: "all" | ChangeType;
  entryLimit: EntryLimit;
};

const CHANGE_TYPE_OPTIONS: ("all" | ChangeType)[] = [
  "all",
  "init",
  "add",
  "update",
  "remove",
  "reset",
  "restore",
  "merge",
  "copy",
];

const ENTRY_LIMIT_OPTIONS: EntryLimit[] = ["all", "10", "25", "50", "100"];

const DEFAULT_CHANGELOG_FILTERS: ChangelogFilters = {
  changeType: "all",
  entryLimit: "all",
};

function useChangelogEntries() {
  const { data } = useSuspenseQuery({
    ...projectGetChangelogOptions(),
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

function getChangeTypeOptionLabel(changeType: "all" | ChangeType) {
  if (changeType === "all") {
    return "All change types";
  }

  return getTypeLabel(changeType);
}

function filterChangelogEntries(
  entries: ChangeInfo[],
  filters: ChangelogFilters,
) {
  const changeTypeFilteredEntries =
    filters.changeType === "all"
      ? entries
      : entries.filter((entry) => entry.change_type === filters.changeType);

  if (filters.entryLimit === "all") {
    return changeTypeFilteredEntries;
  }

  return changeTypeFilteredEntries.slice(0, Number(filters.entryLimit));
}

function ChangelogFilterControls({
  filters,
  onChange,
}: {
  filters: ChangelogFilters;
  onChange: (filters: ChangelogFilters) => void;
}) {
  function handleChange(
    field: keyof ChangelogFilters,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    onChange({ ...filters, [field]: event.target.value });
  }

  return (
    <ChangelogFilterBar>
      <ChangelogFilterField>
        Change type
        <ChangelogFilterSelect
          value={filters.changeType}
          onChange={(event) => {
            handleChange("changeType", event);
          }}
        >
          {CHANGE_TYPE_OPTIONS.map((changeType) => (
            <option key={changeType} value={changeType}>
              {getChangeTypeOptionLabel(changeType)}
            </option>
          ))}
        </ChangelogFilterSelect>
      </ChangelogFilterField>

      <ChangelogFilterField>
        Number of entries
        <ChangelogFilterSelect
          value={filters.entryLimit}
          onChange={(event) => {
            handleChange("entryLimit", event);
          }}
        >
          {ENTRY_LIMIT_OPTIONS.map((entryLimit) => (
            <option key={entryLimit} value={entryLimit}>
              {entryLimit === "all" ? "All entries" : entryLimit}
            </option>
          ))}
        </ChangelogFilterSelect>
      </ChangelogFilterField>
    </ChangelogFilterBar>
  );
}

function Content() {
  const allChanges = useChangelogEntries();
  const [filters, setFilters] = useState<ChangelogFilters>(
    DEFAULT_CHANGELOG_FILTERS,
  );

  if (allChanges.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  const changes = filterChangelogEntries(allChanges, filters);

  return (
    <>
      <PageText>
        Showing {changes.length} of {allChanges.length} changes to this
        project's settings.
      </PageText>

      <PageContainerNotWidthConstrained>
        <ChangelogFilterControls filters={filters} onChange={setFilters} />
        {changes.length === 0 ? (
          <PageText>No changelog entries match the selected filters.</PageText>
        ) : (
          <ChangelogTable entries={changes} />
        )}
      </PageContainerNotWidthConstrained>
    </>
  );
}

export function Changelog() {
  return (
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
  );
}
