import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const SidebarGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SidebarGroupLabel = styled.div<{ $active: boolean }>`
  padding: ${tokens.spacings.comfortable.small}
    ${tokens.spacings.comfortable.medium} 0
    ${tokens.spacings.comfortable.x_large};
  color: ${({ $active }) =>
    $active
      ? tokens.colors.interactive.primary__resting.hex
      : tokens.colors.text.static_icons__tertiary.hex};
  font-weight: 500;
`;

export const SidebarGroupItems = styled.div`
  padding-left: ${tokens.spacings.comfortable.medium};
`;
