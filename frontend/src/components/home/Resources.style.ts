import { Card } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ResourcesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${tokens.spacings.comfortable.medium};
`;

export const ResourceCard = styled(Card)`
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  background: ${tokens.colors.ui.background__light.hex};  
`;

export const Logo = styled.img`
  width: 35px;
  height: auto;
`;
