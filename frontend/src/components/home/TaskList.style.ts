import { Typography } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacings.comfortable.small};
  padding: ${tokens.spacings.comfortable.x_small} 0;
`;

export const TaskCompletedLabel = styled(Typography)`
  color: ${tokens.colors.text.static_icons__tertiary.hex};
  text-decoration: line-through;
`;

export const TasksProgressLabel = styled(Typography)<{
  $allDone: boolean;
  $marginBottom?: string;
}>`
  margin-bottom: ${({ $marginBottom }) => $marginBottom};
  color: ${({ $allDone }) =>
    $allDone
      ? tokens.colors.interactive.success__resting.hex
      : tokens.colors.interactive.warning__resting.hex};
  font-weight: 500;
`;
