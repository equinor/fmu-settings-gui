import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const SearchFormContainer = styled.div`
  width: 24em;
`;

export const SearchResultsContainer = styled.div`
  width: 24em;
  height: 400px;
  overflow: auto;

  .table-wrapper {
    height: 100%;
  }

  table {
    width: 100% !important;

    .selected-row {
      background-color: ${tokens.colors.interactive.table__cell__fill_activated.hex};
    }
  }
`;
