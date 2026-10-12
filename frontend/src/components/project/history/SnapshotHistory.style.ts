import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { GenericBox, InfoBox } from "#styles/common";

export const MaxSnapshotsControls = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${tokens.spacings.comfortable.small};
`;

export const SnapshotInfo = styled.div`
  > div + div {
    margin-top: ${tokens.spacings.comfortable.small};
  }
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

export const ScrollableCardStack = styled(CardStack)`
  max-height: 26.5em;
  overflow-y: auto;
  padding-right: ${tokens.spacings.comfortable.small};
`;

export const SelectorRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${tokens.spacings.comfortable.medium};
  flex-wrap: wrap;
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;
