import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const EditableTextFieldFormContainer = styled.div`
  form > div {
    margin-bottom: ${tokens.spacings.comfortable.medium};
  }

  button + button {
    margin-left: ${tokens.spacings.comfortable.small};
  }
`;

export const SearchFieldFormContainer = styled.div`
  display: flex;
  gap: ${tokens.spacings.comfortable.small}
`;
