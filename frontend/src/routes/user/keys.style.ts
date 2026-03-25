import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const KeysFormContainer = styled.div`
  width: 24em;
`;

export const TipBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${tokens.spacings.comfortable.small};
  margin-bottom: ${tokens.spacings.comfortable.medium};
  padding: ${tokens.spacings.comfortable.small} ${tokens.spacings.comfortable.medium};
  border: 1px solid ${tokens.colors.interactive.primary__hover_alt.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.interactive.primary__selected_highlight.hex};
`;

export const TipIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  padding-top: 0.1rem;
  color: ${tokens.colors.interactive.primary__resting.hex};
`;

export const TipContent = styled.div`
  min-width: 0;
`;

export const TipTitle = styled.div`
  margin-bottom: 0.1rem;
  color: ${tokens.colors.interactive.primary__resting.hex};
  font-size: 0.95rem;
  font-weight: 600;
`;

export const TipText = styled.div`
  color: ${tokens.colors.text.static_icons__default.hex};
  font-size: 0.9rem;
  line-height: 1.35;
`;
