import { Button } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useState } from "react";

import type { ChangeInfo } from "#client/types.gen";
import { ChangeDetailsDialog } from "./ChangeDetailsDialog";
import {
  ChangelogChangeDescription,
  ChangelogDateTime,
  ChangelogTableContainer,
} from "./Changelog.style";
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
      enableColumnFilter: false,
      cell: ({ row }) => <DateTimeCell timestamp={row.original.timestamp} />,
    },
    {
      accessorKey: "file",
      header: "Settings type",
      size: 170,
      enableColumnFilter: false,
      cell: ({ row }) => FILE_LABELS[row.original.file] ?? row.original.file,
    },
    {
      id: "description",
      header: "Change",
      size: 220,
      enableColumnFilter: false,
      accessorFn: (entry) => formatEntryDescription(entry),
      cell: ({ getValue }) => (
        <ChangelogChangeDescription>
          {getValue<string>()}
        </ChangelogChangeDescription>
      ),
    },
    {
      accessorKey: "user",
      header: "Changed by",
      size: 110,
      enableColumnFilter: true,
    },
    {
      id: "details",
      header: "Details",
      size: 140,
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
          enableVirtual
          height={600}
          rows={entries}
          columns={columns}
          getRowId={(row, index) => getEntryKey(row, index)}
          enableSorting
          enableColumnFiltering
        ></EdsDataGrid>
      </ChangelogTableContainer>
    </>
  );
}
