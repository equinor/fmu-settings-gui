import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type {
  HorizonLineStyle,
  ZonePlacementInfo,
} from "../stratigraphicFramework/types";

export const HorizonItem = styled.div<{
  $rowStart: number;
  $lineStyle: HorizonLineStyle;
}>`
  grid-row: ${({ $rowStart }) => `${$rowStart} / span 3`};
  grid-column: 1;
  align-self: center;

  margin: ${tokens.spacings.comfortable.x_small};
	border: 1px #999999;
	border-style: ${({ $lineStyle }) => $lineStyle};
	border-radius: ${tokens.shape.corners.borderRadius};
	background: ${tokens.colors.ui.background__default.hex};

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

export const ZoneItem = styled.div.attrs<{ $zoneGrid: ZonePlacementInfo }>(
  ({ $zoneGrid }) => ({
    style: {
      gridRow: `${$zoneGrid.rowStart * 3} / ${$zoneGrid.rowEnd * 3 - 1}`,
      gridColumn: $zoneGrid.gridColumn,
    },
  }),
)`
  margin: ${tokens.spacings.comfortable.x_small};

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
