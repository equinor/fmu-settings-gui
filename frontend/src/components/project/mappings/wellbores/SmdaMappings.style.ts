import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { EditDialog, InfoBox } from "#styles/common";
import { dataGridHeader } from "#styles/dataGrid";
import type { DisplayedMatchQuality } from "./types";

export const MappingDialog = styled(EditDialog)`
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: calc(100dvh - 2.5rem);

  #eds-dialog-customcontent {
    min-width: 0;
    min-height: 0;
    max-height: none;
    padding-bottom: ${tokens.spacings.comfortable.medium};
  }
`;

export const MappingParametersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: ${tokens.spacings.comfortable.medium};

  > button {
    margin-bottom: ${tokens.spacings.comfortable.large};
  }
`;

export const MappingHelp = styled.details`
  margin-block: ${tokens.spacings.comfortable.small};

  summary {
    cursor: pointer;
    color: ${tokens.colors.interactive.primary__resting.hex};
  }

  &[open] summary {
    margin-bottom: ${tokens.spacings.comfortable.small};
  }

  > p:last-child {
    margin-bottom: 0;
  }
`;

export const MappingSummary = styled(InfoBox)`
  dl {
    display: flex;
    flex-wrap: wrap;
    gap: ${tokens.spacings.comfortable.medium};
    margin: 0;
  }

  dl > div {
    flex: 1 1 10rem;
  }

  dd {
    margin: 0;
    font-weight: 500;
  }

  > p {
    margin: 0 0 ${tokens.spacings.comfortable.small};
    overflow-wrap: anywhere;
  }
`;

export const MatchingResultsContainer = styled.div`
  .table-wrapper {
    ${dataGridHeader}
  }

  table {
    width: 100% !important;
    min-width: 38rem !important;
    table-layout: fixed !important;
  }

  .name-column {
    width: auto !important;
    max-width: none !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .centered-column-header [class*="CellInner"] {
    justify-content: center;
  }
`;

export const ConfidenceBadge = styled.span<{
  $confidence: DisplayedMatchQuality;
}>`
  display: inline-block;
  min-width: 4.5rem;
  padding-block: ${tokens.spacings.comfortable.x_small};
  padding-inline: ${tokens.spacings.comfortable.small};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${({ $confidence }) => {
    if ($confidence === "Exact") {
      return tokens.colors.ui.background__info.hex;
    }
    if ($confidence === "High") {
      return tokens.colors.interactive.success__highlight.hex;
    }

    return tokens.colors.ui.background__warning.hex;
  }};
  color: ${tokens.colors.text.static_icons__default.hex};
  font-weight: 500;
  text-align: center;
`;

export const PrefixSelector = styled.div`
  width: 100%;
  max-width: 22rem;
`;
