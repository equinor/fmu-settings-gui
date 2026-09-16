import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { dataGridHeader } from "#styles/dataGrid";

export const WellboresContainer = styled.div`
  width: fit-content;
  max-width: 100%;
  margin-bottom: ${tokens.spacings.comfortable.medium};

  .table-wrapper {
    ${dataGridHeader}

    tbody tr.planned-row td {
      background: ${tokens.colors.ui.background__info.hex};
    }
  }
`;
