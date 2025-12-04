import { Banner } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const LockStatusBanner = styled(Banner)`
  margin-bottom: 1em;
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  box-shadow: none;

  /* Adjust elements and ensure clean border corners */
  [class*=Banner__Content],
  [class*=Banner__NonMarginDivider] {
    background: none;
  }

`;
