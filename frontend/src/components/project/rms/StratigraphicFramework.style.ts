import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { GenericBox, GenericInnerBox } from "#styles/common";

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
  display: grid;
  font-weight: ${tokens.typography.table.cell_header.fontWeight};
  font-size: ${tokens.typography.table.cell_text.fontSize};

  div {
    padding: ${tokens.spacings.comfortable.x_small} ${tokens.spacings.comfortable.small};

    &:nth-child(2) {    
      display: flex;
      justify-content: center;
      grid-column: 2 / -1;
    }
  }
`;

export const StratigraphicFrameworkContent = styled(GenericInnerBox).attrs<{
  $numStratColumns: number;
  $numRows: number;
}>((props) => ({
  style: {
    gridTemplateRows: `repeat(${props.$numRows}, 14px)`,
    gridTemplateColumns: `minmax(max-content, 2fr) repeat(${props.$numStratColumns}, 3fr)`,
  },
}))`
  display: grid;
  overflow: auto;
  padding: ${tokens.spacings.comfortable.medium} ${tokens.spacings.comfortable.small};
`;

export const ZoneItem = styled.div`
  padding: ${tokens.spacings.comfortable.x_small};

  button {
    width: 100%;
    height: 100%;
    display: block;

    background-color: ${tokens.colors.infographic.primary__moss_green_21.rgba}; 
    &:hover {
      background-color: ${tokens.colors.infographic.primary__moss_green_34.rgba};
    }

    &.unselected {
      background-color: ${tokens.colors.interactive.disabled__fill.rgba};
      &:hover {
        background-color: ${tokens.colors.infographic.primary__moss_green_21.rgba};
      }
    }
  }
`;

export const HorizonItem = styled.div`
  grid-column: 1;

  button {
    height: 100%;  
    width: 100%;
    padding: ${tokens.spacings.comfortable.x_small};
    background-color: ${tokens.colors.ui.background__default.hex};

    span {
      justify-content: flex-start;
    }

    &:disabled:not(.orphan) {    
      background-color: ${tokens.colors.ui.background__default.hex};
      color: ${tokens.colors.text.static_icons__default.hex};
    }
    &.unselected:not(:hover) {
      color: ${tokens.colors.interactive.disabled__text.hex};
    }
  }
`;

export const GridLine = styled.div<{
  $lineStyle?: "solid" | "dashed";
}>`
  grid-column: 1 / -1;
  border-bottom: 1px ${tokens.colors.ui.background__overlay.hex};
  border-bottom-style: ${({ $lineStyle }) => $lineStyle};
`;
