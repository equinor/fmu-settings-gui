import styled from "styled-components";

import { InfoBox } from "#styles/common";

export const MasterdataInfoBox = styled(InfoBox)`
  padding-top: 2px;
  padding-bottom: 2px;

  table {
    border-spacing: 0 6px;
  }

  // Shared label width so the masterdata and associated fields boxes line up.
  th {
    width: 10em;
  }
`;
