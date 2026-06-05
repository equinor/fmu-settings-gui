import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: "Equinor", sans-serif;
  }

  /* Fixes to EDS components */

  /* Adjust elements and ensure clean border corners */
  div[class^=Banner__Content-],
  hr[class*=Banner__NonMarginDivider-] {
    background: none;
  }

  /* Prevent right clipping of value when options list not open */
  div[class^=NativeSelect__Container-] {
    padding-right: 12px;
  }

  .Toastify__toast {
    overflow-y: auto;
  }
`;

export default GlobalStyle;
