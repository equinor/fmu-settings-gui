import { Button, Dialog } from "@equinor/eds-core-react";

import type { ChangeInfo } from "#client/types.gen";
import { GenericDialog, PageCode, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDetails,
  ChangeDetailsContent,
  ChangeDetailsDialogContent,
  ChangeDetailsHeader,
  ChangeDetailsValueGrid,
  ChangeDetailsValueHeader,
  ChangeDetailsValuePanel,
  ChangeTypeChip,
} from "./Changelog.style";
import {
  FILE_LABELS,
  formatChangeDetails,
  formatEntryDescription,
  getChangeTypeLabel,
  parseChangeDetails,
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
  const fieldPath = entry?.key ?? undefined;
  const details = entry
    ? parseChangeDetails(entry.change, fieldPath)
    : undefined;
  const hasValueDiff =
    details?.oldValue !== undefined || details?.newValue !== undefined;

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

              {hasValueDiff ? (
                <>
                  {details.summary && <PageText>{details.summary}</PageText>}
                  <ChangeDetailsValueGrid>
                    <ChangeDetailsValuePanel $kind="before">
                      <ChangeDetailsValueHeader>
                        Before change
                      </ChangeDetailsValueHeader>
                      <ChangeDetailsContent>
                        {details.oldValue ?? "(empty)"}
                      </ChangeDetailsContent>
                    </ChangeDetailsValuePanel>
                    <ChangeDetailsValuePanel $kind="after">
                      <ChangeDetailsValueHeader>
                        After change
                      </ChangeDetailsValueHeader>
                      <ChangeDetailsContent>
                        {details.newValue ?? "(empty)"}
                      </ChangeDetailsContent>
                    </ChangeDetailsValuePanel>
                  </ChangeDetailsValueGrid>
                </>
              ) : (
                <>
                  <PageText>
                    Detailed before and after values were not recorded for this
                    change.
                  </PageText>
                  <PageCode $leftRightMargin="0">
                    {formatChangeDetails(entry.change, fieldPath)}
                  </PageCode>
                </>
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
