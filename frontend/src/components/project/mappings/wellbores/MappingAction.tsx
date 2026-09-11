import type { ReactNode } from "react";

import { PageText } from "#styles/common";
import {
  MappingActionButtons,
  MappingActionRow,
  MappingActionTitle,
} from "./MappingAction.style";

export function MappingAction({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <MappingActionRow>
      <div>
        <MappingActionTitle>{title}</MappingActionTitle>
        <PageText $marginBottom="0">{description}</PageText>
      </div>
      <MappingActionButtons>{children}</MappingActionButtons>
    </MappingActionRow>
  );
}
