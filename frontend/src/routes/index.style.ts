import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const AppContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
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
    padding: ${tokens.spacings.comfortable.large};
  }
`;
