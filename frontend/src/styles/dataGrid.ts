import { Search } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled, { css } from "styled-components";

/** Row height used by the EdsDataGrid virtualizer. */
export const DATA_GRID_ROW_HEIGHT = 48;

/** Height that fits the given number of rows plus the header, up to a maximum. */
export function dataGridHeight(rowCount: number, maxHeight: number) {
  const bodyRowCount = Math.max(rowCount, 1);

  return Math.min((bodyRowCount + 1) * DATA_GRID_ROW_HEIGHT, maxHeight);
}

/**
 * Header rules shared by the EdsDataGrid tables.
 *
 * Apply inside a `.table-wrapper` rule.
 */
export const dataGridHeader = css`
  /* EDS's Firefox table workaround makes interactive DataGrid headers taller
     than the row height used by the virtualizer. */
  thead th {
    height: ${DATA_GRID_ROW_HEIGHT}px !important;
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

`;

export const DataGridFilterContainer = styled.div`
  width: 20rem;
  max-width: 100%;
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;

export const DataGridSearch = styled(Search)`
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;
