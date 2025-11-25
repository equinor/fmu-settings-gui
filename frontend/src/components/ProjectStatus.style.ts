import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const ProjectStatusContainer = styled.div`
  padding: ${tokens.spacings.comfortable.medium};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  margin-bottom: ${tokens.spacings.comfortable.medium};
  height: fit-content;
`;

export const ProjectStatusHeader = styled.div`
  display: grid;
  align-items: center; 
  grid-template-columns: min-content 1fr auto;
  gap: ${tokens.spacings.comfortable.medium};
`;

export const ProjectStatusIconContainer = styled.div<{
  $variant: "success" | "warning" | "error";
}>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
  width: 40px;
  height: 40px;

  ${({ $variant }) => {
    switch ($variant) {
      case "success":
        return `
          background-color: ${tokens.colors.interactive.primary__hover_alt.hex};
          color: ${tokens.colors.interactive.primary__resting.hex};
        `;
      case "warning":
        return `
          background-color: ${tokens.colors.interactive.warning__highlight.hex};
          color: ${tokens.colors.interactive.warning__resting.hex};
        `;
      case "error":
        return `
          background-color: ${tokens.colors.interactive.danger__highlight.hex};
          color: ${tokens.colors.interactive.danger__resting.hex};
        `;
    }
  }}
`;

export const StatusChecksContainer = styled.div`
  margin-top: ${tokens.spacings.comfortable.large};

  td {
      width: 100%;
  }
`;
