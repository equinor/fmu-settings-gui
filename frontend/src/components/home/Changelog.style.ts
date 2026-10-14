import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ChangeType } from "#client/types.gen";
import { changeTypeColor } from "../project/changelog/Changelog.style";

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
