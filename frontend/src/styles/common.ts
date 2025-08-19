import { Typography } from "@equinor/eds-core-react";
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
  height: 1em;
`;
