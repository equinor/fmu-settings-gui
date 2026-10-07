import { Button } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useState } from "react";

import type { ChangeInfo } from "#client/types.gen";
import { ChangelogDateTime, ChangelogTableContainer } from "./Changelog.style";
import { ChangelogDetailsDialog } from "./ChangelogDetailsDialog";
import { FILE_LABELS, formatEntryDescription, getEntryKey } from "./utils";

function DateTimeCell({ timestamp }: { timestamp: string | null | undefined }) {
  const parsedTimestamp = Date.parse(timestamp ?? "");
  if (!parsedTimestamp) {
    return "(unknown date)";
  }

  const dateTime = new Date(parsedTimestamp);

  return (
    <ChangelogDateTime>
      <span>
        {dateTime.toLocaleDateString(undefined, { dateStyle: "medium" })}
      </span>
      <span>
        {dateTime.toLocaleTimeString(undefined, { timeStyle: "medium" })}
      </span>
    </ChangelogDateTime>
  );
}

export function ChangelogTable({ entries }: { entries: ChangeInfo[] }) {
  const [selectedEntry, setSelectedEntry] = useState<ChangeInfo | undefined>();
  const columns: ColumnDef<ChangeInfo>[] = [
    {
      accessorKey: "timestamp",
      header: "Date",
      size: 200,
      cell: ({ row }) => <DateTimeCell timestamp={row.original.timestamp} />,
    },
    {
      accessorKey: "file",
      header: "Settings type",
      cell: ({ row }) => FILE_LABELS[row.original.file] ?? row.original.file,
    },
    {
      id: "description",
      header: "Change",
      accessorFn: (entry) => formatEntryDescription(entry),
      cell: ({ getValue }) => getValue(),
    },
    {
      accessorKey: "user",
      header: "Changed by",
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
      <ChangelogDetailsDialog
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
        ></EdsDataGrid>
      </ChangelogTableContainer>
    </>
  );
}
