import styled from "styled-components";

import { InfoBox } from "#styles/common";

// Shared label width so the masterdata and associated fields boxes line up.
export const MasterdataInfoBox = styled(InfoBox)`
  th {
    width: 10em;
  }
`;
