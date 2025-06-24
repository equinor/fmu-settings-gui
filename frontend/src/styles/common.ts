import { Typography } from "@equinor/eds-core-react";
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

export const PageSectionSpacer = styled.div`
  height: 1em;
`;
