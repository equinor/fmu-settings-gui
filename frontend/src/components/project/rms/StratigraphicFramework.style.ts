import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ZonePlacementInfo } from "../stratigraphicFramework/types";

export const ZoneItem = styled.div.attrs<{ $zoneGrid: ZonePlacementInfo }>(
  ({ $zoneGrid }) => ({
    style: {
      gridRow: `${$zoneGrid.rowStart * 2 + 2} / ${$zoneGrid.rowEnd * 2 + 2}`,
      gridColumn: $zoneGrid.gridColumn + 1,
    },
  }),
)`
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
