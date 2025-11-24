import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { FmuProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectGetRmsProjectsOptions,
  projectPatchRmsProjectPathMutation,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { Select } from "#components/form/field";
import { EditDialog, InfoBox, PageCode, PageText } from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";

type RmsData = {
  path: string | null | undefined;
  version: string | null | undefined;
};

const { useAppForm: useAppFormRmsEditor } = createFormHook({
  fieldComponents: {
    Select,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

function RmsEditorForm({
  rmsData,
  isDialogOpen,
  setIsDialogOpen,
}: {
  rmsData: RmsData | null | undefined;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const closeDialog = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...projectPatchRmsProjectPathMutation(),
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
      errorPrefix: "Error saving RMS information",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  const form = useAppFormRmsEditor({
    defaultValues: {
      rmsPath: rmsData?.path ?? "",
    },

    onSubmit: ({ value, formApi }) => {
      mutate(
        {
          body: {
            path: value.rmsPath.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.info("Successfully set RMS information");
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  const {
    data: rmsProjectOptionsResults,
    isPending: isRmsProjectOptionsPending,
  } = useQuery(projectGetRmsProjectsOptions());

  const emptyOption = { label: "(none)", value: "" };

  const rmsProjectOptions = [
    emptyOption,
    ...(rmsProjectOptionsResults?.results.map((option) => ({
      label: option.path.split("rms/model/").pop() ?? option.path,
      value: option.path,
    })) ?? []),
  ];

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
          <Dialog.Title>RMS project</Dialog.Title>
        </Dialog.Header>

        <Dialog.Content>
          <form.AppField
            name="rmsPath"
            validators={{
              onMount: () =>
                rmsProjectOptionsResults?.results.length === 0
                  ? "Could not detect any RMS projects in the rms/model directory"
                  : undefined,
              onChange: ({ value }) =>
                value === "" ? "A project must be selected" : undefined,
            }}
          >
            {(field) => {
              return (
                <field.Select
                  label="RMS project"
                  value={field.state.value}
                  options={rmsProjectOptions}
                  loadingOptions={isRmsProjectOptionsPending}
                  onChange={(value) => {
                    field.handleChange(value);
                  }}
                />
              );
            }}
          </form.AppField>
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
    </EditDialog>
  );
}

function RmsInfo({ rmsData }: { rmsData: RmsData }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Project</th>
            <td>
              {rmsData.path ? (
                (rmsData.path.split("rms/model/").pop() ?? rmsData.path)
              ) : (
                <span className="missingValue">None</span>
              )}
            </td>
          </tr>
          <tr>
            <th>Version</th>
            <td>{rmsData.version}</td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function EditableRmsInfo({ projectData }: { projectData: FmuProject }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const rmsData = projectData.config.rms_project_path
    ? {
        path: projectData.config.rms_project_path,
        version: undefined,
      }
    : undefined;

  return (
    <>
      <PageText>
        The following is the main RMS project located in the <i>rms/model</i>{" "}
        directory. The version is detected automatically:
      </PageText>

      {rmsData ? (
        <RmsInfo rmsData={rmsData} />
      ) : (
        <PageCode>No RMS project information found in the project.</PageCode>
      )}

      <GeneralButton
        label={rmsData ? "Edit" : "Add"}
        disabled={projectData.is_read_only}
        tooltipText={projectData.is_read_only ? "Project is read-only" : ""}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      <RmsEditorForm
        rmsData={rmsData}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
}
