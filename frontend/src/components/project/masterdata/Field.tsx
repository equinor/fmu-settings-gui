import {
  ColumnDef,
  EdsDataGrid,
  RowSelectionState,
} from "@equinor/eds-data-grid-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SmdaFieldSearchResult, SmdaFieldUuid } from "#client";
import { smdaPostFieldOptions } from "#client/@tanstack/react-query.gen";
import { SearchFieldForm } from "#components/form";
import { PageHeader, PageSectionSpacer, PageText } from "#styles/common";
import { stringCompare } from "#utils/string";
import { SearchFormContainer, SearchResultsContainer } from "./Field.style";

function FieldResults({ data }: { data?: SmdaFieldSearchResult }) {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: Changed data needs to reset row selection state
  useEffect(() => {
    setSelectedRows({});
  }, [data]);

  const columns: ColumnDef<SmdaFieldUuid>[] = [
    {
      accessorKey: "identifier",
      header: "Field",
    },
  ];

  if (!data) {
    return;
  }

  if (data.hits === 0) {
    return <PageText>No fields found.</PageText>;
  }

  const rows = data.results.sort((a, b) =>
    stringCompare(a.identifier, b.identifier),
  );

  return (
    <>
      <PageText>
        Found {data.hits} {data.hits === 1 ? "field" : "fields"}.
        {data.hits > 100 && " Displaying only first 100 fields."}
      </PageText>

      <PageSectionSpacer />

      <SearchResultsContainer>
        <EdsDataGrid
          stickyHeader
          rows={rows}
          columns={columns}
          getRowId={(row) => row.uuid}
          rowClass={(row) => (selectedRows[row.id] ? "selected-row" : "")}
          enableRowSelection
          enableMultiRowSelection
          rowSelectionState={selectedRows}
          onRowSelectionChange={setSelectedRows}
          onRowClick={(row) => {
            row.toggleSelected();
          }}
        ></EdsDataGrid>
      </SearchResultsContainer>
    </>
  );
}

export function Field() {
  const [searchValue, setSearchValue] = useState("");
  const { data } = useQuery({
    ...smdaPostFieldOptions({ body: { identifier: searchValue } }),
    enabled: searchValue !== "",
  });

  const setStateCallback = (value: string) => {
    setSearchValue(value.trim());
  };

  return (
    <>
      <PageHeader $variant="h3">Field search</PageHeader>

      <SearchFormContainer>
        <SearchFieldForm
          name="identifier"
          value={searchValue}
          helperText="Tip: Use * as a wildcard for finding fields that start with the name. Example: OSEBERG*"
          setStateCallback={setStateCallback}
        />
      </SearchFormContainer>

      <FieldResults data={data} />
    </>
  );
}
