import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ActionButtonsContainer = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.medium};

  button + button {
    margin-left: ${tokens.spacings.comfortable.small};
  }
`;
