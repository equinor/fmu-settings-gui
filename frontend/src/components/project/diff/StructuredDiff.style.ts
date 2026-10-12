import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { GenericInnerBox } from "#styles/common";
import type { DiffKind } from "./utils";

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

export const DiffStack = styled.div`
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

export const DiffValueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${tokens.spacings.comfortable.small};

  @media (max-width: 48em) {
    grid-template-columns: 1fr;
  }
`;

export const DiffValuePanel = styled(GenericInnerBox)`
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
