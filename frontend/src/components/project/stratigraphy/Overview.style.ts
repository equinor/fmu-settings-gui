import { tokens } from "@equinor/eds-tokens";
import styled, { css } from "styled-components";

import type {
  HorizonLineStyle,
  ZonePlacementInfo,
} from "../stratigraphicFramework/types";
import type { ElementType } from "./types";

function getColors(
  isTargetSystem: boolean,
  isUnmappable: boolean,
  isMissingValue: boolean,
) {
  let backgroundColor = "inherit";
  let color = "inherit";

  if (isTargetSystem) {
    if (isUnmappable) {
      backgroundColor = tokens.colors.infographic.substitute__pink_salmon.hex;
      color = tokens.colors.text.static_icons__default.hex;
    } else if (isMissingValue) {
      backgroundColor = "transparent";
      color = tokens.colors.text.static_icons__tertiary.hex;
    } else {
      backgroundColor = tokens.colors.infographic.substitute__blue_overcast.hex;
      color = tokens.colors.text.static_icons__primary_white.hex;
    }
  } else {
    backgroundColor = tokens.colors.infographic.primary__mist_blue.hex;
    color = tokens.colors.text.static_icons__default.hex;
  }

  return css`
		background-color: ${backgroundColor};
		color: ${color};
	`;
}

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
  $isTargetSystem?: boolean;
}>((props) => ({
  $isTargetSystem: props.$isTargetSystem ?? false,
}))`
	justify-self: ${({ $isTargetSystem }) => ($isTargetSystem ? "right" : undefined)};

	cursor: default;
`;

export const ElementSystemName = styled.div.attrs<{
  $elementType?: ElementType | undefined;
  $isMissingvalue?: boolean;
}>((props) => ({
  $elementType: props.$elementType,
  $isMissingvalue: Boolean(props.$isMissingvalue),
}))`
	width: fit-content;
	padding: 0 ${tokens.spacings.comfortable.small} 0 ${tokens.spacings.comfortable.small};
	padding-top: ${({ $elementType }) => ($elementType === "horizon" ? "1px" : undefined)};
	border: ${({ $elementType }) => ($elementType === "horizon" ? "solid 1px #cccccc" : undefined)};
	border-bottom: ${({ $isMissingvalue }) => ($isMissingvalue ? undefined : "none")};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-bottom-left-radius: ${({ $isMissingvalue }) => ($isMissingvalue ? undefined : "0%")};
	border-bottom-right-radius: ${({ $isMissingvalue }) => ($isMissingvalue ? undefined : "0%")};
	background: #ffffff;

	color: black;
	font-size: 10px;
	line-height: ${tokens.typography.navigation.button.lineHeight};
`;

export const ElementName = styled.div.attrs<{
  $isTargetSystem?: boolean;
  $isUnmappable?: boolean;
  $isMissingvalue?: boolean;
}>((props) => ({
  $isTargetSystem: Boolean(props.$isTargetSystem),
  $isUnmappable: Boolean(props.$isUnmappable),
  $isMissingvalue: Boolean(props.$isMissingvalue),
}))`
	width: fit-content;
	padding: ${tokens.spacings.comfortable.x_small} ${tokens.spacings.comfortable.small};
	padding-left: ${({ $isMissingvalue }) => ($isMissingvalue ? "0" : undefined)};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-top-left-radius: 0%;

	display: flex;
	gap: ${tokens.spacings.comfortable.small};

	font-size: ${tokens.typography.navigation.button.fontSize};
	font-weight: ${tokens.typography.navigation.button.fontWeight};
	font-style: ${({ $isUnmappable, $isMissingvalue }) => ($isUnmappable || $isMissingvalue ? "italic" : "normal")};
	line-height: ${tokens.typography.navigation.button.lineHeight};
	white-space: nowrap;

	${({ $isTargetSystem, $isUnmappable, $isMissingvalue }) =>
    getColors(
      Boolean($isTargetSystem),
      Boolean($isUnmappable),
      Boolean($isMissingvalue),
    )}

	.aliases {
		color: ${tokens.colors.infographic.substitute__purple_berry.hex}
	}
`;
