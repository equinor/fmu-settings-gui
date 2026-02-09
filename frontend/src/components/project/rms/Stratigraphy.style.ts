import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { WarningBox } from "#styles/common";

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

  button + button {
    margin-left: ${tokens.spacings.comfortable.small} !important;
  }
`;

export const OrphanTypesContainer = styled(WarningBox)`
  margin-top: ${tokens.spacings.comfortable.medium};
`;
