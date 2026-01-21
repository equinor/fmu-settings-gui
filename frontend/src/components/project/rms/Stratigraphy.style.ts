import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const StratigraphyEditorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${tokens.spacings.comfortable.xx_large};

  > div {
    overflow: auto;
  }

  h4 {
    text-decoration: underline;
  }
`;

export const ActionButtonsContainer = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.medium};
 
  display: flex;
  justify-content: right;
  
  button + button {
    margin-left: ${tokens.spacings.comfortable.small} !important;
  }
`;
