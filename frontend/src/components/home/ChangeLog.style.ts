import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

type ChangeType = "add" | "copy" | "merge" | "remove" | "reset" | "update";

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
  border-left: 4px solid ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__default.hex};
`;

export const ChangeItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacings.comfortable.x_small};
  margin-bottom: ${tokens.spacings.comfortable.x_small};
`;

export const ChangeTypeDot = styled.span<{ $changeType: ChangeType }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ $changeType }) => changeTypeColor($changeType)};
`;

export const ChangeTypeBadge = styled.span<{ $changeType: ChangeType }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  padding: ${tokens.spacings.comfortable.x_small};
  border-radius: ${tokens.shape.corners.borderRadius};
  color: ${({ $changeType }) => changeTypeColor($changeType)};
  background: ${tokens.colors.ui.background__light.hex};
`;

export const ChangeDescription = styled.p`
  margin: 0;
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
