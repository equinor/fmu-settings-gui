import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { FmuProject, RmsProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectGetRmsProjectsOptions,
  projectPatchRmsMutation,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { OptionProps, Select } from "#components/form/field";
import { EditDialog, InfoBox, PageCode, PageText } from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { getRmsProjectName } from "#utils/model";

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

function getProjectOptionFromPath(path: string) {
  return {
    label: getRmsProjectName(path),
    value: path,
  };
}

function RmsEditorForm({
  rmsData,
  isDialogOpen,
  setIsDialogOpen,
}: {
  rmsData: RmsProject | null | undefined;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const closeDialog = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const queryClient = useQueryClient();

  const { data: RmsProjectOptions, isPending: isRmsProjectOptionsPending } =
    useQuery(projectGetRmsProjectsOptions());

  const { mutate, isPending } = useMutation({
    ...projectPatchRmsMutation(),
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
      errorPrefix: "Error saving the RMS project",
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
            path: value.rmsPath,
          },
        },
        {
          onSuccess: () => {
            toast.info("Successfully set the RMS project");
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  const availableRmsProjects = RmsProjectOptions?.results ?? [];

  function isProjectInAvailable(path: string) {
    return availableRmsProjects.some((option) => option.path === path);
  }

  const projectOptions: OptionProps[] = availableRmsProjects.map((option) =>
    getProjectOptionFromPath(option.path),
  );
  if (!rmsData) {
    projectOptions.unshift({ label: "(none)", value: "" });
  } else if (!isProjectInAvailable(rmsData.path)) {
    projectOptions.unshift(getProjectOptionFromPath(rmsData.path));
  }

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
                availableRmsProjects.length === 0
                  ? "Could not detect any RMS projects in the rms/model directory"
                  : rmsData && !isProjectInAvailable(rmsData.path)
                    ? "Selected project does not exist"
                    : undefined,

              onChange: ({ value }) =>
                !isProjectInAvailable(value)
                  ? "Selected project does not exist"
                  : undefined,
            }}
          >
            {(field) => {
              return (
                <field.Select
                  label="RMS project"
                  value={field.state.value}
                  options={projectOptions}
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
                helperTextDisabled="Value can be submitted when it has been changed and is valid"
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

function RmsInfo({ rmsData }: { rmsData: RmsProject }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Project</th>
            <td>{getRmsProjectName(rmsData.path)}</td>
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

export function Overview({ projectData }: { projectData: FmuProject }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const rmsData = projectData.config.rms;

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
        label={"Select project"}
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
