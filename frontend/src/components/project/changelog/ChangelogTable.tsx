import { Button } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useState } from "react";

import type { ChangeInfo } from "#client/types.gen";
import { displayDateTime } from "#utils/datetime";
import { ChangelogTableContainer } from "./Changelog.style";
import { ChangelogDetailsDialog } from "./ChangelogDetailsDialog";
import { FILE_LABELS, formatEntryDescription } from "./utils";

function getEntryKey(entry: ChangeInfo, index: number) {
  return [
    entry.timestamp ?? "no-time",
    entry.user,
    entry.file,
    entry.key || "no-field",
    entry.change_type,
    index,
  ].join(":");
}

export function ChangelogTable({ entries }: { entries: ChangeInfo[] }) {
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
      id: "description",
      header: "Change",
      accessorFn: (entry) => formatEntryDescription(entry),
    },
    {
      accessorKey: "file",
      header: "Settings type",
      cell: ({ row }) => FILE_LABELS[row.original.file] ?? row.original.file,
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
