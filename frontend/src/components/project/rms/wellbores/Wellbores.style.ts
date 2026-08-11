import { Search } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const WellboresContainer = styled.div`
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

    tbody tr.planned-row td {
      background: ${tokens.colors.ui.background__info.hex};
    }
  }
`;

export const WellboreFilterContainer = styled.div`
  width: 20rem;
  max-width: 100%;
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;

export const WellboreSearch = styled(Search)`
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;
