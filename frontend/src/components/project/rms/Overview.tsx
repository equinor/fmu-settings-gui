import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import type { RmsProject } from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectGetRmsProjectsOptions,
  projectGetRmsProjectsQueryKey,
  projectPatchRmsMutation,
  rmsDeleteRmsProjectMutation,
  rmsGetHorizonsQueryKey,
  rmsGetZonesQueryKey,
  rmsPostRmsProjectMutation,
  sessionGetSessionQueryKey,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { type OptionProps, Select } from "#components/form/field";
import { rmsMinimumVersion } from "#config";
import {
  ActionButtonsContainer,
  EditDialog,
  InfoBox,
  PageCode,
  PageSectionSpacer,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { getRmsProjectName } from "#utils/model";
import { isVersionLessThan } from "#utils/string";

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
      void queryClient.invalidateQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
    },
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message, { autoClose: false });
      }
    },
    meta: {
      errorPrefix: "Error saving the RMS project",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
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
                helperTextDisabled="Value can be saved when it has been changed and is valid"
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

function RmsProjectActions({
  rmsData,
  projectReadOnly: projectIsReadOnly,
  isRmsProjectOpen,
}: {
  rmsData: RmsProject | null | undefined;
  projectReadOnly: boolean | undefined;
  isRmsProjectOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectProjectDialogOpen, setSelectProjectDialogOpen] = useState(false);

  const useRmsVersion =
    rmsData && isVersionLessThan(rmsData.version, rmsMinimumVersion)
      ? rmsMinimumVersion
      : undefined;

  const projectOpenMutation = useMutation({
    ...rmsPostRmsProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: rmsGetHorizonsQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: rmsGetZonesQueryKey(),
      });
    },
    onError: (error, variables) => {
      if (error.response?.status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
        const message = (error.response.data as { detail?: string }).detail;

        // If version was specified, retry without to use actual version
        if (
          variables.body?.version &&
          message?.includes("RMS version") &&
          message.includes("is not supported")
        ) {
          projectOpenMutation.mutate({});

          return;
        }

        console.error(message);
        toast.error(message, { autoClose: false });
      }
    },
    meta: {
      errorPrefix: "Error accessing the RMS project",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const projectCloseMutation = useMutation({
    ...rmsDeleteRmsProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
    },
    meta: {
      errorPrefix: "Error closing the RMS project",
    },
  });

  return (
    <>
      {rmsData?.path &&
        (projectOpenMutation.isPending ? (
          <PageText>
            ⏳ Accessing the RMS project. This might take a while...
          </PageText>
        ) : isRmsProjectOpen ? (
          <PageText>✅ The RMS project is ready for access</PageText>
        ) : (
          <PageText>⛔ The RMS project is not ready for access</PageText>
        ))}

      <ActionButtonsContainer>
        <GeneralButton
          label={rmsData?.path ? "Change RMS project" : "Select RMS project"}
          disabled={
            !!projectIsReadOnly ||
            isRmsProjectOpen ||
            projectOpenMutation.isPending
          }
          tooltipText={
            projectIsReadOnly
              ? "Project is read-only"
              : isRmsProjectOpen
                ? "Close the RMS project to select a new one"
                : ""
          }
          onClick={() => {
            void queryClient.invalidateQueries({
              queryKey: projectGetRmsProjectsQueryKey(),
            });
            setSelectProjectDialogOpen(true);
          }}
        />

        {rmsData?.path && (
          <>
            <GeneralButton
              label={
                isRmsProjectOpen ? "Reload RMS project" : "Access RMS project"
              }
              isPending={projectOpenMutation.isPending}
              disabled={projectCloseMutation.isPending}
              variant={isRmsProjectOpen ? "outlined" : "contained"}
              onClick={() => {
                projectOpenMutation.mutate({
                  body: useRmsVersion ? { version: useRmsVersion } : undefined,
                });
              }}
            />

            {isRmsProjectOpen && !projectOpenMutation.isPending && (
              <GeneralButton
                label="Close RMS access"
                variant="outlined"
                isPending={projectCloseMutation.isPending}
                onClick={() => {
                  projectCloseMutation.mutate({});
                }}
              />
            )}
          </>
        )}
      </ActionButtonsContainer>

      <RmsEditorForm
        rmsData={rmsData}
        isDialogOpen={selectProjectDialogOpen}
        setIsDialogOpen={setSelectProjectDialogOpen}
      />
    </>
  );
}

export function Overview({
  rmsData,
  projectReadOnly,
  isRmsProjectOpen,
}: {
  rmsData: RmsProject | null | undefined;
  projectReadOnly: boolean;
  isRmsProjectOpen: boolean;
}) {
  return (
    <PageSectionWidthConstrained>
      <PageText>
        The following is the main RMS project located in the <i>rms/model</i>{" "}
        directory. The version is detected automatically:
      </PageText>

      {rmsData ? (
        <RmsInfo rmsData={rmsData} />
      ) : (
        <PageCode>No RMS project information found in the project.</PageCode>
      )}

      <RmsProjectActions
        rmsData={rmsData}
        projectReadOnly={projectReadOnly}
        isRmsProjectOpen={isRmsProjectOpen}
      />

      <PageSectionSpacer />
    </PageSectionWidthConstrained>
  );
}
