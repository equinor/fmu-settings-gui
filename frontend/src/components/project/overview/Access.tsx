import { Dialog, Icon, InputWrapper, Radio } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { FmuProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchAccessMutation,
} from "#client/@tanstack/react-query.gen";
import { Access } from "#client/types.gen";
import { Classification } from "#client/types.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { TextField } from "#components/form/field";
import {
  ExpansiveDialog,
  InfoBox,
  InfoChip,
  PageCode,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { fieldContext, formContext } from "#utils/form";
import { requiredStringValidator } from "#utils/validator";
import { AccessFormContentContainer } from "./Access.style";

const { useAppForm: useAppFormAccessEditor } = createFormHook({
  fieldComponents: {
    TextField,
    Radio,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

function AccessEditorForm({
  accessData,
  isDialogOpen,
  setIsDialogOpen,
}: {
  accessData: Access | null | undefined;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const closeDialog = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...projectPatchAccessMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
  });

  const form = useAppFormAccessEditor({
    defaultValues: {
      assetName: accessData?.asset.name ?? "",
      classification: accessData?.classification ?? "",
    },

    onSubmit: ({ value, formApi }) => {
      mutate(
        {
          body: {
            asset: { name: value.assetName.trim() },
            classification: value.classification as Classification,
          },
        },
        {
          onSuccess: () => {
            toast.info(`Successfully set Access information`);
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  return (
    <ExpansiveDialog open={isDialogOpen} isDismissable={false}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Dialog.Header>
          <Dialog.Title>Access</Dialog.Title>
        </Dialog.Header>

        <Dialog.Content>
          <AccessFormContentContainer />
          <form.AppField
            name="assetName"
            validators={{ onBlur: requiredStringValidator() }}
          >
            {(field) => (
              <field.TextField label="Asset" placeholder="Enter asset name" />
            )}
          </form.AppField>

          <PageSectionSpacer />

          <form.AppField
            name="classification"
            validators={{ onChange: requiredStringValidator() }}
          >
            {(field) => (
              <InputWrapper
                label="Default Security Classification"
                color="error"
                helperProps={{
                  text: !field.state.meta.isValid ? "Required" : "",
                  icon: <Icon name="error_filled" size={16} />,
                }}
              >
                {["restricted", "internal"].map((option) => (
                  <Radio
                    key={option}
                    label={option}
                    checked={field.state.value === option}
                    onChange={() => {
                      field.handleChange(option);
                    }}
                  />
                ))}
              </InputWrapper>
            )}
          </form.AppField>
          <AccessFormContentContainer />
        </Dialog.Content>

        <Dialog.Actions>
          <form.Subscribe
            selector={(state) => [state.isDefaultValue, state.canSubmit]}
          >
            {([isDefaultValue, canSubmit]) => (
              <form.SubmitButton
                label="Save"
                disabled={isDefaultValue || !canSubmit}
                isPending={isPending}
              />
            )}
          </form.Subscribe>
          <form.CancelButton
            onClick={(e) => {
              e.preventDefault();
              closeDialog({ formReset: form.reset });
            }}
          />
        </Dialog.Actions>
      </form>
    </ExpansiveDialog>
  );
}

export function AccessInfo({ accessData }: { accessData: Access }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Asset</th>
            <td>{accessData.asset.name}</td>
          </tr>
          <tr>
            <th>Classification</th>
            <td>
              <InfoChip>{accessData.classification}</InfoChip>
            </td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function EditableAccessInfo({
  projectData,
}: {
  projectData: FmuProject;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const accessData = projectData.config.access;

  return (
    <>
      <PageHeader $variant="h4">Access</PageHeader>
      <PageText>
        This section is used to configure access permissions for data exported
        from the project.
        <br />
        The asset specifies which existing asset in Sumo the exported data will
        be uploaded to. The classification determines the default security level
        for your exported data.
      </PageText>

      {accessData ? (
        <AccessInfo accessData={accessData} />
      ) : (
        <PageCode>No access information found in the project</PageCode>
      )}

      <GeneralButton
        label={accessData ? "Edit" : "Add"}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      <AccessEditorForm
        accessData={accessData}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
}
