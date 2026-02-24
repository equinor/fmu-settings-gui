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
