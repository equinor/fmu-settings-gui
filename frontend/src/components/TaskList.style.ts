import { Typography } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const TaskListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${tokens.spacings.comfortable.small};
`;

export const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacings.comfortable.small};
  padding: ${tokens.spacings.comfortable.x_small} 0;
`;

export const TaskLabel = styled(Typography)`
  color: ${tokens.colors.text.static_icons__tertiary.hex};
  text-decoration: line-through;
`;

export const TaskProgressLabel = styled(Typography)<{ $allDone: boolean }>`
  color: ${({ $allDone }) =>
    $allDone
      ? tokens.colors.interactive.success__resting.hex
      : tokens.colors.interactive.warning__resting.hex};
  font-weight: 500;
  margin-bottom: ${tokens.spacings.comfortable.small};
`;
