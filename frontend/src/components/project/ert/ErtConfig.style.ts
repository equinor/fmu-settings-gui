import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const FieldGroup = styled.fieldset`
  margin: 0 0 ${tokens.spacings.comfortable.medium} 0;
  padding: ${tokens.spacings.comfortable.medium};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};

  legend {
    padding: 0 ${tokens.spacings.comfortable.x_small};
    font-weight: 500;
  }
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
  gap: ${tokens.spacings.comfortable.medium};
`;

export const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

export const ExperimentTypeContainer = styled.div`
  max-width: 24em;
  margin-bottom: ${tokens.spacings.comfortable.large};
`;

export const PredefinedTable = styled.table`
  border-collapse: collapse;

  th, td {
    padding: 2px ${tokens.spacings.comfortable.small} 2px 0;
    vertical-align: top;
    text-align: left;
    font-family: monospace;
  }

  th {
    white-space: nowrap;
  }

  td {
    word-break: break-all;
  }
`;

export const Preview = styled.pre`
  max-height: 40em;
  overflow: auto;
  margin: 0 0 ${tokens.spacings.comfortable.medium} 0;
  padding: ${tokens.spacings.comfortable.small} 0;
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${tokens.colors.ui.background__light.hex};
  font-size: 0.8em;
  line-height: 1.4;

  .line {
    display: block;
    padding-right: ${tokens.spacings.comfortable.small};
  }

  .line.error {
    background: ${tokens.colors.ui.background__danger.hex};
  }

  .lineNumber {
    display: inline-block;
    width: 3.5em;
    margin-right: ${tokens.spacings.comfortable.small};
    padding-right: ${tokens.spacings.comfortable.x_small};
    text-align: right;
    color: ${tokens.colors.text.static_icons__tertiary.hex};
    user-select: none;
  }
`;

export const ResultBox = styled.div<{
  $variant: "success" | "danger" | "info";
}>`
  margin-bottom: ${tokens.spacings.comfortable.medium};
  padding: ${tokens.spacings.comfortable.small} ${tokens.spacings.comfortable.medium};
  border-radius: ${tokens.shape.corners.borderRadius};
  overflow-wrap: anywhere;
  background: ${({ $variant }) =>
    $variant === "success"
      ? tokens.colors.interactive.success__highlight.hex
      : $variant === "danger"
        ? tokens.colors.ui.background__danger.hex
        : tokens.colors.ui.background__info.hex};

  ul {
    margin: ${tokens.spacings.comfortable.x_small} 0 0 0;
    padding-left: ${tokens.spacings.comfortable.large};
  }
`;
