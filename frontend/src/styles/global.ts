import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: "Equinor", sans-serif;
  }

  .Toastify__toast {
    overflow-y: auto;
  }
`;

export default GlobalStyle;
