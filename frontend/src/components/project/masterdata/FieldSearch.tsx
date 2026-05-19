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
import { ConfirmCloseDialog } from "#components/common";
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
  const [confirmCloseDialogOpen, setConfirmCloseDialogOpen] = useState(false);

  const { data } = useQuery({
    ...smdaPostFieldOptions({ body: { identifier: searchValue } }),
    enabled: searchValue !== "",
  });

  function handleClose() {
    setSearchValue("");
    setSelectedFields([]);
    setConfirmCloseDialogOpen(false);
    closeDialog();
  }

  function handleCloseRequest() {
    // If there are selected fields, ask for confirmation
    if (selectedFields.length > 0) {
      setConfirmCloseDialogOpen(true);
    } else {
      handleClose();
    }
  }

  // Reset confirm dialog when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmCloseDialogOpen(false);
    }
  }, [isOpen]);

  function handleConfirmCloseDecision(confirm: boolean) {
    if (confirm) {
      handleClose();
    } else {
      setConfirmCloseDialogOpen(false);
    }
  }

  const setStateCallback = (value: string) => {
    setSearchValue(value.trim());
  };

  return (
    <>
      <EditDialog
        open={isOpen}
        isDismissable={true}
        onClose={handleCloseRequest}
        $maxWidth="200em"
      >
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
          <CancelButton onClick={handleCloseRequest} />
        </Dialog.Actions>
      </EditDialog>

      <ConfirmCloseDialog
        isOpen={confirmCloseDialogOpen}
        handleConfirmCloseDecision={handleConfirmCloseDecision}
        title="Discard search results"
        description="You have selected fields that haven't been added to the masterdata yet."
        question="Do you want to discard the selected fields and close the search dialog?"
        confirmLabel="Keep editing"
        cancelLabel="Discard and close"
      />
    </>
  );
}
