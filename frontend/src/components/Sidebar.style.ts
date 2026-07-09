import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const NestedAccordion = styled.div`
  /* Remove EDS accordion borders so nested groups read as one sidebar section. */
  & > div {
    border-bottom: none;
  }

  [role="region"] {
    border-bottom: none;
  }

  /* Indent nested links to keep child pages visually grouped under the parent. */
  [role="region"] a {
    padding-left: ${tokens.spacings.comfortable.medium};
  }
`;
