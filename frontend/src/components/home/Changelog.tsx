import { Button, Dialog, Typography } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { type ChangeEvent, Suspense, useState } from "react";

import { projectGetChangelogOptions } from "#client/@tanstack/react-query.gen";
import type { ChangeInfo, ChangeType } from "#client/types.gen";
import { Loading, QueryErrorBoundary } from "#components/common";
import {
  GenericDialog,
  PageContainerNotWidthConstrained,
  PageHeader,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDescription,
  ChangeDetails,
  ChangeDetailsContent,
  ChangeDetailsHeader,
  ChangeDetailsSummary,
  ChangeDetailsValueGrid,
  ChangeDetailsValueHeader,
  ChangeDetailsValuePanel,
  ChangeItem,
  ChangeItemField,
  ChangeItemHeader,
  ChangeItemMeta,
  ChangeList,
  ChangelogFilterBar,
  ChangelogFilterField,
  ChangelogFilterSelect,
  ChangelogHeader,
  ChangelogTableContainer,
  ChangeTypeChip,
} from "./Changelog.style";
import {
  FILE_LABELS,
  formatChangeDetails,
  formatChangedField,
  formatEntryDescription,
  getTypeLabel,
  parseChangeDetails,
} from "./utils";

type ChangelogContentProps = {
  full?: boolean;
};

type EntryLimit = "all" | "10" | "25" | "50" | "100";

type ChangelogFilters = {
  changeType: "all" | ChangeType;
  entryLimit: EntryLimit;
};

const RECENT_CHANGE_COUNT = 5;

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

function ChangelogEntry({
  entry,
  showField,
}: {
  entry: ChangeInfo;
  showField: boolean;
}) {
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
      {showField && entry.change_type !== "init" && (
        <ChangeItemField>
          Changed field: {formatChangedField(entry)}
        </ChangeItemField>
      )}
      <ChangeItemMeta>
        {entry.timestamp ? displayDateTime(entry.timestamp) : "(unknown date)"}{" "}
        by {entry.user}
      </ChangeItemMeta>
    </ChangeItem>
  );
}

function ChangeDetailsDialog({
  entry,
  onClose,
}: {
  entry?: ChangeInfo;
  onClose: () => void;
}) {
  const fieldPath = entry ? entry.key || entry.path : undefined;
  const details = entry
    ? parseChangeDetails(entry.change, fieldPath)
    : undefined;
  const hasValueDiff =
    details?.oldValue !== undefined || details?.newValue !== undefined;

  return (
    <GenericDialog open={entry !== undefined} $maxWidth="56em">
      <Dialog.Header>
        <Dialog.Title>Changelog details</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        {entry && (
          <ChangeDetails>
            <ChangeDetailsHeader>
              <PageText $marginBottom="0">
                <span className="emphasis">
                  {formatEntryDescription(entry)}
                </span>
                {entry.change_type !== "init" && (
                  <> in {FILE_LABELS[entry.file] ?? entry.file}</>
                )}
                <br />
                Changed field: {formatChangedField(entry)}
                <br />
                {entry.timestamp
                  ? displayDateTime(entry.timestamp)
                  : "(unknown date)"}{" "}
                by {entry.user}
              </PageText>
              <ChangeTypeChip $changeType={entry.change_type}>
                {getTypeLabel(entry.change_type)}
              </ChangeTypeChip>
            </ChangeDetailsHeader>

            {hasValueDiff ? (
              <>
                {details.summary && (
                  <ChangeDetailsSummary>{details.summary}</ChangeDetailsSummary>
                )}
                <ChangeDetailsValueGrid>
                  <ChangeDetailsValuePanel $kind="before">
                    <ChangeDetailsValueHeader>
                      Before change
                    </ChangeDetailsValueHeader>
                    <ChangeDetailsContent>
                      {details.oldValue ?? "(empty)"}
                    </ChangeDetailsContent>
                  </ChangeDetailsValuePanel>
                  <ChangeDetailsValuePanel $kind="after">
                    <ChangeDetailsValueHeader>
                      After change
                    </ChangeDetailsValueHeader>
                    <ChangeDetailsContent>
                      {details.newValue ?? "(empty)"}
                    </ChangeDetailsContent>
                  </ChangeDetailsValuePanel>
                </ChangeDetailsValueGrid>
              </>
            ) : (
              <>
                <ChangeDetailsSummary>
                  Detailed before and after values were not recorded for this
                  changelog entry.
                </ChangeDetailsSummary>
                <ChangeDetailsContent>
                  {formatChangeDetails(entry.change, fieldPath)}
                </ChangeDetailsContent>
              </>
            )}
          </ChangeDetails>
        )}
      </Dialog.CustomContent>

      <Dialog.Actions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Dialog.Actions>
    </GenericDialog>
  );
}

