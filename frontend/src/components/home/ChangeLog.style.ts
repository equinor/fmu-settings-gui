import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ChangeLogTable = styled.table`
	width: 100%;
	border-collapse: collapse;

	th,
	td {
		padding: ${tokens.spacings.comfortable.x_small};
		text-align: left;
		vertical-align: top;
	}

	th {
		font-weight: 500;
		border-bottom: 1px solid ${tokens.colors.ui.background__medium.hex};
	}

	td {
		border-top: 1px solid ${tokens.colors.ui.background__medium.hex};
	}
`;

export const TypeCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${tokens.spacings.comfortable.small};
`;

export const ChangeDetailsCode = styled.pre`
	margin: ${tokens.spacings.comfortable.small} 0 0;
	padding: ${tokens.spacings.comfortable.small};
	border: solid 1px ${tokens.colors.ui.background__medium.hex};
	border-radius: ${tokens.shape.corners.borderRadius};
	background: ${tokens.colors.ui.background__light.hex};
	white-space: pre-wrap;
	word-break: break-word;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
		"Liberation Mono", "Courier New", monospace;
	font-size: 0.875rem;
	line-height: 1.35;
`;

export const ChangeDetailsMeta = styled.table`
	width: 100%;
	border-collapse: collapse;

	th,
	td {
		padding: ${tokens.spacings.comfortable.x_small} 0;
		text-align: left;
		vertical-align: top;
	}

	th {
		width: 6rem;
		font-weight: 500;
		padding-right: ${tokens.spacings.comfortable.small};
		white-space: nowrap;
	}

	td {
		word-break: break-word;
	}
`;
