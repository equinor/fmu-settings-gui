import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { InfoBox } from "#styles/common";

export const UnmappedElementsBox = styled(InfoBox)`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacings.comfortable.small};
  justify-content: end;

  p {
    align-self: end;
    margin-bottom: ${tokens.spacings.comfortable.x_small};
  }
`;
