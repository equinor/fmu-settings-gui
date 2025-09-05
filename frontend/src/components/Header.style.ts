import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const HeaderContainer = styled.div``;

export const FmuLogo = styled.img`
  width: 35px;
  height: auto;
`;

export const ProjectInfoContainer = styled.div`
  padding: 0.5em;
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  background: ${tokens.colors.ui.background__light.hex};
  color: ${tokens.colors.text.static_icons__secondary.hex};

  span {
    font-weight: bold;
  }
`;
