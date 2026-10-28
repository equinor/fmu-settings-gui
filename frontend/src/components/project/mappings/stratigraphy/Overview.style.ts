import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type {
  HorizonLineStyle,
  ZonePlacementInfo,
} from "../../common/stratigraphicFramework/types";

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

  display: flex;
  flex-direction: column;
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
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.infographic.primary__moss_green_21.hex};

  display: flex;
  flex-direction: column;
`;

export const ElementSystems = styled.div`
  flex: 1;
  padding: ${tokens.spacings.comfortable.small};

  display: flex;
  gap: ${tokens.spacings.comfortable.small};
  justify-content: space-between;
  align-items: center;
  
  & > div {
    cursor: default;
  }
`;

export const ElementActions = styled.div`
  flex-shrink: 0;
  height: 20px;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: start;
`;
