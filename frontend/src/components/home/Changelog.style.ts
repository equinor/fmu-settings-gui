import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ChangeType } from "./types.ts";

function changeTypeColor(changeType: ChangeType) {
  switch (changeType) {
    case "add":
    case "copy":
      return tokens.colors.interactive.success__resting.hex;
    case "remove":
      return tokens.colors.interactive.danger__resting.hex;
    case "reset":
      return tokens.colors.interactive.warning__resting.hex;
    default:
      return tokens.colors.interactive.primary__resting.hex;
  }
}

export const ChangeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacings.comfortable.small};
`;

export const ChangeItem = styled.article<{ $changeType: ChangeType }>`
  padding: ${tokens.spacings.comfortable.small} ${tokens.spacings.comfortable.medium};
  border-left: 3px solid ${({ $changeType }) => changeTypeColor($changeType)};
  background: ${tokens.colors.ui.background__light.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
`;