function FullChangelogTable({ entries }: { entries: ChangeInfo[] }) {
  const [selectedEntry, setSelectedEntry] = useState<ChangeInfo | undefined>();
  const columns: ColumnDef<ChangeInfo>[] = [
    {
      accessorKey: "timestamp",
      header: "Date",
      cell: ({ row }) =>
        row.original.timestamp
          ? displayDateTime(row.original.timestamp)
          : "(unknown date)",
    },
    {
      accessorKey: "change_type",
      header: "Change type",
      cell: ({ row }) => getTypeLabel(row.original.change_type),
    },
    {
      id: "description",
      header: "Change",
      accessorFn: (entry) => formatEntryDescription(entry),
    },
    {
      accessorKey: "file",
      header: "File",
      cell: ({ row }) => FILE_LABELS[row.original.file] ?? row.original.file,
    },
    {
      id: "field",
      header: "Field",
      accessorFn: (entry) => formatChangedField(entry),
    },
    {
      accessorKey: "user",
      header: "User",
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <Button
          variant="outlined"
          onClick={() => {
            setSelectedEntry(row.original);
          }}
        >
          View details
        </Button>
      ),
    },
  ];

  return (
    <>
      <ChangeDetailsDialog
        entry={selectedEntry}
        onClose={() => {
          setSelectedEntry(undefined);
        }}
      />

      <ChangelogTableContainer>
        <EdsDataGrid
          stickyHeader
          rows={entries}
          columns={columns}
          getRowId={(row) => getEntryKey(row, entries.indexOf(row))}
          onRowClick={(row) => {
            setSelectedEntry(row.original);
          }}
        ></EdsDataGrid>
      </ChangelogTableContainer>
    </>
  );
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

function Content({ full = false }: ChangelogContentProps) {
  const allChanges = useChangelogEntries();
  const [filters, setFilters] = useState<ChangelogFilters>(
    DEFAULT_CHANGELOG_FILTERS,
  );

  if (allChanges.length === 0) {
    return <PageText>No changelog entries yet.</PageText>;
  }

  const changes = full
    ? filterChangelogEntries(allChanges, filters)
    : allChanges.slice(0, RECENT_CHANGE_COUNT);

  return (
    <>
      <PageText>
        {full
          ? `Showing ${changes.length} of ${allChanges.length} changes to this project's settings.`
          : changes.length === 1
            ? "Showing the most recent change to this project's settings."
            : `Showing the ${changes.length} most recent changes to this project's settings.`}
      </PageText>

      {full ? (
        <PageContainerNotWidthConstrained>
          <ChangelogFilterControls filters={filters} onChange={setFilters} />
          {changes.length === 0 ? (
            <PageText>
              No changelog entries match the selected filters.
            </PageText>
          ) : (
            <FullChangelogTable entries={changes} />
          )}
        </PageContainerNotWidthConstrained>
      ) : (
        <>
          <ChangeList>
            {changes.map((entry, index) => (
              <ChangelogEntry
                key={getEntryKey(entry, index)}
                entry={entry}
                showField={false}
              />
            ))}
          </ChangeList>
          {allChanges.length > RECENT_CHANGE_COUNT && (
            <PageText>
              <Typography link as={Link} to="/project/changelog">
                View full changelog
              </Typography>
            </PageText>
          )}
        </>
      )}
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

export function FullChangelog() {
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
        <Content full />
      </Suspense>
    </QueryErrorBoundary>
  );
}
