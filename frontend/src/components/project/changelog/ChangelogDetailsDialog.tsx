import { Button, Dialog } from "@equinor/eds-core-react";

import type { ChangeInfo } from "#client/types.gen";
import { GenericDialog, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import {
  ChangeDetails,
  ChangeDetailsContent,
  ChangeDetailsHeader,
  ChangeDetailsSummary,
  ChangeDetailsValueGrid,
  ChangeDetailsValueHeader,
  ChangeDetailsValuePanel,
  ChangeTypeChip,
} from "./Changelog.style";
import {
  FILE_LABELS,
  formatChangeDetails,
  formatChangedField,
  formatEntryDescription,
  getTypeLabel,
  parseChangeDetails,
} from "./utils";

export function ChangelogDetailsDialog({
  entry,
  onClose,
}: {
  entry?: ChangeInfo;
  onClose: () => void;
}) {
  const fieldPath = entry ? entry.key || entry.path : undefined;
  const details = entry
    ? parseChangeDetails(entry.change, fieldPath)
    : undefined;
  const hasValueDiff =
    details?.oldValue !== undefined || details?.newValue !== undefined;

  return (
    <GenericDialog open={entry !== undefined} $maxWidth="56em">
      <Dialog.Header>
        <Dialog.Title>Changelog details</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        {entry && (
          <ChangeDetails>
            <ChangeDetailsHeader>
              <PageText $marginBottom="0">
                <span className="emphasis">
                  {formatEntryDescription(entry)}
                </span>
                {entry.change_type !== "init" && (
                  <> in {FILE_LABELS[entry.file] ?? entry.file}</>
                )}
                <br />
                Changed field: {formatChangedField(entry)}
                <br />
                {entry.timestamp
                  ? displayDateTime(entry.timestamp)
                  : "(unknown date)"}{" "}
                by {entry.user}
              </PageText>
              <ChangeTypeChip $changeType={entry.change_type}>
                {getTypeLabel(entry.change_type)}
              </ChangeTypeChip>
            </ChangeDetailsHeader>

            {hasValueDiff ? (
              <>
                {details.summary && (
                  <ChangeDetailsSummary>{details.summary}</ChangeDetailsSummary>
                )}
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
                <ChangeDetailsSummary>
                  Detailed before and after values were not recorded for this
                  changelog entry.
                </ChangeDetailsSummary>
                <ChangeDetailsContent>
                  {formatChangeDetails(entry.change, fieldPath)}
                </ChangeDetailsContent>
              </>
            )}
          </ChangeDetails>
        )}
      </Dialog.CustomContent>

      <Dialog.Actions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Dialog.Actions>
    </GenericDialog>
  );
}
