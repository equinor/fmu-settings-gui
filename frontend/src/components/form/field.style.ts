import { InputWrapper, Search } from "@equinor/eds-core-react";
import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const CommonInputWrapper = styled(InputWrapper)`

  .errorText {
    color: ${tokens.colors.interactive.danger__text.hex};
  }
`;

export const ArrayTextFieldContainer = styled.div`
  padding: ${tokens.spacings.comfortable.medium_small};
  border: solid 1px ${tokens.colors.ui.background__medium.hex};
  border-radius: ${tokens.shape.corners.borderRadius};

  display: grid;
  grid-template-columns: 1fr 16px;
  column-gap: ${tokens.spacings.comfortable.medium_small};
  row-gap: ${tokens.spacings.comfortable.medium_small};
  align-items: center;

  .addIcon {
    color: ${tokens.colors.interactive.success__text.hex};
  }

  .removeIcon {
    color: ${tokens.colors.interactive.danger__text.hex};
  }

  .emptyRow {
    height: 24px;
  }

  .missingValue {
    color: ${tokens.colors.text.static_icons__tertiary.hex};
    font-style: italic;
  }

`;

export const SearchFieldInput = styled(Search)`
  width: 100%;
`;
