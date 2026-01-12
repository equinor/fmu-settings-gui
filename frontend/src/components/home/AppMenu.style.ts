import styled from "styled-components";

export const AppWrapper = styled.div`
	display: flex;
	flex-direction: row;
	align-items: stretch;

	a {
		height: auto;
		padding: 8px;
	
		span {
			grid-auto-flow: row;
			grid-template-rows: auto 1fr;
			align-items: start;
			width: 100px;
				img {
					width: 100%;
					height: 24px;
				}
		}
	}
`;
