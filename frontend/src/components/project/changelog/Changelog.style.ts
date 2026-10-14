import { Chip } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ChangeType } from "#client/types.gen";
import { GenericBox } from "#styles/common";
import { dataGridHeader } from "#styles/dataGrid";

export function changeTypeColor(changeType: ChangeType) {
  switch (changeType) {
    case "add":
    case "copy":
      return tokens.colors.interactive.success__resting.hex;
    case "remove":
      return tokens.colors.interactive.danger__resting.hex;
    case "reset":
      return tokens.colors.interactive.warning__resting.hex;
    default:
      return tokens.colors.interactive.primary__resting.hex;
  }
}

export const ChangelogTableContainer = styled.div`
  .table-wrapper {
    ${dataGridHeader}
  }

  table {
    width: 100% !important;
  }

  .table-header-cell-label,
  tbody td:last-child button {
    white-space: nowrap;
  }

  thead th [class*="FilterVisibility"] {
    opacity: 1 !important;
  }
`;

export const ChangelogDateTime = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  column-gap: ${tokens.spacings.comfortable.x_small};

  span {
    white-space: nowrap;
  }
`;

export const ChangelogFilterBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${tokens.spacings.comfortable.small};
  flex-wrap: wrap;
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;

export const ChangelogFilterField = styled.div`
  min-width: 12em;
`;

export const ChangeTypeChip = styled(Chip)<{ $changeType: ChangeType }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ $changeType }) => changeTypeColor($changeType)};
  background: ${tokens.colors.ui.background__light.hex};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
`;

export const ChangeDetails = styled(GenericBox)`
  margin-bottom: 0;
  background: ${tokens.colors.ui.background__default.hex};
`;

export const ChangeDetailsDialogContent = styled.div`
  max-height: 70vh;
  overflow-y: auto;
`;

export const ChangeDetailsHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacings.comfortable.small};

  ${ChangeDetails} & {
    margin-bottom: ${tokens.spacings.comfortable.small};
  }
`;
