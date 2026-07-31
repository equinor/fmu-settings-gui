import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const MappingActionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(14rem, 1fr) auto;
  gap: ${tokens.spacings.comfortable.medium};
  align-items: center;
  padding-block: ${tokens.spacings.comfortable.small};
  border-top: solid 1px ${tokens.colors.ui.background__medium.hex};

  @media (max-width: 48rem) {
    grid-template-columns: 1fr;
    gap: ${tokens.spacings.comfortable.small};
  }
`;

export const MappingActionTitle = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.x_small};
  color: ${tokens.colors.text.static_icons__default.hex};
  font-weight: 500;
`;

export const MappingActionDescription = styled.div`
  color: ${tokens.colors.text.static_icons__secondary.hex};
`;

export const MappingActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${tokens.spacings.comfortable.small};

  @media (max-width: 48rem) {
    justify-content: flex-start;
  }
`;
