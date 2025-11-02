import { Card } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const AppContainer = styled.div`
  display: grid;
  grid-template-columns: min-content auto;
  grid-template-rows: min-content auto;
  grid-template-areas: 
    "header header"
    "sidebar content";
  height: 100vh;

  .header {
    grid-area: header;
  }

  .sidebar {
    grid-area: sidebar;
    overflow: scroll;
  }

  .content {
    grid-area: content;
    overflow: scroll;
    max-width: 55em;
    padding: 24px;
  }
`;

export const StyledContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: ${tokens.spacings.comfortable.medium};
`;

export const CardContainer = styled(Card)`
  width: 250px; 
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  background: ${tokens.colors.ui.background__light.hex};  
`;

export const SumoLogo = styled.img`
  width: 35px;
  height: auto;
`;

export const WebvizLogo = styled.img`
  width: 35px;
  height: auto;
`;

export const ErtLogo = styled.img`
  width: 35px;
  height: auto;
`;
