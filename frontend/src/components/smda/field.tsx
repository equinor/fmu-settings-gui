import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { smdaPostFieldOptions } from "../../client/@tanstack/react-query.gen";
import { PageHeader } from "../../styles/common";
import { SearchTextFieldForm } from "../form";
import { SearchFormContainer } from "./field.style";

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
        <SearchTextFieldForm
          name="identifier"
          label="Field"
          value={searchValue}
          setStateCallback={setStateCallback}
        />
      </SearchFormContainer>
    </>
  );
}
