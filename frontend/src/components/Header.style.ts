import { Button } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const HeaderContainer = styled.div``;

export const FmuLogo = styled.img`
  width: 35px;
  height: auto;
`;

export const TopBarContainer = styled.div`
  display: flex;
  align-items: center;  
`;

export const ProjectInfoContainer = styled.div`
  height: ${tokens.spacings.comfortable.x_large};
  padding: 0.4em ${tokens.spacings.comfortable.medium};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__light.hex};

  display: flex;
  align-items: center;
  gap: ${tokens.spacings.comfortable.large};
`;

export const ProjectInfoItemContainer = styled.div`
  text-align: left;
`;

export const HeaderActionButton = styled(Button).attrs({
  variant: "ghost",
})`
  &:hover {
    background: inherit;
  }
`;

export const TaskBadgeWrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const badgeBase = `
  position: absolute;
  top: -4px;
  right: -6px;
  color: ${tokens.colors.text.static_icons__primary_white.hex};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const TaskBadgeCount = styled.span`
  ${badgeBase}
  min-width: 16px;
  height: 16px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 0 2px;
  background: ${tokens.colors.interactive.warning__resting.hex};
`;

export const TaskBadgeDone = styled.span`
  ${badgeBase}
  width: 14px;
  height: 14px;
  background: ${tokens.colors.interactive.success__resting.hex};
`;

export const TaskIndicatorContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${tokens.spacings.comfortable.medium};
`;
