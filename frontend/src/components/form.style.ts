import { Search } from "@equinor/eds-core-react";
import styled from "styled-components";

export const EditableTextFieldFormContainer = styled.div`
  form > div {
    margin-bottom: 1em;
  }

  button + button {
    margin-left: 8px;
  }
`;

export const SearchFieldFormContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const SearchFieldInput = styled(Search)`
  width: 100%;
`;
