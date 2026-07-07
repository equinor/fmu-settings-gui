import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const NestedAccordion = styled.div`
  & > div {
    border-bottom: none;
  }

  [role="region"] {
    border-bottom: none;
  }

  [role="region"] a {
    padding-left: ${tokens.spacings.comfortable.medium};
  }
`;
