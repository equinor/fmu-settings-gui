import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const WellsContainer = styled.div`
  width: fit-content;
  max-width: 100%;
  margin-bottom: ${tokens.spacings.comfortable.medium};

  .table-wrapper {
    /* EDS's Firefox table workaround makes interactive DataGrid headers taller
       than the 48px row height used by the virtualizer. */
    thead th {
      height: 48px !important;
      vertical-align: middle !important;
    }

    thead th [class*="CellInner"] {
      height: 100% !important;
      padding-block: 0 !important;
      gap: ${tokens.spacings.comfortable.small};
    }

    thead th [class*="SortButton"] {
      width: auto !important;
    }

    thead th.persistent-filter [class*="FilterVisibility"] {
      opacity: 1 !important;
    }
  }
`;
