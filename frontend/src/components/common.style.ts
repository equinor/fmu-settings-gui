import { tokens } from "@equinor/eds-tokens";
import styled, { css } from "styled-components";

import type { DataSystem } from "#client";
import type { ElementNameIsNoElement } from "./common";

function getColors(
  elementSystem: DataSystem,
  isNoElement: ElementNameIsNoElement,
) {
  let backgroundColor: string;
  let color: string;

  switch (elementSystem) {
    case "rms":
      backgroundColor = tokens.colors.infographic.primary__mist_blue.hex;
      color = tokens.colors.text.static_icons__default.hex;
      break;
    case "simulator":
      backgroundColor = tokens.colors.infographic.primary__spruce_wood.hex;
      color = tokens.colors.text.static_icons__default.hex;
      break;
    case "smda":
      backgroundColor = tokens.colors.infographic.substitute__blue_overcast.hex;
      color = tokens.colors.text.static_icons__primary_white.hex;
      break;
    default:
      backgroundColor = tokens.colors.ui.background__default.hex;
      color = tokens.colors.text.static_icons__default.hex;
  }

  if (isNoElement === "warning") {
    backgroundColor = tokens.colors.infographic.substitute__pink_salmon.hex;
    color = tokens.colors.text.static_icons__default.hex;
  } else if (isNoElement === "info") {
    backgroundColor = "transparent";
    color = tokens.colors.text.static_icons__tertiary.hex;
  }

  return css`
		background-color: ${backgroundColor};
		color: ${color};
	`;
}

export const ElementSystem = styled.div<{
  $systemNameShown?: boolean;
}>`
  display: inline grid;
  vertical-align: ${(props) => (props.$systemNameShown ? "82%" : undefined)} ;
  border-radius: ${tokens.shape.corners.borderRadius};

  align-items: center;
`;

export const ElementInfo = styled.div`
	cursor: default;
`;

export const ElementSystemName = styled.div<{
  $isNoElement?: ElementNameIsNoElement;
  $showBorder?: boolean;
}>`
	width: fit-content;
	padding: 0 ${tokens.spacings.comfortable.small} 0 ${tokens.spacings.comfortable.small};
	padding-top: ${(props) => (props.$showBorder ? "1px" : undefined)};
	border: ${(props) => (props.$showBorder ? "solid 1px #cccccc" : undefined)};
	border-bottom: ${(props) => (props.$isNoElement === "info" ? undefined : "none")};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-bottom-left-radius: ${(props) => (props.$isNoElement === "info" ? undefined : "0%")};
	border-bottom-right-radius: ${(props) => (props.$isNoElement === "info" ? undefined : "0%")};
	background: ${tokens.colors.ui.background__default.hex};

	color: black;
	font-size: 10px;
	line-height: ${tokens.typography.navigation.button.lineHeight};
	text-transform: uppercase;
`;

export const ElementNameDisplay = styled.div<{
  $system: DataSystem;
  $isNoElement?: ElementNameIsNoElement;
  $systemNameShown?: boolean;
}>`
	width: fit-content;
	padding: ${tokens.spacings.comfortable.x_small} ${tokens.spacings.comfortable.small};
	padding-left: ${(props) => (props.$isNoElement === "info" ? "0" : undefined)};
	border-radius: ${tokens.shape.corners.borderRadius};
	border-top-left-radius: ${(props) => (props.$systemNameShown ? "0%" : undefined)};

	display: flex;
	gap: ${tokens.spacings.comfortable.small};

	font-size: ${tokens.typography.navigation.button.fontSize};
	font-weight: ${tokens.typography.navigation.button.fontWeight};
	font-style: ${(props) => (props.$isNoElement ? "italic" : "normal")};
	line-height: ${tokens.typography.navigation.button.lineHeight};
	white-space: nowrap;

  ${(props) => getColors(props.$system, props.$isNoElement)}

	.aliases {
		color: ${tokens.colors.infographic.substitute__purple_berry.hex}
	}
`;
