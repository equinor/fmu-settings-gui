import type { ReactNode } from "react";

import {
  MappingActionButtons,
  MappingActionDescription,
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
        <MappingActionDescription>{description}</MappingActionDescription>
      </div>
      <MappingActionButtons>{children}</MappingActionButtons>
    </MappingActionRow>
  );
}
