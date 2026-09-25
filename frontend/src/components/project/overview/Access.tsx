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
import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import type { FmuProject } from "#client";
import {
  projectGetChangelogQueryKey,
  projectGetProjectQueryKey,
  projectGetSumoAssetsOptions,
  projectPatchAccessMutation,
  projectPostSumoLoginMutation,
} from "#client/@tanstack/react-query.gen";
import type { Access, Classification, SumoAsset } from "#client/types.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { AutocompleteField } from "#components/form/field";
import {
  EditDialog,
  InfoBox,
  PageCode,
  PageHeader,
  PageList,
  PageSectionSpacer,
  PageText,
  WarningBox,
} from "#styles/common";
import {
  HTTP_STATUS_422_UNPROCESSABLE_CONTENT,
  HTTP_STATUS_424_FAILED_DEPENDENCY,
  HTTP_STATUS_502_BAD_GATEWAY,
  HTTP_STATUS_503_SERVICE_UNAVAILABLE,
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

function getErrorDetail(error: Error | null, fallback: string) {
  const responseData: unknown = isAxiosError(error)
    ? error.response?.data
    : undefined;

  if (
    responseData !== null &&
    typeof responseData === "object" &&
    "detail" in responseData
  ) {
    return String(responseData.detail);
  }

  return fallback;
}

function SumoAssetsInfo({
  sumoAssetsLoaded,
  isLoading,
  loginRequired,
  errorText,
  loginPending,
  loginToSumo,
  retrySumoAssets,
}: {
  sumoAssetsLoaded: boolean;
  isLoading: boolean;
  loginRequired: boolean;
  errorText: string;
  loginPending: boolean;
  loginToSumo: () => void;
  retrySumoAssets: () => void;
}) {
  if (sumoAssetsLoaded || isLoading) {
    return null;
  }

  return (
    <>
      <PageSectionSpacer />

      <WarningBox>
        <PageText>Required data for Sumo assets is not present:</PageText>

        <PageCode>{errorText}</PageCode>

        {loginRequired ? (
          <PageText>
            ⛔ A valid Sumo <strong>access token</strong> is not present, please
            log in:{" "}
            <GeneralButton
              label="Log in"
              isPending={loginPending}
              disabled={loginPending}
              onClick={loginToSumo}
            />
          </PageText>
        ) : (
          <PageText>
            Try to load the Sumo assets again:{" "}
            <GeneralButton label="Retry" onClick={retrySumoAssets} />
          </PageText>
        )}
      </WarningBox>
    </>
  );
}

function AccessEditor({
  accessData,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: AccessEditorProps) {
  const sumoAssetsQuery = useQuery({
    ...projectGetSumoAssetsOptions(),
    enabled: isDialogOpen,
    retry: (failureCount, queryError) =>
      !(
        isAxiosError(queryError) &&
        [
          HTTP_STATUS_424_FAILED_DEPENDENCY,
          HTTP_STATUS_502_BAD_GATEWAY,
          HTTP_STATUS_503_SERVICE_UNAVAILABLE,
        ].includes(queryError.response?.status ?? 0)
      ) && failureCount < 3,
    meta: {
      errorPrefix: "Error getting Sumo assets",
      preventDefaultErrorHandling: [
        HTTP_STATUS_424_FAILED_DEPENDENCY,
        HTTP_STATUS_502_BAD_GATEWAY,
        HTTP_STATUS_503_SERVICE_UNAVAILABLE,
      ],
    },
  });
  const sumoLoginMutation = useMutation({
    ...projectPostSumoLoginMutation(),
    onSuccess: () => {
      void sumoAssetsQuery.refetch();
    },
    meta: {
      errorPrefix: "Error logging in to Sumo",
      preventDefaultErrorHandling: [
        HTTP_STATUS_424_FAILED_DEPENDENCY,
        HTTP_STATUS_503_SERVICE_UNAVAILABLE,
      ],
    },
  });

  if (!isDialogOpen) {
    return null;
  }

  const errorStatus = isAxiosError(sumoAssetsQuery.error)
    ? sumoAssetsQuery.error.response?.status
    : undefined;
  const loginRequired = errorStatus === HTTP_STATUS_424_FAILED_DEPENDENCY;
  const isLoading = sumoAssetsQuery.isFetching;
  const sumoAssetsLoaded =
    sumoAssetsQuery.data !== undefined &&
    !sumoAssetsQuery.isFetching &&
    !sumoAssetsQuery.isError;
  const errorText = sumoLoginMutation.error
    ? getErrorDetail(sumoLoginMutation.error, "Sumo login failed")
    : getErrorDetail(sumoAssetsQuery.error, "Unable to get assets from Sumo");

  return (
    <AccessEditorForm
      accessData={accessData}
      sumoAssets={sumoAssetsQuery.data ?? []}
      sumoAssetsLoaded={sumoAssetsLoaded}
      isLoading={isLoading}
      loginRequired={loginRequired}
      errorText={errorText}
      loginPending={sumoLoginMutation.isPending}
      loginToSumo={() => {
        sumoLoginMutation.mutate({});
      }}
      retrySumoAssets={() => {
        void sumoAssetsQuery.refetch();
      }}
      projectReadOnly={projectReadOnly}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
    />
  );
}

function AccessEditorForm({
  accessData,
  sumoAssets,
  sumoAssetsLoaded,
  isLoading,
  loginRequired,
  errorText,
  loginPending,
  loginToSumo,
  retrySumoAssets,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: AccessEditorProps & {
  sumoAssets: SumoAsset[];
  sumoAssetsLoaded: boolean;
  isLoading: boolean;
  loginRequired: boolean;
  errorText: string;
  loginPending: boolean;
  loginToSumo: () => void;
  retrySumoAssets: () => void;
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
      errorPrefix: "Error saving access information",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const assetName = accessData?.asset.name ?? "";
  const availableAssetNames = useMemo(
    () =>
      sumoAssets.map((asset) => asset.name).sort((a, b) => stringCompare(a, b)),
    [sumoAssets],
  );
  const assetInAvailable = availableAssetNames.includes(assetName);
  const assetOptions =
    assetName && !assetInAvailable
      ? [assetName, ...availableAssetNames]
      : availableAssetNames;
  const fieldsDisabled = projectReadOnly || !sumoAssetsLoaded;
  const assetPlaceholder = sumoAssetsLoaded
    ? "Select an asset"
    : isLoading
      ? "Loading assets..."
      : loginRequired
        ? "Log in to load assets"
        : "Assets unavailable";

  const form = useAppFormAccessEditor({
    defaultValues: {
      assetName,
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
            toast.info("Successfully set access information");
            closeDialog({ formReset: formApi.reset });
          },
        },
      );
    },
  });

  useEffect(() => {
    if (sumoAssetsLoaded && form.state.values.assetName.trim() !== "") {
      void form.validateField("assetName", "change");
    }
  }, [form, sumoAssetsLoaded]);

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
          <form.AppField
            name="assetName"
            validators={{
              onChange: ({ value }) =>
                !sumoAssetsLoaded
                  ? undefined
                  : value.trim() === ""
                    ? "Asset name is required"
                    : !availableAssetNames.includes(value)
                      ? "You do not currently have write access to this Sumo asset"
                      : undefined,
            }}
          >
            {(field) => (
              <field.AutocompleteField
                label="Select Sumo target asset"
                options={assetOptions}
                optionValue={(option) => option}
                optionDisabled={(option) =>
                  !availableAssetNames.includes(option)
                }
                noOptionsText="No assets found"
                placeholder={assetPlaceholder}
                disabled={fieldsDisabled}
              />
            )}
          </form.AppField>

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
                        disabled={fieldsDisabled}
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

          <SumoAssetsInfo
            sumoAssetsLoaded={sumoAssetsLoaded}
            isLoading={isLoading}
            loginRequired={loginRequired}
            errorText={errorText}
            loginPending={loginPending}
            loginToSumo={loginToSumo}
            retrySumoAssets={retrySumoAssets}
          />
        </Dialog.Content>

        <Dialog.Actions>
          <form.Subscribe
            selector={(state) =>
              [
                state.isDefaultValue,
                state.canSubmit,
                state.values.assetName,
                state.values.classification,
              ] as const
            }
          >
            {([
              isDefaultValue,
              canSubmit,
              selectedAssetName,
              selectedClassification,
            ]) => (
              <form.SubmitButton
                label="Save"
                disabled={
                  projectReadOnly ||
                  !sumoAssetsLoaded ||
                  selectedAssetName.trim() === "" ||
                  selectedClassification === "" ||
                  isDefaultValue ||
                  !canSubmit
                }
                isPending={isPending}
                helperTextDisabled={
                  projectReadOnly
                    ? "Project is read-only"
                    : !sumoAssetsLoaded
                      ? "Sumo assets must be loaded before saving"
                      : selectedAssetName.trim() === ""
                        ? "Select a Sumo target asset before saving"
                        : selectedClassification === ""
                          ? "Select a default security classification before saving"
                          : isDefaultValue
                            ? "Form can be saved when the values have changed"
                            : undefined
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
        classification for the data. You must have <i>WRITE</i> access to select
        a Sumo target asset.
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
