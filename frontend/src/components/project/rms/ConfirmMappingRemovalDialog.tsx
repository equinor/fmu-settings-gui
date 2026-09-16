import { Dialog, List } from "@equinor/eds-core-react";
import type { ReactNode } from "react";

import { CancelButton, GeneralButton } from "#components/form/button";
import { GenericDialog, PageList, PageText } from "#styles/common";

const PREVIEW_LIMIT = 10;

export type PendingMappingRemoval = {
  action: "mark-planned" | "remove";
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
  const { action, selection, itemLabel, multipleItems, mappingTexts } = removal;
  const visibleMappingTexts = mappingTexts.slice(0, PREVIEW_LIMIT);
  const hiddenMappingCount = mappingTexts.length - visibleMappingTexts.length;
  const markPlanned = action === "mark-planned";

  return (
    <GenericDialog
      open={true}
      isDismissable={true}
      onClose={close}
      $minWidth="36em"
    >
      <Dialog.Header>
        <Dialog.Title>
          {markPlanned ? `Mark ${itemLabel} as planned` : `Remove ${itemLabel}`}
        </Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        {markPlanned ? (
          <>
            <PageText>{selection} will be marked as planned.</PageText>
            <PageText>
              The following SMDA mapping will be removed from the project
              because planned wellbores cannot have SMDA mappings:
            </PageText>
          </>
        ) : (
          <>
            <PageText>
              {selection} {multipleItems ? "have" : "has"} been selected for
              removal from the project.
            </PageText>
            <PageText>
              The following mappings will also be removed from the project, as
              they are dependent on {multipleItems ? "these" : "this"}{" "}
              {itemLabel}:
            </PageText>
          </>
        )}

        <PageList>
          {visibleMappingTexts.map((mappingText) => (
            <List.Item key={mappingText}>{mappingText}</List.Item>
          ))}
          {hiddenMappingCount > 0 && (
            <List.Item>and {hiddenMappingCount} more</List.Item>
          )}
        </PageList>

        <PageText $marginBottom="0">
          {markPlanned ? (
            `Do you want to mark the ${itemLabel} as planned and remove its SMDA mapping?`
          ) : (
            <>
              Do you want to remove the {itemLabel} and{" "}
              {multipleItems ? "their" : "its"} mappings?
            </>
          )}
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
