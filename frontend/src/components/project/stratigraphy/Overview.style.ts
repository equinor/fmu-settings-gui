import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ZonePlacementInfo } from "../stratigraphicFramework/types";

export const ElementSystems = styled.div`
	flex: 1;
  padding: ${tokens.spacings.comfortable.x_small};

	display: flex;
	gap: ${tokens.spacings.comfortable.small};
`;

export const ElementActions = styled.div`
	flex-shrink: 0;
	height: 20px;
	cursor: pointer;

	display: flex;
	justify-content: center;
	align-items: start;
`;

export const ElementSystem = styled.div`
	flex: 1;
	padding: ${tokens.spacings.comfortable.x_small};
	border-radius: ${tokens.shape.corners.borderRadius};

	display: grid;
	align-items: center;
`;

export const ElementInfo = styled.div.attrs<{
  $targetSystem?: boolean;
}>((props) => ({
  $targetSystem: props.$targetSystem ?? false,
}))`
	justify-self: ${({ $targetSystem }) => ($targetSystem ? "right" : undefined)};

	cursor: default;
`;

export const ElementSystemName = styled.div`
	width: fit-content;
	padding: 0 ${tokens.spacings.comfortable.small} 0 ${tokens.spacings.comfortable.small};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-bottom-left-radius: 0%;
	border-bottom-right-radius: 0%;
	background: #ffffff;

	color: black;
	font-size: 10px;
	line-height: ${tokens.typography.navigation.button.lineHeight};
`;

export const ElementName = styled.div.attrs<{
  $targetSystem?: boolean;
  $missingvalue?: boolean;
}>((props) => ({
  $targetSystem: props.$targetSystem ?? false,
  $missingvalue: props.$missingvalue ?? false,
}))`
	width: fit-content;
	padding: ${tokens.spacings.comfortable.x_small} ${tokens.spacings.comfortable.small};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-top-left-radius: 0%;
	background: ${(props) =>
    props.$targetSystem
      ? tokens.colors.infographic.substitute__blue_overcast.hex
      : tokens.colors.infographic.primary__mist_blue.hex};

	display: flex;
	gap: ${tokens.spacings.comfortable.small};

	color: ${(props) =>
    props.$targetSystem
      ? tokens.colors.text.static_icons__primary_white.hex
      : tokens.colors.text.static_icons__default.hex};
	font-size: ${tokens.typography.navigation.button.fontSize};
	font-weight: ${tokens.typography.navigation.button.fontWeight};
	font-style: ${(props) => (props.$missingvalue ? "italic" : "normal")};
	line-height: ${tokens.typography.navigation.button.lineHeight};
	white-space: nowrap;

	.aliases {
		color: ${tokens.colors.infographic.substitute__purple_berry.hex}
	}
`;

export const HorizonItem = styled.div<{ $rowStart: number }>`
  grid-row: ${({ $rowStart }) => `${$rowStart} / span 3`};
  grid-column: 1;
  align-self: center;

  margin: ${tokens.spacings.comfortable.x_small};
	border: solid 1px #cccccc;
	border-radius: ${tokens.shape.corners.borderRadius};
	background: ${tokens.colors.ui.background__default.hex};

	display: flex;
	flex-direction: column;
`;

export const HorizonSystemName = styled(ElementSystemName)`
	padding-top: 1px;
	border: solid 1px #cccccc;
	border-bottom: none;
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
