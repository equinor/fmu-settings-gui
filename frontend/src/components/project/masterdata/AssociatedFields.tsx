import { Button, Dialog, Label, Typography } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import type { FieldItem } from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectPatchAssociatedFieldsMutation,
} from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog } from "#components/common";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import {
  ChipsContainer,
  EditDialog,
  GenericBox,
  InfoChip,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { fieldContext, formContext } from "#utils/form";
import { stringCompare } from "#utils/string";
import { useConfirmClose } from "#utils/ui";
import { FieldSearch } from "./FieldSearch";
import { MasterdataInfoBox } from "./Info.style";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: { CancelButton, SubmitButton },
});

// A fixed order lets the form detect changes by content, not by insertion order.
function sortFields(fields: Array<FieldItem>) {
  return fields.toSorted(
    (a, b) =>
      stringCompare(a.identifier, b.identifier) ||
      stringCompare(a.uuid, b.uuid),
  );
}

function AssociatedFieldsDialog({
  projectFields,
  associatedFields,
  projectReadOnly,
  closeDialog,
}: {
  projectFields: Array<FieldItem>;
  associatedFields: Array<FieldItem>;
  projectReadOnly: boolean;
  closeDialog: () => void;
}) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...projectPatchAssociatedFieldsMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
    },
    meta: {
      errorPrefix: "Error saving associated fields",
    },
  });

  const form = useAppForm({
    defaultValues: { associatedFields: sortFields(associatedFields) },
    onSubmit: ({ value }) => {
      if (!projectReadOnly) {
        mutation.mutate(
          { body: value.associatedFields },
          {
            onSuccess: (data) => {
              toast.info(data.message);
              closeDialog();
            },
          },
        );
      }
    },
  });

  const confirmClose = useConfirmClose({
    enable: !projectReadOnly,
    determineRequiresConfirmation: () =>
      !projectReadOnly && !form.state.isDefaultValue,
    onCloseConfirmed: closeDialog,
  });

  return (
    <>
      <FieldSearch
        isOpen={searchDialogOpen}
        title="Associated field search"
        addFields={(fields) => {
          form.setFieldValue("associatedFields", (current) =>
            sortFields(
              fields.reduce<Array<FieldItem>>(
                (acc, field) => {
                  if (!acc.some((item) => item.uuid === field.uuid)) {
                    acc.push(field);
                  }

                  return acc;
                },
                [...current],
              ),
            ),
          );
        }}
        disabledFields={
          new Map(
            projectFields.map((field) => [
              field.uuid,
              "Already stored as a project field",
            ]),
          )
        }
        closeDialog={() => {
          setSearchDialogOpen(false);
        }}
      />

      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={true}
        isDismissable={!searchDialogOpen}
        onClose={confirmClose.handleCloseRequest}
        $minWidth="32em"
        $maxWidth="48em"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>Edit associated fields</Dialog.Header>

          <Dialog.CustomContent>
            <form.Field name="associatedFields" mode="array">
              {(field) => (
                <>
                  <Label label="Associated fields" />
                  <GenericBox>
                    <ChipsContainer>
                      {field.state.value.length ? (
                        field.state.value.map((associated) => (
                          <InfoChip
                            key={associated.uuid}
                            onDelete={() => {
                              field.handleChange(
                                field.state.value.filter(
                                  (item) => item.uuid !== associated.uuid,
                                ),
                              );
                            }}
                          >
                            {associated.identifier}
                          </InfoChip>
                        ))
                      ) : (
                        <Typography>none</Typography>
                      )}
                    </ChipsContainer>
                  </GenericBox>
                </>
              )}
            </form.Field>

            <Button
              variant="outlined"
              onClick={() => {
                setSearchDialogOpen(true);
              }}
            >
              Search for fields
            </Button>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <form.AppForm>
              <form.Subscribe selector={(state) => state.isDefaultValue}>
                {(isDefaultValue) => (
                  <>
                    <form.SubmitButton
                      label="Save"
                      disabled={
                        isDefaultValue || projectReadOnly || mutation.isPending
                      }
                      isPending={mutation.isPending}
                      helperTextDisabled={
                        mutation.isPending
                          ? "Associated fields are being saved"
                          : projectReadOnly
                            ? "Project is read-only"
                            : "Form can be saved when the values have changed"
                      }
                    />
                    <form.CancelButton
                      onClick={(e) => {
                        e.preventDefault();
                        confirmClose.handleCloseRequest();
                      }}
                    />
                  </>
                )}
              </form.Subscribe>
            </form.AppForm>
          </Dialog.Actions>
        </form>
      </EditDialog>
    </>
  );
}

export function AssociatedFields({
  projectFields,
  associatedFields,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  projectFields: Array<FieldItem>;
  associatedFields: Array<FieldItem>;
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <>
      <PageSectionSpacer />

      <PageHeader $variant="h3">Associated fields</PageHeader>

      <PageText>
        {associatedFields.length
          ? "Wellbores from these fields are available in wellbore mappings. These fields are not part of the project masterdata."
          : "If you need to map wellbores from other SMDA fields, add those fields here. Their wellbores will be available in wellbore mappings. These fields will not be part of the project masterdata."}
      </PageText>

      {associatedFields.length > 0 && (
        <MasterdataInfoBox>
          <table>
            <tbody>
              <tr>
                <th>Associated fields</th>
                <td>
                  <ChipsContainer>
                    {sortFields(associatedFields).map((field) => (
                      <InfoChip key={field.uuid}>{field.identifier}</InfoChip>
                    ))}
                  </ChipsContainer>
                </td>
              </tr>
            </tbody>
          </table>
        </MasterdataInfoBox>
      )}

      {editMode && smdaHealthStatus && (
        <GeneralButton
          label={associatedFields.length ? "Edit" : "Add"}
          disabled={projectReadOnly || !projectFields.length}
          tooltipText={
            projectReadOnly
              ? "Project is read-only"
              : !projectFields.length
                ? "Add masterdata before adding associated fields"
                : ""
          }
          onClick={() => {
            setEditDialogOpen(true);
          }}
        />
      )}

      {editDialogOpen && (
        <AssociatedFieldsDialog
          projectFields={projectFields}
          associatedFields={associatedFields}
          projectReadOnly={projectReadOnly}
          closeDialog={() => {
            setEditDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
