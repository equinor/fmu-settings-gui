import { Card } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ResourcesContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: ${tokens.spacings.comfortable.medium};
`;

export const ResourceCard = styled(Card)`
  width: 250px; 
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  background: ${tokens.colors.ui.background__light.hex};  
`;

export const Logo = styled.img`
  width: 35px;
  height: auto;
`;
