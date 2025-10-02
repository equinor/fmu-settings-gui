import { InputWrapper, Search } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const CommonInputWrapper = styled(InputWrapper)`

  .errorText {
    color: ${tokens.colors.interactive.danger__text.hex};
  }
`;

export const SearchFieldInput = styled(Search)`
  width: 100%;
`;
