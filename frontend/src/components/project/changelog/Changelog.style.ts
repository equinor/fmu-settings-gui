import { Chip } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import type { ChangeType } from "#client/types.gen";
import { GenericBox } from "#styles/common";

function changeTypeColor(changeType: ChangeType) {
  switch (changeType) {
    case "add":
    case "copy":
      return tokens.colors.interactive.success__resting.hex;
    case "remove":
      return tokens.colors.interactive.danger__resting.hex;
    case "reset":
      return tokens.colors.interactive.warning__resting.hex;
    default:
      return tokens.colors.interactive.primary__resting.hex;
  }
}

export const ChangelogTableContainer = styled.div`
  table {
    width: 100% !important;
  }
`;

export const ChangelogDateTime = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  column-gap: ${tokens.spacings.comfortable.x_small};

  span {
    white-space: nowrap;
  }
`;

export const ChangelogChangeDescription = styled.span`
  white-space: nowrap;
`;

export const ChangelogFilterBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${tokens.spacings.comfortable.small};
  flex-wrap: wrap;
  margin-bottom: ${tokens.spacings.comfortable.medium};
`;

export const ChangelogFilterField = styled.div`
  min-width: 12em;
`;

export const ChangeTypeChip = styled(Chip)<{ $changeType: ChangeType }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${({ $changeType }) => changeTypeColor($changeType)};
  background: ${tokens.colors.ui.background__light.hex};
  border: 0;
`;

export const ChangeDetails = styled(GenericBox)`
  margin-bottom: 0;
  background: ${tokens.colors.ui.background__default.hex};
`;

export const ChangeDetailsDialogContent = styled.div`
  max-height: 70vh;
  overflow-y: auto;
`;

export const ChangeDetailsHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacings.comfortable.small};
`;

export const ChangeDetailsValueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${tokens.spacings.comfortable.small};

  @media (max-width: 48em) {
    grid-template-columns: 1fr;
  }
`;

export const ChangeDetailsValuePanel = styled.div<{
  $kind: "before" | "after";
}>`
  padding: ${tokens.spacings.comfortable.small};
  border: 1px solid
    ${({ $kind }) =>
      $kind === "before"
        ? tokens.colors.interactive.danger__resting.hex
        : tokens.colors.interactive.success__resting.hex};
  border-radius: ${tokens.shape.corners.borderRadius};
  background: ${({ $kind }) =>
    $kind === "before"
      ? tokens.colors.ui.background__danger.hex
      : tokens.colors.interactive.success__highlight.hex};
`;

export const ChangeDetailsValueHeader = styled.div`
  margin-bottom: ${tokens.spacings.comfortable.small};
  font-weight: 500;
`;

export const ChangeDetailsContent = styled.pre`
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: ${tokens.colors.text.static_icons__default.hex};
  font-size: 0.875rem;
  line-height: 1.4;
`;
