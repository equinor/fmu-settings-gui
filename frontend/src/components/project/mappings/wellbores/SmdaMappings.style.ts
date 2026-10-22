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

  && > button {
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
  td {
    overflow-wrap: anywhere;
  }

  > p {
    color: inherit;
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
  padding-left: ${tokens.spacings.comfortable.small};
  border-left: solid ${tokens.spacings.comfortable.medium_small};
  border-color: ${({ $confidence }) => {
    if ($confidence === "Exact") {
      return tokens.colors.infographic.substitute__blue_overcast.hex;
    }
    if ($confidence === "High") {
      return tokens.colors.interactive.success__highlight.hex;
    }

    return tokens.colors.ui.background__warning.hex;
  }};
  color: ${tokens.colors.text.static_icons__default.hex};
  font-weight: 500;
`;

export const PrefixSelector = styled.div`
  width: 100%;
  max-width: 22rem;
`;
