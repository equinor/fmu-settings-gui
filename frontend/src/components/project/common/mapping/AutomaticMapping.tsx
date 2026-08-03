import { Dialog } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";

import { matchPostMatchOptions } from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog } from "#components/common";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { EditDialog, PageText } from "#styles/common";
import { useConfirmClose } from "#utils/ui";
import {
  ElementInfo,
  ElementName,
  ElementSystem,
  ElementSystemName,
} from "../../mappings/stratigraphy/Overview.style";
import type { ElementType } from "../../mappings/stratigraphy/types";
import { UnmappedElementsBox } from "./AutomaticMapping.style";
import { useMappingData } from "./functions";
import type { UnmappedElements } from "./types";
import { elementTypePlural } from "./utils";

const ShowMaxElements = 10;

export function AutomaticMapping({
  elementType,
  unmappedElements,
  isOpen,
  closeDialog,
}: {
  elementType: ElementType | undefined;
  unmappedElements: UnmappedElements;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const mappingData = useMappingData();

  const mappingResults = useQuery({
    ...matchPostMatchOptions({
      body: { sources: ["NORDLAND_GP"], targets: ["NORDLAND GP."] },
    }),
    enabled: false,
  });

  const confirmClose = useConfirmClose({
    enable: isOpen && !mappingData.projectReadOnly,
    determineRequiresConfirmation: () => false,
    onCloseConfirmed: () => {
      closeDialog();
    },
  });

  if (!isOpen || elementType === undefined) {
    return null;
  }

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        $maxWidth="800px"
        open={isOpen}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
      >
        <Dialog.Header>
          Automatic mapping of {elementTypePlural[elementType]}
        </Dialog.Header>

        <Dialog.CustomContent>
          <PageText>
            Mappings for the following {elementTypePlural[elementType]} are not
            currently set:
          </PageText>

          <UnmappedElementsBox>
            {unmappedElements[elementType]
              .slice(0, ShowMaxElements)
              .map((element) => (
                <ElementSystem key={element}>
                  <ElementInfo>
                    <ElementSystemName $elementType={elementType}>
                      RMS
                    </ElementSystemName>
                    <ElementName>{element}</ElementName>
                  </ElementInfo>
                </ElementSystem>
              ))}
            {unmappedElements[elementType].length > ShowMaxElements && (
              <PageText>
                ... and {unmappedElements[elementType].length - ShowMaxElements}{" "}
                more
              </PageText>
            )}
          </UnmappedElementsBox>

          <PageText>
            These {elementTypePlural[elementType]} can be automatically mapped,
            and the results will be shown below, allowing for checking the
            mappings before saving.
          </PageText>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <GeneralButton
            label="Perform mapping"
            isPending={mappingResults.isFetching}
            onClick={() => {
              void mappingResults.refetch();
            }}
          />

          <SubmitButton label="Save selected mappings" disabled />

          <CancelButton
            onClick={(e) => {
              e.preventDefault();
              confirmClose.handleCloseRequest();
            }}
          />
        </Dialog.Actions>
      </EditDialog>
    </>
  );
}
