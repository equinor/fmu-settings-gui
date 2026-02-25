import {
  Chip,
  Dialog,
  Banner as EdsBanner,
  List,
  Typography,
} from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const PageHeader = styled(Typography).attrs<{
  $variant?: string;
  $marginBottom?: string;
}>(({ $variant = "h2" }) => ({ variant: $variant }))`
  margin-bottom: ${({ $marginBottom = tokens.spacings.comfortable.small }) => $marginBottom};
`;

export const PageText = styled(Typography).attrs<{
  $variant?: string;
  $marginBottom?: string;
}>(({ $variant = "body_short" }) => ({ variant: $variant }))`
  margin-bottom: ${({ $marginBottom = tokens.spacings.comfortable.medium }) => $marginBottom};

  .emphasis {
    font-weight: 500;
  }
`;

export const PageCode = styled(Typography)`
  margin: ${tokens.spacings.comfortable.medium};
  margin-top: 0;
  padding: ${tokens.spacings.comfortable.medium};
  border: solid 1px ${tokens.colors.text.static_icons__default.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__light.hex};
`;

export const PageSectionSpacer = styled.div`
  height: ${tokens.spacings.comfortable.x_large}
`;

export const PageList = styled(List)`
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;

export const GenericBox = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.medium};
  padding: ${tokens.spacings.comfortable.small};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__light.hex};
  color: ${tokens.colors.text.static_icons__secondary.hex};
`;

export const GenericInnerBox = styled(GenericBox)`
  margin-bottom: 0;
  background: ${tokens.colors.ui.background__default.hex};
`;

export const InfoBox = styled(GenericBox)`
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

  .missingValue {
    color: ${tokens.colors.text.static_icons__tertiary.hex};
    font-style: italic;
  }

  .multilineValue {
    white-space: pre-line;
  }
`;

export const WarningBox = styled(GenericBox)`
  background: ${tokens.colors.ui.background__warning.hex};
`;

export const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacings.comfortable.small}
`;

export const InfoChip = styled(Chip)`
  padding-left: ${tokens.spacings.comfortable.small};
  background-color: ${tokens.colors.ui.background__medium.hex};

  &, svg {
    color: ${tokens.colors.text.static_icons__default.hex};
    fill: ${tokens.colors.text.static_icons__default.hex};
  }
`;

export const GenericDialog = styled(Dialog).attrs<{
  $minWidth?: string;
  $maxWidth?: string;
}>(({ $minWidth = "10em", $maxWidth = undefined }) => ({
  style: {
    minWidth: $minWidth,
    maxWidth: $maxWidth,
  },
}))`
  width: 100%;

  #eds-dialog-customcontent {
    min-height: auto;
    padding: ${tokens.spacings.comfortable.medium};
  }

  button + button {
    margin-left: ${tokens.spacings.comfortable.small};
  }
`;

export const EditDialog = styled(GenericDialog)`
  #eds-dialog-customcontent {
    padding-bottom: ${tokens.spacings.comfortable.x_large};
  }
`;

export const Banner = styled(EdsBanner).attrs<{
  $marginBottom?: string;
}>((props) => ({
  style: {
    marginBottom: props.$marginBottom ?? tokens.spacings.comfortable.medium,
  },
}))`
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  box-shadow: none;
  /* Adjust elements and ensure clean border corners */
  [class*=Banner__Content],
  [class*=Banner__NonMarginDivider] {
    background: none;
  }
`;
