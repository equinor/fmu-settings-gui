import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

import { InfoBox, WarningBox } from "#styles/common";

export const FieldsContainer = styled.div`
  width: 900px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  column-gap: ${tokens.spacings.comfortable.xx_large};
  row-gap: ${tokens.spacings.comfortable.medium};

  h4 {
    margin-bottom: 0;
    text-decoration: underline;
  }

  h6 {
    margin-bottom: ${tokens.spacings.comfortable.xx_small};
    font-weight: normal;
  }
`;

export const ItemsContainer = styled(InfoBox)`
  margin-bottom: 0;

  & > div:not(:last-of-type){
    margin-bottom: ${tokens.spacings.comfortable.medium};
  }
`;

export const OrphanTypesContainer = styled(WarningBox)`
  margin-top: ${tokens.spacings.comfortable.medium};
  margin-bottom: 0;
`;
