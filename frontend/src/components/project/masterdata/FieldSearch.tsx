import { Dialog } from "@equinor/eds-core-react";
import {
  type ColumnDef,
  EdsDataGrid,
  type RowSelectionState,
} from "@equinor/eds-data-grid-react";
import { useQuery } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import type { SmdaFieldSearchResult, SmdaFieldUuid } from "#client";
import { smdaPostFieldOptions } from "#client/@tanstack/react-query.gen";
import { CancelButton, GeneralButton } from "#components/form/button";
import { SearchFieldForm } from "#components/form/form";
import { EditDialog, PageSectionSpacer, PageText } from "#styles/common";
import { stringCompare } from "#utils/string";
import {
  SearchFormContainer,
  SearchResultsContainer,
} from "./FieldSearch.style";

function FieldResults({
  data,
  setSelectedFields,
}: {
  data?: SmdaFieldSearchResult;
  setSelectedFields: Dispatch<SetStateAction<Array<string>>>;
}) {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: Changed data needs to reset row selection state
  useEffect(() => {
    setSelectedRows({});
  }, [data]);

  useEffect(() => {
    const fieldNames = Object.entries(selectedRows).reduce<Array<string>>(
      (acc, [uuid]) => {
        const field = data?.results.find((f) => f.uuid === uuid);
        if (field && !acc.includes(field.identifier)) {
          acc.push(field.identifier);
        }

        return acc;
      },
      [],
    );
    setSelectedFields(fieldNames);
  }, [selectedRows, data?.results, setSelectedFields]);

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
      <PageSectionSpacer />

      <PageText>
        Found {data.hits} {data.hits === 1 ? "field" : "fields"}.
        {data.hits > 100 && " Displaying only first 100 fields."}
      </PageText>

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

export function FieldSearch({
  isOpen,
  addFields,
  closeDialog,
}: {
  isOpen: boolean;
  addFields: (fields: Array<string>) => void;
  closeDialog: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFields, setSelectedFields] = useState<Array<string>>([]);

  const { data } = useQuery({
    ...smdaPostFieldOptions({ body: { identifier: searchValue } }),
    enabled: searchValue !== "",
  });

  function handleClose() {
    setSearchValue("");
    closeDialog();
  }

  const setStateCallback = (value: string) => {
    setSearchValue(value.trim());
  };

  return (
    <EditDialog open={isOpen} $maxWidth="200em">
      <Dialog.Header>Field search</Dialog.Header>

      <Dialog.CustomContent>
        <SearchFormContainer>
          <SearchFieldForm
            name="identifier"
            value={searchValue}
            helperText="Tip: Use * as a wildcard for finding fields that start with the name. Example: OSEBERG*"
            setStateCallback={setStateCallback}
          />
        </SearchFormContainer>

        <FieldResults data={data} setSelectedFields={setSelectedFields} />
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label="Add fields"
          disabled={selectedFields.length === 0}
          onClick={() => {
            addFields(selectedFields);
            handleClose();
          }}
        />
        <CancelButton onClick={handleClose} />
      </Dialog.Actions>
    </EditDialog>
  );
}
