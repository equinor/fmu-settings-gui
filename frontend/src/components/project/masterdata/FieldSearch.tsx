import { Dialog, Tooltip } from "@equinor/eds-core-react";
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
import type { SmdaFieldReference } from "./types";

function FieldResults({
  data,
  disabledFields,
  setSelectedFields,
}: {
  data?: SmdaFieldSearchResult | undefined;
  disabledFields: ReadonlyMap<string, string>;
  setSelectedFields: Dispatch<SetStateAction<Array<SmdaFieldReference>>>;
}) {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: Changed data needs to reset row selection state
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSelectedRows({});
    });
  }, [data]);

  useEffect(() => {
    const fields = Object.entries(selectedRows).reduce<
      Array<SmdaFieldReference>
    >((acc, [uuid]) => {
      const field = data?.results.find((f) => f.uuid === uuid);
      if (field) {
        acc.push({ identifier: field.identifier, uuid: field.uuid });
      }

      return acc;
    }, []);
    setSelectedFields(fields);
  }, [selectedRows, data?.results, setSelectedFields]);

  const columns: ColumnDef<SmdaFieldUuid>[] = [
    {
      accessorKey: "identifier",
      header: "Field",
    },
    {
      accessorKey: "country",
      header: "Country",
    },
  ];

  if (!data) {
    return;
  }

  if (data.hits === 0) {
    return <PageText>No fields found.</PageText>;
  }

  const rows = data.results.sort(
    (a, b) =>
      stringCompare(a.identifier, b.identifier) ||
      stringCompare(a.country, b.country),
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
          defaultColumn={{
            cell: ({ row, getValue }) => {
              const disabledReason = disabledFields.get(row.id);

              return disabledReason ? (
                <Tooltip title={disabledReason}>
                  <span className="disabled-cell">{String(getValue())}</span>
                </Tooltip>
              ) : (
                String(getValue())
              );
            },
          }}
          getRowId={(row) => row.uuid}
          rowClass={(row) =>
            disabledFields.has(row.id)
              ? "disabled-row"
              : selectedRows[row.id]
                ? "selected-row"
                : ""
          }
          enableRowSelection={(row) => !disabledFields.has(row.id)}
          enableMultiRowSelection
          rowSelectionState={selectedRows}
          onRowSelectionChange={setSelectedRows}
          onRowClick={(row) => {
            if (row.getCanSelect()) {
              row.toggleSelected();
            }
          }}
        ></EdsDataGrid>
      </SearchResultsContainer>
    </>
  );
}

export function FieldSearch({
  title = "Field search",
  isOpen,
  addFields,
  disabledFields,
  closeDialog,
}: {
  title?: string;
  isOpen: boolean;
  addFields: (fields: Array<SmdaFieldReference>) => void;
  disabledFields: ReadonlyMap<string, string>;
  closeDialog: () => void;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFields, setSelectedFields] = useState<
    Array<SmdaFieldReference>
  >([]);

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
    <EditDialog
      open={isOpen}
      isDismissable={true}
      onClose={handleClose}
      $maxWidth="200em"
    >
      <Dialog.Header>{title}</Dialog.Header>

      <Dialog.CustomContent>
        <SearchFormContainer>
          <SearchFieldForm
            name="identifier"
            value={searchValue}
            helperText="Tip: Use * as a wildcard for finding fields that start with the name. Example: OSEBERG*"
            setStateCallback={setStateCallback}
          />
        </SearchFormContainer>

        <FieldResults
          data={data}
          disabledFields={disabledFields}
          setSelectedFields={setSelectedFields}
        />
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
