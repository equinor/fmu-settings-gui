import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { GenericBox, GenericInnerBox } from "#styles/common";
import type { HorizonLineStyle } from "./types";

export const StratigraphicFrameworkContainer = styled(GenericBox)<{
  $maxHeight?: string;
  $disablePointerEvents: boolean;
}>`
  max-height: ${({ $maxHeight }) => $maxHeight};
  pointer-events: ${({ $disablePointerEvents }) => ($disablePointerEvents ? "none" : "auto")};

  display: flex;
  flex-direction: column;
`;

export const StratigraphicFrameworkHeader = styled.div.attrs<{
  $numStratColumns: number;
}>(({ $numStratColumns }) => ({
  style: {
    gridTemplateColumns: `minmax(max-content, 2fr) repeat(${$numStratColumns}, 3fr)`,
  },
}))`
  padding-bottom: ${tokens.spacings.comfortable.small};

  display: grid;
  font-weight: ${tokens.typography.table.cell_header.fontWeight};
  font-size: ${tokens.typography.table.cell_text.fontSize};

  div {
    padding: ${tokens.spacings.comfortable.x_small} ${tokens.spacings.comfortable.small};

    &:nth-child(2) {
      display: flex;
      justify-content: center;
      grid-row: 1;
      grid-column: 2 / -1;
    }

    &:nth-child(3) {
      display: flex;
      justify-content: right;
      grid-row: 1;
      grid-column: 2 / -1;

      position: relative;
      top: -8px;
      height: 16px;
    }
  }
`;

export const StratigraphicFrameworkContent = styled(GenericInnerBox).attrs<{
  $numStratColumns: number;
}>(({ $numStratColumns }) => ({
  style: {
    gridTemplateColumns: `minmax(max-content, 2fr) repeat(${$numStratColumns}, 3fr)`,
  },
}))`
  display: grid;
  overflow: auto;
  padding: ${tokens.spacings.comfortable.medium} ${tokens.spacings.comfortable.small};
`;

export const GridLine = styled.div<{
  $rowStart: number;
  $lineStyle: HorizonLineStyle;
}>`
  grid-row: ${({ $rowStart }) => $rowStart};
  grid-column: 1 / -1;
  align-self: center;

  margin-left: ${tokens.spacings.comfortable.x_small};
  border-bottom: 1px #999999;
  border-bottom-style: ${({ $lineStyle }) => $lineStyle};
`;
