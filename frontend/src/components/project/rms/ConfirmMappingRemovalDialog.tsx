import { Dialog, List } from "@equinor/eds-core-react";
import type { ReactNode } from "react";

import { CancelButton, GeneralButton } from "#components/form/button";
import { GenericDialog, PageList, PageText } from "#styles/common";

const PREVIEW_LIMIT = 10;

export type PendingMappingRemoval = {
  selection: ReactNode;
  itemLabel: string;
  multipleItems: boolean;
  mappingTexts: string[];
  apply: () => void;
};

export function ConfirmMappingRemovalDialog({
  removal,
  close,
}: {
  removal: PendingMappingRemoval;
  close: () => void;
}) {
  const { selection, itemLabel, multipleItems, mappingTexts } = removal;
  const visibleMappingTexts = mappingTexts.slice(0, PREVIEW_LIMIT);
  const hiddenMappingCount = mappingTexts.length - visibleMappingTexts.length;

  return (
    <GenericDialog
      open={true}
      isDismissable={true}
      onClose={close}
      $minWidth="36em"
    >
      <Dialog.Header>
        <Dialog.Title>Remove {itemLabel}</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <PageText>
          {selection} {multipleItems ? "have" : "has"} been selected for removal
          from the project.
        </PageText>

        <PageText>
          The following mappings will also be removed from the project, as they
          are dependent on {multipleItems ? "these" : "this"} {itemLabel}:
        </PageText>

        <PageList>
          {visibleMappingTexts.map((mappingText) => (
            <List.Item key={mappingText}>{mappingText}</List.Item>
          ))}
          {hiddenMappingCount > 0 && (
            <List.Item>and {hiddenMappingCount} more</List.Item>
          )}
        </PageList>

        <PageText $marginBottom="0">
          Do you want to remove the {itemLabel} and{" "}
          {multipleItems ? "their" : "its"} mappings?
        </PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label="OK"
          onClick={() => {
            removal.apply();
            close();
          }}
        />
        <CancelButton onClick={close} />
      </Dialog.Actions>
    </GenericDialog>
  );
}
