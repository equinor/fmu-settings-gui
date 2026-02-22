import {
  Button,
  Dialog,
  Icon,
  InputWrapper,
  NativeSelect,
} from "@equinor/eds-core-react";
import { error_filled } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetLockStatusQueryKey,
  projectGetProjectQueryKey,
  projectGetRmsProjectsQueryKey,
  projectPostInitProjectMutation,
  projectPostProjectMutation,
  userGetUserOptions,
  userGetUserQueryKey,
} from "#client/@tanstack/react-query.gen";
import { CancelButton, SubmitButton } from "#components/form/button";
import { TextField } from "#components/form/field";
import { EditDialog, PageSectionSpacer, PageText } from "#styles/common";
import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from "#utils/form";
import {
  removeStorageItem,
  STORAGENAME_RMS_PROJECT_OPEN,
} from "#utils/storage";

const { useAppForm: useAppFormProjectSelectorForm } = createFormHook({
  fieldComponents: {
    RecentProjectSelect,
    TextField,
  },
  formComponents: {
    ConfirmInitProjectDialog,
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

type ValueSource = "recentProjectPath" | "projectPath" | "";

function ProjectSelectorForm({
  projectReadOnly,
  closeDialog,
  isDialogOpen,
}: {
  projectReadOnly: boolean;
  closeDialog: () => void;
  isDialogOpen: boolean;
}) {
  const [initConfirmDialogOpen, setInitConfirmDialogOpen] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [helperTextRecentProjects, sethelperTextRecentProjects] = useState("");
  const [helperTextProjectPath, setHelperTextProjectPath] = useState("");
  const [valueSource, setValueSource] = useState<ValueSource>("");
  const codes = [403, 404, 409];

  const closeProjectSelector = ({ formReset }: { formReset: () => void }) => {
    sethelperTextRecentProjects("");
    setHelperTextProjectPath("");
    setValueSource("");
    formReset();
    closeDialog();
  };

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...projectPostProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetLockStatusQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetRmsProjectsQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: userGetUserQueryKey(),
      });
      removeStorageItem(sessionStorage, STORAGENAME_RMS_PROJECT_OPEN);
    },
    meta: {
      preventDefaultErrorHandling: codes,
    },
  });
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const form = useAppFormProjectSelectorForm({
    defaultValues: {
      projectPath: "",
      recentProjectPath: "",
    },
    onSubmit: ({ value, formApi }) => {
      const path =
        valueSource === "recentProjectPath"
          ? value.recentProjectPath
          : value.projectPath;

      mutate(
        { body: { path } },
        {
          onSuccess: () => {
            toast.info(`Successfully set project ${path}`);
            closeProjectSelector({ formReset: formApi.reset });
          },
          onError: (error) => {
            const detail = (error.response?.data as { detail: string }).detail;
            const status = error.status;

            if (status && codes.includes(status)) {
              if (
                status === 404 &&
                detail === `No .fmu directory found at ${path}`
              ) {
                setInitConfirmDialogOpen(true);

                return;
              }

              if (valueSource === "recentProjectPath") {
                sethelperTextRecentProjects(detail);
              } else if (valueSource === "projectPath") {
                setHelperTextProjectPath(detail);
              }

              if (status === 404 && detail === `Path ${path} does not exist`) {
                void queryClient.invalidateQueries({
                  queryKey: userGetUserQueryKey(),
                });
                if (valueSource === "recentProjectPath") {
                  formApi.resetField("recentProjectPath");
                  setValueSource("projectPath");
                }
              }
            }
          },
        },
      );
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset project path helper text whenever projectPath changes
  useEffect(() => {
    setHelperTextProjectPath("");
  }, [form.state.values.projectPath]);

  return (
    <EditDialog open={isDialogOpen} $minWidth="40em">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Dialog.Header>
          <Dialog.Title>Select project</Dialog.Title>
        </Dialog.Header>

        <Dialog.CustomContent>
          <form.AppField
            name="recentProjectPath"
            listeners={{
              onBlur: () => {
                sethelperTextRecentProjects("");
              },
              onChange: () => {
                setValueSource("recentProjectPath");
                void form.handleSubmit();
              },
            }}
          >
            {(field) => (
              <field.RecentProjectSelect
                recentProjects={userData.recent_project_directories}
                helperText={helperTextRecentProjects}
              />
            )}
          </form.AppField>

          <PageSectionSpacer />

          <form.AppField
            name="projectPath"
            listeners={{
              onBlur: () => {
                setHelperTextProjectPath("");
              },
              onChange: () => {
                setValueSource("projectPath");
              },
            }}
          >
            {(field) => (
              <InputWrapper
                color="error"
                helperProps={{
                  text: helperTextProjectPath,
                  icon: <Icon data={error_filled} size={16} />,
                }}
              >
                <field.TextField
                  label="Alternatively, enter a path to the project"
                  setSubmitDisabled={setSubmitDisabled}
                />
              </InputWrapper>
            )}
          </form.AppField>

          <form.AppForm>
            <form.ConfirmInitProjectDialog
              isOpen={initConfirmDialogOpen}
              closeDialog={() => {
                setInitConfirmDialogOpen(false);
              }}
              valueSource={valueSource}
            />
          </form.AppForm>
        </Dialog.CustomContent>

        <Dialog.Actions>
          <form.AppForm>
            <form.SubmitButton
              label="Select"
              disabled={submitDisabled || projectReadOnly}
              isPending={isPending}
              helperTextDisabled={
                projectReadOnly ? "Project is read-only" : undefined
              }
            />
            <form.CancelButton
              onClick={() => {
                closeProjectSelector({ formReset: form.reset });
              }}
            />
          </form.AppForm>
        </Dialog.Actions>
      </form>
    </EditDialog>
  );
}

function RecentProjectSelect({
  recentProjects,
  helperText,
}: {
  recentProjects: string[];
  helperText: string;
}) {
  const field = useFieldContext<string>();
  const disabledSelect = recentProjects.length === 0;

  return (
    <InputWrapper
      color="error"
      helperProps={{
        text: helperText,
        icon: <Icon data={error_filled} size={16} />,
      }}
    >
      <NativeSelect
        label="Select from recent projects"
        id="recent-projects"
        size={5}
        disabled={disabledSelect}
        value={disabledSelect ? [] : [field.state.value]}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          field.handleChange(e.target.value);
        }}
        onBlur={() => {
          field.handleBlur();
        }}
        multiple={true}
      >
        {recentProjects.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect>
    </InputWrapper>
  );
}

function ConfirmInitProjectDialog({
  isOpen,
  closeDialog,
  valueSource,
}: {
  isOpen: boolean;
  closeDialog: () => void;
  valueSource: string;
}) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    ...projectPostInitProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: userGetUserQueryKey(),
      });
    },
  });

  const form = useFormContext();
  const projectPath =
    valueSource === "projectPath"
      ? form.store.state.values.projectPath
      : form.store.state.values.recentProjectPath;

  const initializeProject = (path: string) => {
    mutate(
      { body: { path } },
      {
        onSuccess: () => {
          closeDialog();
          void form.handleSubmit();
        },
        onError: () => {
          closeDialog();
        },
      },
    );
  };

  return (
    <EditDialog open={isOpen}>
      <Dialog.Header>
        <Dialog.Title>Initialize project</Dialog.Title>
      </Dialog.Header>
      <Dialog.CustomContent>
        <PageText bold={true}> {projectPath} </PageText>
        <PageText>
          This project needs to be initialized to use FMU settings.
          <br />
          Would you like to initialize?
        </PageText>
      </Dialog.CustomContent>
      <Dialog.Actions>
        <Button
          onClick={() => {
            initializeProject(projectPath);
          }}
        >
          OK
        </Button>
        <CancelButton onClick={closeDialog} />
      </Dialog.Actions>
    </EditDialog>
  );
}

export function ProjectSelector({
  projectReadOnly,
}: {
  projectReadOnly: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpen = () => {
    setIsDialogOpen(true);
  };
  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>Select project</Button>
      <ProjectSelectorForm
        projectReadOnly={projectReadOnly}
        closeDialog={handleClose}
        isDialogOpen={isDialogOpen}
      />
    </>
  );
}
