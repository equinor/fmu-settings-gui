import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: "Equinor", sans-serif;
  }

  /* Fixes to EDS components */
  div[class^=NativeSelect__Container] {
    padding-right: 12px;
  }

  .Toastify__toast {
    overflow-y: auto;
  }
`;

export default GlobalStyle;
