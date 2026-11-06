import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { PageCode } from "#styles/common";

export const AssetHelp = styled.details`
  contain: inline-size;
  margin-top: ${tokens.spacings.comfortable.small};
  margin-bottom: ${tokens.spacings.comfortable.medium};

  summary {
    cursor: pointer;
    color: ${tokens.colors.interactive.primary__resting.hex};
  }

  &[open] summary {
    margin-bottom: ${tokens.spacings.comfortable.small};
  }
`;

export const AssetRefreshError = styled(PageCode)`
  margin: 0 0 ${tokens.spacings.comfortable.medium};
`;
