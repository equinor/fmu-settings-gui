import { Button, Table } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SmdaFieldSearchResult } from "../../client";
import { smdaPostFieldOptions } from "../../client/@tanstack/react-query.gen";
import { PageHeader, PageSectionSpacer, PageText } from "../../styles/common";
import { SearchFieldForm } from "../form";
import { SearchFormContainer, SearchResultsContainer } from "./field.style";

function FieldResults({ data }: { data?: SmdaFieldSearchResult }) {
  if (!data) {
    return;
  }

  if (data.hits === 0) {
    return <PageText>No fields found.</PageText>;
  }

  return (
    <>
      <PageText>
        Found {data.hits} {data.hits === 1 ? "field" : "fields"}.
        {data.hits > 100 && " Displaying only first 100 fields."}
      </PageText>

      <PageSectionSpacer />

      <SearchResultsContainer>
        <Table>
          <Table.Head sticky>
            <Table.Row>
              <Table.Cell>Field</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {data.results
              .sort((a, b) => a.identifier.localeCompare(b.identifier, "no"))
              .map((field) => (
                <Table.Row key={field.uuid}>
                  <Table.Cell>{field.identifier}</Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
          <Table.Foot sticky>
            <Table.Row>
              <Table.Cell>
                <Button>Display for selected</Button>
              </Table.Cell>
            </Table.Row>
          </Table.Foot>
        </Table>
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
  console.log("//// search data =", data);

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
          setStateCallback={setStateCallback}
        />
      </SearchFormContainer>

      <FieldResults data={data} />
    </>
  );
}
