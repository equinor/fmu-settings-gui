import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import type { FmuProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchModelMutation,
} from "#client/@tanstack/react-query.gen";
import type { Model } from "#client/types.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { TextField } from "#components/form/field";
import {
  EditDialog,
  InfoBox,
  PageCode,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { requiredStringValidator } from "#utils/validator";

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
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: {
  modelData: Model | null | undefined;
  projectReadOnly: boolean;
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
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message);
      }
    },
    meta: {
      errorPrefix: "Error saving model information",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  const form = useAppFormModelEditor({
    defaultValues: {
      modelName: modelData?.name ?? "",
      modelRevision: modelData?.revision ?? "",
      modelDescription: modelData?.description
        ? modelData.description.join("\n") // The description is an array of strings.
        : "",
    },

    onSubmit: ({ value, formApi }) => {
      mutate(
        {
          body: {
            name: value.modelName.trim(),
            revision: value.modelRevision.trim(),
            description: value.modelDescription
              ? [value.modelDescription.trim()]
              : undefined,
          },
        },
        {
          onSuccess: () => {
            toast.info("Successfully set model information");
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  return (
    <EditDialog open={isDialogOpen} $minWidth="32em">
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
          <form.AppField
            name="modelName"
            validators={{
              onBlur: requiredStringValidator(),
            }}
          >
            {(field) => <field.TextField label="Name" />}
          </form.AppField>

          <PageSectionSpacer />

          <form.AppField
            name="modelRevision"
            validators={{
              onBlur: requiredStringValidator(),
            }}
          >
            {(field) => <field.TextField label="Revision" />}
          </form.AppField>

          <PageSectionSpacer />

          <form.AppField name="modelDescription">
            {(field) => (
              <field.TextField label="Description" multiline={true} rows={5} />
            )}
          </form.AppField>
        </Dialog.Content>

        <Dialog.Actions>
          <form.Subscribe
            selector={(state) => [state.isDefaultValue, state.canSubmit]}
          >
            {([isDefaultValue, canSubmit]) => (
              <form.SubmitButton
                label="Save"
                disabled={isDefaultValue || !canSubmit || projectReadOnly}
                isPending={isPending}
                helperTextDisabled={
                  projectReadOnly ? "Project is read-only" : undefined
                }
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
    </EditDialog>
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
            <td>{modelData.revision}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>
              {modelData.description ? (
                <span className="multilineValue">{modelData.description}</span>
              ) : (
                <span className="missingValue">none</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function EditableModelInfo({
  projectData,
  projectReadOnly,
}: {
  projectData: FmuProject;
  projectReadOnly: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const modelData = projectData.config.model;

  return (
    <>
      <PageHeader $variant="h3">Model</PageHeader>

      <PageText>This section contains information about the model.</PageText>

      <PageText>
        Each model needs a <i>name</i> and <i>revision</i>, usually matching
        your project's directory structure. For example, for the project path
        /project/field/resmod/ff/25.0.0/ the name would be <i>ff</i> and the
        revision <i>25.0.0</i>.
      </PageText>

      {modelData ? (
        <ModelInfo modelData={modelData} />
      ) : (
        <PageCode>No model information found in the project.</PageCode>
      )}

      <GeneralButton
        label={modelData ? "Edit" : "Add"}
        disabled={projectReadOnly}
        tooltipText={projectReadOnly ? "Project is read-only" : ""}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      <ModelEditorForm
        modelData={modelData}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
}
