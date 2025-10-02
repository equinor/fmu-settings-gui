import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { FmuProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchModelMutation,
} from "#client/@tanstack/react-query.gen";
import { Model } from "#client/types.gen";
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
import { ModelFormContentContainer } from "./Model.style";

const { useAppForm: useAppFormModelEditor } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

function ModelEditorForm({
  modelData,
  isDialogOpen,
  setIsDialogOpen,
}: {
  modelData: Model | null | undefined;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const closeDialog = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...projectPatchModelMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
  });

  const form = useAppFormModelEditor({
    defaultValues: {
      modelName: modelData?.name ?? "",
      modelRevision: modelData?.revision ?? "",
    },

    onSubmit: ({ value, formApi }) => {
      mutate(
        {
          body: {
            name: value.modelName.trim(),
            revision: value.modelRevision.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.info(`Successfully set Model information`);
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
          <Dialog.Title>Model</Dialog.Title>
        </Dialog.Header>

        <Dialog.Content>
          <ModelFormContentContainer />
          <form.AppField
            name="modelName"
            validators={{
              onBlur: requiredStringValidator(),
            }}
          >
            {(field) => (
              <field.TextField label="Name" placeholder="Enter model name" />
            )}
          </form.AppField>

          <PageSectionSpacer />

          <form.AppField
            name="modelRevision"
            validators={{
              onBlur: requiredStringValidator(),
            }}
          >
            {(field) => (
              <field.TextField
                label="Revision"
                placeholder="Enter model revision"
              />
            )}
          </form.AppField>
          <ModelFormContentContainer />
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

function ModelInfo({ modelData }: { modelData: Model }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <td>{modelData.name}</td>
          </tr>
          <tr>
            <th>Revision</th>
            <td>{<InfoChip>{modelData.revision}</InfoChip>}</td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function EditableModelInfo({
  projectData,
}: {
  projectData: FmuProject;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const modelData = projectData.config.model;

  return (
    <>
      <PageHeader $variant="h4">Model</PageHeader>
      <PageText>This section contains information about the model.</PageText>

      {modelData ? (
        <ModelInfo modelData={modelData} />
      ) : (
        <PageCode>No model information found in the project.</PageCode>
      )}

      <GeneralButton
        label={modelData ? "Edit" : "Add"}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      <ModelEditorForm
        modelData={modelData}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
}
