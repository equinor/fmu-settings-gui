import {
  Button,
  Dialog,
  Icon,
  InputWrapper,
  NativeSelect,
} from "@equinor/eds-core-react";
import { error_filled, folder_open } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import {
  projectGetProjectQueryKey,
  projectInitProjectMutation,
  projectPostProjectMutation,
  userGetUserOptions,
} from "#client/@tanstack/react-query.gen";
import { SubmitButton, TextField } from "#components/form";
import { PageSectionSpacer, PageText } from "#styles/common";
import { fieldContext, formContext, useFieldContext } from "#utils/form";
import {
  ExpansiveDialog,
  ProjectSelectorFormContainer,
} from "./ProjectSelector.style";

const { useAppForm: useAppFormProjectSelectorForm } = createFormHook({
  fieldComponents: {
    RecentProjectSelectField,
    TextField,
    ConfirmInitProjectDialog,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

function ProjectSelectorForm({
  closeDialog,
  isDialogOpen,
}: {
  closeDialog: () => void;
  isDialogOpen: boolean;
}) {
  const [initConfirmDialogOpen, setInitConfirmDialogOpen] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [helperText, setHelperText] = useState("");

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...projectPostProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
  });
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const form = useAppFormProjectSelectorForm({
    defaultValues: {
      projectPath: "",
      recentProjectPath: "",
    },
    onSubmit: ({ value, formApi }) => {
      const path = value.projectPath || value.recentProjectPath;

      mutate(
        { body: { path } },
        {
          onSuccess: () => {
            toast.info(`Successfully set project ${path}`);
            closeDialog();
            formApi.reset();
          },
          onError: (error) => {
            setHelperText(
              String((error.response?.data as { detail?: unknown }).detail),
            );

            if (error.response?.status === 404 && value.projectPath) {
              setInitConfirmDialogOpen(true);
            }
          },
        },
      );
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    setHelperText("");
  }, [form.state.values.projectPath]);

  return (
    <ExpansiveDialog
      open={isDialogOpen}
      onClose={closeDialog}
      isDismissable={true}
    >
      <Dialog.Header>
        <Dialog.Title>Select project</Dialog.Title>
      </Dialog.Header>
      <Dialog.CustomContent>
        <ProjectSelectorFormContainer>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <InputWrapper
              color="error"
              helperProps={{
                text: helperText,
                icon: <Icon data={error_filled} size={18} />,
              }}
            >
              <form.AppField
                name="recentProjectPath"
                listeners={{
                  onChange: () => {
                    void form.handleSubmit();
                  },
                }}
              >
                {(field) => (
                  <field.RecentProjectSelectField
                    disabledSelect={
                      !!form.state.values.projectPath ||
                      userData.recent_directories.length === 0
                    }
                    recentDirectories={userData.recent_directories}
                  />
                )}
              </form.AppField>
              <PageSectionSpacer />
              <form.AppField name="projectPath">
                {(field) => (
                  <>
                    <field.TextField
                      label="Or enter path to project"
                      setSubmitDisabled={setSubmitDisabled}
                    />
                    <ConfirmInitProjectDialog
                      isOpen={initConfirmDialogOpen}
                      setIsOpen={setInitConfirmDialogOpen}
                      projectPath={field.state.value}
                      closeProjectSelectorDialog={closeDialog}
                    />
                  </>
                )}
              </form.AppField>
            </InputWrapper>
            <PageSectionSpacer />
            <form.AppForm>
              <Dialog.Actions>
                <form.SubmitButton
                  label="Select"
                  disabled={submitDisabled}
                  isPending={isPending}
                />
                <form.CancelButton
                  onClick={() => {
                    closeDialog();
                    form.reset();
                  }}
                />
              </Dialog.Actions>
            </form.AppForm>
          </form>
        </ProjectSelectorFormContainer>
      </Dialog.CustomContent>
    </ExpansiveDialog>
  );
}
function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outlined" color="secondary" type="reset" onClick={onClick}>
      Cancel
    </Button>
  );
}
function RecentProjectSelectField({
  disabledSelect,
  recentDirectories,
}: {
  disabledSelect: boolean;
  recentDirectories: string[];
}) {
  const field = useFieldContext<string>();

  return (
    <InputWrapper
      helperProps={{
        text: "",
      }}
      helperIcon={<Icon data={error_filled} size={18} />}
    >
      <NativeSelect
        label="Select from recent project directories"
        id="recent-project-directories"
        disabled={disabledSelect}
        value={disabledSelect ? [] : [field.state.value]}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          field.handleChange(e.target.value);
        }}
        multiple={true}
      >
        {recentDirectories.map((option) => (
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
  setIsOpen,
  projectPath,
  closeProjectSelectorDialog,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  projectPath: string;
  closeProjectSelectorDialog: () => void;
}) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    ...projectInitProjectMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
  });

  const initializeProject = (path: string) => {
    mutate(
      { body: { path } },
      {
        onSuccess: () => {
          setIsOpen(false);
          closeProjectSelectorDialog();
        },
        onError: () => {
          setIsOpen(false);
        },
      },
    );
  };

  return (
    <ExpansiveDialog open={isOpen}>
      <Dialog.Header>
        <Dialog.Title>Create new FMU settings project</Dialog.Title>
      </Dialog.Header>
      <Dialog.CustomContent>
        No FMU settings project found at project path:
        <PageText bold={true}> {projectPath} </PageText>
        Do you want to create one?
      </Dialog.CustomContent>
      <Dialog.Actions>
        <Button
          onClick={() => {
            initializeProject(projectPath);
          }}
        >
          OK
        </Button>
        <CancelButton
          onClick={() => {
            setIsOpen(false);
          }}
        />
      </Dialog.Actions>
    </ExpansiveDialog>
  );
}

export function ProjectSelector() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpen = () => {
    setIsDialogOpen(true);
  };
  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>
        <Icon data={folder_open} />
        Select project
      </Button>
      <ProjectSelectorForm
        closeDialog={handleClose}
        isDialogOpen={isDialogOpen}
      />
    </>
  );
}
