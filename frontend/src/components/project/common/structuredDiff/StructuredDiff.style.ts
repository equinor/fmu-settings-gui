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

export const DiffMultilineValue = styled.p`
  white-space: pre-wrap;
`;

export const DiffSpecialValue = styled.p`
  color: ${tokens.colors.text.static_icons__tertiary.hex};
  font-style: italic;
`;

export const DiffValueHeader = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.small};
  padding-bottom: ${tokens.spacings.comfortable.x_small};
  border-bottom: 1px solid ${tokens.colors.ui.background__medium.hex};
  font-weight: 700;
`;

export const DiffValuePanel = styled(GenericInnerBox)`
  th {
    padding-right: ${tokens.spacings.comfortable.small};
    vertical-align: top;
    text-align: left;
    white-space: nowrap;
  }

  th::after {
    content: ":";
  }

  td {
    vertical-align: top;
    word-break: break-word;
  }

  p {
    margin-top: 0;
  }

  td > p {
    margin: 0;
  }
`;
