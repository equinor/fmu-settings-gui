import { Chip } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ChangeType } from "./types";

function changeTypeColor(changeType: ChangeType) {
  if (changeType === "add" || changeType === "copy") {
    return tokens.colors.interactive.success__resting.hex;
  }

  if (changeType === "remove") {
    return tokens.colors.interactive.danger__resting.hex;
  }

  if (changeType === "reset") {
    return tokens.colors.interactive.warning__resting.hex;
  }

  return tokens.colors.interactive.primary__resting.hex;
}

export const ChangeList = styled.div`
  margin-top: ${tokens.spacings.comfortable.small};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacings.comfortable.small};
`;

export const ChangeItem = styled.article`
  padding: ${tokens.spacings.comfortable.small};
  border: 1px solid ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
`;

export const ChangeItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${tokens.spacings.comfortable.x_small};
  font-size: 0.875rem;
`;

export const ChangeTypeChip = styled(Chip)<{ $changeType: ChangeType }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ $changeType }) => changeTypeColor($changeType)};
  background: ${tokens.colors.ui.background__light.hex};
  border: 0;
`;

export const ChangeDescription = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: ${tokens.colors.text.static_icons__default.hex};
`;
export const ChangeItemMeta = styled.div`
  margin-top: ${tokens.spacings.comfortable.x_small};
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacings.comfortable.small};
  color: ${tokens.colors.text.static_icons__secondary.hex};
  font-size: 0.875rem;
`;
