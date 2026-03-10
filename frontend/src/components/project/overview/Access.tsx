import {
  Dialog,
  Icon,
  InputWrapper,
  List,
  Radio,
  Tooltip,
  Typography,
} from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import type { FmuProject } from "#client";
import {
  projectGetProjectQueryKey,
  projectGetSumoAssetsOptions,
  projectPatchAccessMutation,
} from "#client/@tanstack/react-query.gen";
import type { Access, Classification, SumoAsset } from "#client/types.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { AutocompleteField, TextField } from "#components/form/field";
import {
  EditDialog,
  InfoBox,
  PageCode,
  PageHeader,
  PageList,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  httpValidationErrorToString,
} from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { stringCompare } from "#utils/string";
import { requiredStringValidator } from "#utils/validator";

type AccessEditorProps = {
  accessData: Access | null | undefined;
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
};

const { useAppForm: useAppFormAccessEditor } = createFormHook({
  fieldComponents: {
    TextField,
    AutocompleteField,
    Radio,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});

function AccessEditor({
  accessData,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: AccessEditorProps) {
  const { data: sumoAssets } = useQuery({
    ...projectGetSumoAssetsOptions(),
    enabled: isDialogOpen,
  });

  return (
    sumoAssets && (
      <AccessEditorForm
        accessData={accessData}
        sumoAssets={sumoAssets}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    )
  );
}

function AccessEditorForm({
  accessData,
  sumoAssets,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: AccessEditorProps & {
  sumoAssets: SumoAsset[];
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
    onError: (error) => {
      if (error.response?.status === HTTP_STATUS_UNPROCESSABLE_CONTENT) {
        const message = httpValidationErrorToString(error);
        console.error(message);
        toast.error(message);
      }
    },
    meta: {
      errorPrefix: "Error saving access information",
      preventDefaultErrorHandling: [HTTP_STATUS_UNPROCESSABLE_CONTENT],
    },
  });

  const assetName = accessData?.asset.name ?? "";
  const assetInAvailable = sumoAssets.some((asset) => asset.name === assetName);

  const form = useAppFormAccessEditor({
    defaultValues: {
      assetName: assetInAvailable ? assetName : "",
      manualAssetName: assetInAvailable ? "" : assetName,
      classification: accessData?.classification ?? "",
    },
    validators: {
      onChange: ({ value }) =>
        value.manualAssetName.trim() || value.assetName.trim()
          ? undefined
          : {
              fields: {
                assetName: "Asset name is required",
              },
            },
    },
    onSubmit: ({ value, formApi }) => {
      const assetName = value.manualAssetName.trim() || value.assetName.trim();

      mutate(
        {
          body: {
            asset: { name: assetName },
            classification: value.classification as Classification,
          },
        },
        {
          onSuccess: () => {
            toast.info("Successfully set access information");
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  return (
    <EditDialog open={isDialogOpen} $minWidth="25em">
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
          <form.Subscribe selector={(state) => [state.values]}>
            {([formValues]) => (
              <>
                <form.AppField name="assetName">
                  {(field) => (
                    <field.AutocompleteField
                      label="Select Sumo target asset"
                      options={sumoAssets
                        .map((asset) => asset.name)
                        .sort((a, b) => stringCompare(a, b))}
                      noOptionsText="No assets found"
                      disabled={!!formValues.manualAssetName}
                      helperText="Newly onboarded assets may not exist in the list yet"
                    />
                  )}
                </form.AppField>

                <PageSectionSpacer />

                <form.AppField name="manualAssetName">
                  {(field) => (
                    <field.TextField
                      label="Alternatively, enter asset manually"
                      disabled={!!formValues.assetName}
                    />
                  )}
                </form.AppField>
              </>
            )}
          </form.Subscribe>

          <PageSectionSpacer />

          <form.AppField
            name="classification"
            validators={{ onChange: requiredStringValidator() }}
          >
            {(field) => (
              <InputWrapper
                label="Default security classification"
                color="error"
                helperProps={{
                  text: !field.state.meta.isValid ? "Required" : "",
                  icon: <Icon name="error_filled" size={16} />,
                }}
              >
                {["internal", "restricted"].map((option) => (
                  <Tooltip
                    key={option}
                    title={
                      option === "internal"
                        ? "Requires READ access to the asset"
                        : "Requires WRITE access to the asset"
                    }
                  >
                    <span>
                      <Radio
                        label={option}
                        checked={field.state.value === option}
                        onChange={() => {
                          field.handleChange(option);
                        }}
                      />
                    </span>
                  </Tooltip>
                ))}
              </InputWrapper>
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

export function AccessInfo({ accessData }: { accessData: Access }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Sumo target asset</th>
            <td>{accessData.asset.name}</td>
          </tr>
          <tr>
            <th>Default classification</th>
            <td>{accessData.classification}</td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function EditableAccessInfo({
  projectData,
  projectReadOnly,
}: {
  projectData: FmuProject;
  projectReadOnly: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const accessData = projectData.config.access;

  return (
    <>
      <PageHeader $variant="h3">Access control</PageHeader>

      <PageText>
        This section is used to configure access permissions for data exported
        from the project.
      </PageText>

      <PageText>
        The <i>asset</i> specifies the target asset in Sumo where data will be
        uploaded. The <i>classification</i> sets the default information
        classification for the data.
      </PageText>

      <PageList>
        <List.Item>
          internal - requires <i>READ</i> access to the asset
        </List.Item>
        <List.Item>
          restricted - requires <i>WRITE</i> access to the asset
        </List.Item>
      </PageList>

      <PageText>
        Read more about access control in the{" "}
        <Typography
          link
          target="_blank"
          rel="noopener noreferrer"
          href="https://fmu-docs.equinor.com/docs/sumo/documentation/access_control/"
        >
          Sumo documentation
        </Typography>
        .
      </PageText>

      {accessData ? (
        <AccessInfo accessData={accessData} />
      ) : (
        <PageCode>No access information found in the project</PageCode>
      )}

      <GeneralButton
        label={accessData ? "Edit" : "Add"}
        disabled={projectReadOnly}
        tooltipText={projectReadOnly ? "Project is read-only" : ""}
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      <AccessEditor
        accessData={accessData}
        projectReadOnly={projectReadOnly}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </>
  );
}
