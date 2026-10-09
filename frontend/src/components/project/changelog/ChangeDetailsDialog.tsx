import { Button, Dialog } from "@equinor/eds-core-react";

import type { ChangeInfo } from "#client/types.gen";
import { GenericDialog, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDetails,
  ChangeDetailsDialogContent,
  ChangeDetailsHeader,
  ChangeTypeChip,
} from "./Changelog.style";
import { StructuredDiff } from "./StructuredDiff";
import {
  FILE_LABELS,
  formatEntryDescription,
  getChangeTypeLabel,
} from "./utils";

export function ChangelogEntryHeader({ entry }: { entry: ChangeInfo }) {
  return (
    <ChangeDetailsHeader>
      <PageText $marginBottom="0">
        <span className="emphasis">{formatEntryDescription(entry)}</span>
        {entry.change_type !== "init" && (
          <>
            {" in "}
            <span className="emphasis">
              {FILE_LABELS[entry.file] ?? entry.file}
            </span>
          </>
        )}
        <br />
        {entry.timestamp ? displayDateTime(entry.timestamp) : "(unknown date)"}{" "}
        by {entry.user}
      </PageText>
      <ChangeTypeChip $changeType={entry.change_type}>
        {getChangeTypeLabel(entry.change_type)}
      </ChangeTypeChip>
    </ChangeDetailsHeader>
  );
}

export function ChangeDetailsDialog({
  entry,
  onClose,
}: {
  entry?: ChangeInfo | undefined;
  onClose: () => void;
}) {
  const structuredDiff = entry?.structured_diff ?? [];

  return (
    <GenericDialog
      open={entry !== undefined}
      isDismissable={true}
      onClose={onClose}
      $width="56em"
    >
      <Dialog.Header>
        <Dialog.Title>Change details</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <ChangeDetailsDialogContent>
          {entry && (
            <ChangeDetails>
              <ChangelogEntryHeader entry={entry} />

              {structuredDiff.length > 0 ? (
                <StructuredDiff entries={structuredDiff} />
              ) : (
                <PageText $marginBottom="0">
                  Detailed change information is not available for this entry.
                </PageText>
              )}
            </ChangeDetails>
          )}
        </ChangeDetailsDialogContent>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <Button onClick={onClose}>Close</Button>
      </Dialog.Actions>
    </GenericDialog>
  );
}
