import { Button } from "@equinor/eds-core-react";
import { type ColumnDef, EdsDataGrid } from "@equinor/eds-data-grid-react";
import { useState } from "react";

import type { ChangeInfo } from "#client/types.gen";
import { displayDateTime } from "#utils/datetime";
import { ChangelogTableContainer } from "./Changelog.style";
import { ChangelogDetailsDialog } from "./ChangelogDetailsDialog";
import {
  FILE_LABELS,
  formatChangedField,
  formatEntryDescription,
  getTypeLabel,
} from "./utils";

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
          onRowClick={(row) => {
            setSelectedEntry(row.original);
          }}
        ></EdsDataGrid>
      </ChangelogTableContainer>
    </>
  );
}
