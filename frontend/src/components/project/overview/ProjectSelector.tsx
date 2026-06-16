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
import { useRouteContext } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetChangelogQueryKey,
  projectGetLockStatusQueryKey,
  projectGetMappingsQueryKey,
  projectGetProjectQueryKey,
  projectGetRmsProjectsQueryKey,
  projectPostInitProjectMutation,
  projectPostProjectMutation,
  sessionGetSessionQueryKey,
  userGetUserOptions,
  userGetUserQueryKey,
} from "#client/@tanstack/react-query.gen";
import { CancelButton, SubmitButton } from "#components/form/button";
import { TextField } from "#components/form/field";
import { mappingsPaths } from "#services/project";
import { EditDialog, PageSectionSpacer, PageText } from "#styles/common";
import {
  HTTP_STATUS_403_FORBIDDEN,
  HTTP_STATUS_404_NOT_FOUND,
  HTTP_STATUS_409_CONFLICT,
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
} from "#utils/api";
import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from "#utils/form";
import {
  queryKeyProjectGetCache,
  queryKeyProjectGetCacheDiff,
  queryKeyProjectGetCacheRevision,
} from "#utils/query";

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
  actionLabel,
  closeDialog,
  isDialogOpen,
}: {
  actionLabel: string;
  closeDialog: () => void;
  isDialogOpen: boolean;
}) {
  const [initConfirmDialogOpen, setInitConfirmDialogOpen] = useState(false);
  const [helperTextRecentProjects, sethelperTextRecentProjects] = useState("");
  const [helperTextProjectPath, setHelperTextProjectPath] = useState("");
  const [valueSource, setValueSource] = useState<ValueSource>("");
  const codes = [
    HTTP_STATUS_403_FORBIDDEN,
    HTTP_STATUS_404_NOT_FOUND,
    HTTP_STATUS_409_CONFLICT,
    HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  ];

  const closeProjectSelector = ({ formReset }: { formReset: () => void }) => {
    sethelperTextRecentProjects("");
    setHelperTextProjectPath("");
    setValueSource("");
    formReset();
    closeDialog();
  };

  const queryClient = useQueryClient();
  const setSelectProjectInvalidAttempt = useRouteContext({
    from: "__root__",
    select: (context) => context.setSelectProjectInvalidAttempt,
  });
  const { mutate, isPending } = useMutation({
    ...projectPostProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      void queryClient.resetQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetMappingsQueryKey({
          path: mappingsPaths.stratigraphyRms,
        }),
      });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as { _id?: string } | undefined;

          return (
            key?._id === queryKeyProjectGetCache ||
            key?._id === queryKeyProjectGetCacheRevision ||
            key?._id === queryKeyProjectGetCacheDiff
          );
        },
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
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionQueryKey(),
      });
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

            if (status === HTTP_STATUS_422_UNPROCESSABLE_CONTENT) {
              void queryClient.invalidateQueries({
                queryKey: projectGetProjectQueryKey(),
              });
              void queryClient.resetQueries({
                queryKey: projectGetChangelogQueryKey(),
              });
              closeProjectSelector({ formReset: formApi.reset });
              setSelectProjectInvalidAttempt((current) => current + 1);

              return;
            }

            if (status && codes.includes(status)) {
              if (
                status === HTTP_STATUS_404_NOT_FOUND &&
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

              if (
                status === HTTP_STATUS_404_NOT_FOUND &&
                detail === `Path ${path} does not exist`
              ) {
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
          <Dialog.Title>{actionLabel}</Dialog.Title>
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
                <field.TextField label="Alternatively, enter a path to the project" />
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
            <form.Subscribe>
              {(state) => (
                <form.SubmitButton
                  label="Select"
                  disabled={state.isDefaultValue || !state.canSubmit}
                  isPending={isPending}
                  helperTextDisabled="Select a recent project or enter a valid project path"
                />
              )}
            </form.Subscribe>
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
      void queryClient.resetQueries({
        queryKey: projectGetChangelogQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: projectGetMappingsQueryKey({
          path: mappingsPaths.stratigraphyRms,
        }),
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
  hasSelectedProject = false,
}: {
  hasSelectedProject?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const actionLabel = hasSelectedProject ? "Change project" : "Select project";

  const handleOpen = () => {
    setIsDialogOpen(true);
  };
  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>{actionLabel}</Button>
      <ProjectSelectorForm
        actionLabel={actionLabel}
        closeDialog={handleClose}
        isDialogOpen={isDialogOpen}
      />
    </>
  );
}
