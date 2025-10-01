import { Chip, Dialog, List, Typography } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const PageHeader = styled(Typography).attrs<{ $variant?: string }>(
  (props) => ({ variant: props.$variant ?? "h2" }),
)`
  margin-bottom: 0.5em;
`;

export const PageText = styled(Typography).attrs<{ $variant?: string }>(
  (props) => ({ variant: props.$variant ?? "body_short" }),
)`
  margin-bottom: 1em;
`;

export const PageCode = styled(Typography)`
  margin: 0 1em 1em 1em;
  padding: 1em;
  border: solid 1px ${tokens.colors.text.static_icons__default.hex};
  background: ${tokens.colors.ui.background__light.hex};
`;

export const PageSectionSpacer = styled.div`
  height: ${tokens.spacings.comfortable.x_large}
`;

export const PageList = styled(List)`
  margin-bottom: 1em;
`;

export const InfoBox = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.medium};
  padding: ${tokens.spacings.comfortable.small};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__light.hex};
  color: ${tokens.colors.text.static_icons__secondary.hex};

  th {
    padding-right: ${tokens.spacings.comfortable.small};
    vertical-align: top;
    text-align: left;
    white-space: nowrap;
  }

  th::after {
    content: ":";
  }

  td {
    vertical-align: top;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: ${tokens.spacings.comfortable.small};
  }
`;

export const InfoChip = styled(Chip)`
  background-color: ${tokens.colors.ui.background__medium.hex};

  &, svg {
    color: ${tokens.colors.text.static_icons__default.hex};
    fill: ${tokens.colors.text.static_icons__default.hex};
  }
`;

export const EditDialog = styled(Dialog).attrs<{ $minWidth?: string }>(
  (props) => ({ style: { minWidth: props.$minWidth ?? "10em" } }),
)`
  width: 100%;
  
  #eds-dialog-customcontent {
    padding: ${tokens.spacings.comfortable.medium};
    padding-bottom: ${tokens.spacings.comfortable.x_large};
  }

  button + button {
    margin-left: ${tokens.spacings.comfortable.small};
  }
`;
