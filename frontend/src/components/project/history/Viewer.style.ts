import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { GenericBox, GenericInnerBox, InfoBox } from "#styles/common";

export type DiffKind = "added" | "removed" | "updated";

const diffPalette: Record<DiffKind, { background: string; color: string }> = {
  added: {
    background: tokens.colors.interactive.success__highlight.hex,
    color: tokens.colors.interactive.success__resting.hex,
  },
  removed: {
    background: tokens.colors.ui.background__danger.hex,
    color: tokens.colors.interactive.danger__resting.hex,
  },
  updated: {
    background: tokens.colors.ui.background__info.hex,
    color: tokens.colors.interactive.primary__resting.hex,
  },
};

export const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacings.comfortable.medium};
`;

export const CacheInfoBox = styled(InfoBox)<{
  $selected: boolean;
  $isAutoBackup?: boolean;
}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${tokens.spacings.comfortable.small};
  flex-wrap: wrap;
  margin-bottom: 0;
  border-left: 0.25rem solid
    ${({ $selected, $isAutoBackup }) =>
      $selected || $isAutoBackup
        ? tokens.colors.interactive.primary__resting.hex
        : tokens.colors.ui.background__medium.hex};
  ${({ $isAutoBackup }) =>
    $isAutoBackup && `background: ${tokens.colors.ui.background__info.hex};`}
`;

export const DiffLegend = styled(GenericBox)`
  background: ${tokens.colors.ui.background__info.hex};
  margin-bottom: 0;

  ul {
    padding-right: 40px;
  }
`;

export const DiffDialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacings.comfortable.small};
  max-height: 70vh;
  overflow: auto;
`;

export const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacings.comfortable.small};
`;

export const DiffFieldHeader = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.small};
`;

export const DiffGroup = styled.div<{ $kind: DiffKind }>`
  border: 1px solid ${({ $kind }) => diffPalette[$kind].color};
  background: ${({ $kind }) => diffPalette[$kind].background};
  border-radius: ${tokens.shape.corners.borderRadius};
  padding: ${tokens.spacings.comfortable.small};
`;

export const ChangeValueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${tokens.spacings.comfortable.small};

  @media (max-width: 48em) {
    grid-template-columns: 1fr;
  }
`;

export const ValuePanel = styled(GenericInnerBox)`
  th {
    text-align: left;
    vertical-align: top;
    padding-right: ${tokens.spacings.comfortable.small};
    white-space: nowrap;
  }

  td {
    vertical-align: top;
    word-break: break-word;
  }

  p {
    margin-top: 0;
  }
`;
