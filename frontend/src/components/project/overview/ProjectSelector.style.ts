import { Dialog } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ExpansiveDialog = styled(Dialog)`
  width: 100%;
  
  button + button {
    margin-left: ${tokens.spacings.comfortable.small};
  }
`;

export const ProjectSelectorContentContainer = styled.div`
  margin-top: ${tokens.spacings.comfortable.medium};
  min-width: 40em;
`;
