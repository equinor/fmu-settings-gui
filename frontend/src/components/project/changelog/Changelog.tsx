import { NativeSelect } from "@equinor/eds-core-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { type ChangeEvent, Suspense, useState } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import type { ChangeType, ProjectGetChangelogData } from "#client/types.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import { PageContainerNotWidthConstrained, PageText } from "#styles/common";
import {
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import { ChangelogFilterBar, ChangelogFilterField } from "./Changelog.style";
import { ChangelogTable } from "./ChangelogTable";
import { getTypeLabel } from "./utils";

type EntryLimit = "all" | "10" | "25" | "50" | "100";
type SettingsTypeFilter = "all" | "config.json" | "mappings.json";

type ChangelogFilters = {
  changeType: "all" | ChangeType;
  settingsType: SettingsTypeFilter;
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

const SETTINGS_TYPE_OPTIONS: SettingsTypeFilter[] = [
  "all",
  "config.json",
  "mappings.json",
];

const SETTINGS_TYPE_LABELS: Record<SettingsTypeFilter, string> = {
  all: "All settings types",
  "config.json": "Project configuration",
  "mappings.json": "Mappings",
};

const DEFAULT_CHANGELOG_FILTERS: ChangelogFilters = {
  changeType: "all",
  settingsType: "all",
  entryLimit: "25",
};

function getChangelogQuery(filters: ChangelogFilters) {
  const query: ProjectGetChangelogData["query"] = {};

  if (filters.changeType !== "all") {
    query.change_type = filters.changeType;
  }

  if (filters.settingsType !== "all") {
    query.field_name = "file";
    query.filter_value = filters.settingsType;
    query.filter_type = "text";
    query.operator = "==";
  }

  if (filters.entryLimit !== "all") {
    query.max_entries = Number(filters.entryLimit);
  }

  return query;
}

function useChangelogEntries(filters: ChangelogFilters) {
  const { data } = useSuspenseQuery({
    ...projectGetChangelogOptions({ query: getChangelogQuery(filters) }),
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
    return "All changes";
  }

  return getTypeLabel(changeType);
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
        <NativeSelect
          id="changelog-change-type"
          label="Filter changes by"
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
        </NativeSelect>
      </ChangelogFilterField>

      <ChangelogFilterField>
        <NativeSelect
          id="changelog-settings-type"
          label="Settings type"
          value={filters.settingsType}
          onChange={(event) => {
            handleChange("settingsType", event);
          }}
        >
          {SETTINGS_TYPE_OPTIONS.map((settingsType) => (
            <option key={settingsType} value={settingsType}>
              {SETTINGS_TYPE_LABELS[settingsType]}
            </option>
          ))}
        </NativeSelect>
      </ChangelogFilterField>

      <ChangelogFilterField>
        <NativeSelect
          id="changelog-entry-limit"
          label="Show"
          value={filters.entryLimit}
          onChange={(event) => {
            handleChange("entryLimit", event);
          }}
        >
          {ENTRY_LIMIT_OPTIONS.map((entryLimit) => (
            <option key={entryLimit} value={entryLimit}>
              {entryLimit === "all" ? "All changes" : `Latest ${entryLimit}`}
            </option>
          ))}
        </NativeSelect>
      </ChangelogFilterField>
    </ChangelogFilterBar>
  );
}

function Content() {
  const [filters, setFilters] = useState<ChangelogFilters>(
    DEFAULT_CHANGELOG_FILTERS,
  );
  const changes = useChangelogEntries(filters);

  return (
    <PageContainerNotWidthConstrained>
      <ChangelogFilterControls filters={filters} onChange={setFilters} />
      {changes.length === 0 ? (
        <PageText>No changelog entries match the selected filters.</PageText>
      ) : (
        <>
          <PageText>
            Showing {changes.length} changes to this project's settings.
          </PageText>
          <ChangelogTable entries={changes} />
        </>
      )}
    </PageContainerNotWidthConstrained>
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
