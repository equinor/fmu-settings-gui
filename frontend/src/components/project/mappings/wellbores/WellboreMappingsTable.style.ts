import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { dataGridHeader } from "#styles/dataGrid";

export const WellboreMappingsContainer = styled.div`
  width: fit-content;
  max-width: 100%;
  margin-bottom: ${tokens.spacings.comfortable.medium};

  .table-wrapper {
    ${dataGridHeader}
  }

  tbody tr.editable-row {
    cursor: pointer;

    &:not(.planned-row):hover td {
      background: ${tokens.colors.ui.background__light.hex};
    }
  }

  tbody tr.planned-row td {
    background: ${tokens.colors.ui.background__info.hex};
  }
`;

export const MappingEditFields = styled.div`
  display: grid;
  gap: ${tokens.spacings.comfortable.medium};
`;

export const SmdaOptionDivider = styled.hr`
  width: 100%;
  border: none;
  border-top: dashed 1px currentColor;
`;
