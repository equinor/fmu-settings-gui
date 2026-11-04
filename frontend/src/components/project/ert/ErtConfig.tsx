import {
  Checkbox,
  NativeSelect,
  TextField,
  Typography,
} from "@equinor/eds-core-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { type ChangeEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";

import type {
  ErtConfigInvalidDetail,
  ErtConfigValidationResult,
  FmuProject,
} from "#client";
import {
  ertGetErtConfigsOptions,
  ertGetErtConfigsQueryKey,
  ertGetErtRmsProjectsOptions,
  ertPostOpenErtGuiMutation,
  ertPostValidateErtConfigMutation,
  ertPutErtConfigMutation,
} from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import {
  ActionButtonsContainer,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { HTTP_STATUS_422_UNPROCESSABLE_CONTENT } from "#utils/api";
import {
  ExperimentTypeContainer,
  FieldGrid,
  FieldGroup,
  FullWidth,
  PredefinedTable,
  Preview,
  ResultBox,
} from "./ErtConfig.style";
import {
  caseDirFromFileName,
  defaultErtConfigValues,
  type ErtConfigValues,
  EXPERIMENT_TYPES,
  type ExperimentType,
  type FieldErrors,
  OPTIONAL_FEATURES,
  type OptionalFeature,
  predefinedRows,
  QUEUE_SYSTEMS,
  type QueueSystem,
  RUNPATH_MODES,
  type RunpathMode,
  renderErtConfig,
  validateValues,
} from "./template";

type ValidationState = {
  fileName: string;
  content: string;
  result: ErtConfigValidationResult;
};

type SetValue = <K extends keyof ErtConfigValues>(
  key: K,
  value: ErtConfigValues[K],
) => void;

function ValueTextField({
  name,
  label,
  values,
  errors,
  setValue,
  helperText,
  readOnly = false,
}: {
  name: keyof ErtConfigValues;
  label: string;
  values: ErtConfigValues;
  errors: FieldErrors;
  setValue: SetValue;
  helperText?: string | undefined;
  readOnly?: boolean;
}) {
  const value = values[name];
  const isNumber = typeof value === "number";
  const error = errors[name];
  const text = error ?? helperText;

  return (
    <TextField
      id={`ert-${name}`}
      label={label}
      type={isNumber ? "number" : "text"}
      value={String(value)}
      readOnly={readOnly}
      {...(error !== undefined && { variant: "error" as const })}
      {...(text !== undefined && { helperText: text })}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        setValue(
          name,
          (isNumber
            ? e.target.value === ""
              ? Number.NaN
              : Number(e.target.value)
            : e.target.value) as ErtConfigValues[typeof name],
        );
      }}
    />
  );
}

function PreviewWithLines({
  content,
  errorLines,
}: {
  content: string;
  errorLines: Set<number>;
}) {
  return (
    <Preview>
      {content.split("\n").map((line, idx) => {
        const lineNumber = idx + 1;

        return (
          <span
            key={`line-${lineNumber}`}
            className={errorLines.has(lineNumber) ? "line error" : "line"}
          >
            <span className="lineNumber">{lineNumber}</span>
            {line}
          </span>
        );
      })}
    </Preview>
  );
}

function ValidationResult({
  validation,
  isCurrent,
}: {
  validation: ValidationState | undefined;
  isCurrent: boolean;
}) {
  if (!validation) {
    return (
      <ResultBox $variant="info">
        The config has not been validated with ERT yet. Validation may take a
        while, as ERT and its plugins are loaded.
      </ResultBox>
    );
  }

  const errors = validation.result.errors ?? [];
  const warnings = validation.result.warnings ?? [];
  const staleText = isCurrent
    ? ""
    : " (the config has changed since it was validated)";

  if (validation.result.valid) {
    return (
      <ResultBox $variant="success">
        ✔ ERT found no errors in {validation.fileName}
        {staleText}.
        {warnings.length > 0 && (
          <ul>
            {warnings.map((w) => (
              <li key={`${w.line}-${w.column}-${w.message}`}>
                Warning{w.line ? ` (line ${w.line})` : ""}: {w.message}
              </li>
            ))}
          </ul>
        )}
      </ResultBox>
    );
  }

  return (
    <ResultBox $variant="danger">
      ✘ ERT found {errors.length} error
      {errors.length === 1 ? "" : "s"}
      {staleText}:
      <ul>
        {errors.map((e) => (
          <li key={`${e.line}-${e.column}-${e.message}`}>
            {e.line ? `Line ${e.line}: ` : ""}
            {e.message}
          </li>
        ))}
      </ul>
    </ResultBox>
  );
}

export function ErtConfigEditor({
  projectData,
  projectReadOnly,
}: {
  projectData: FmuProject;
  projectReadOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const initialValues = useMemo(
    () =>
      defaultErtConfigValues({
        rmsPath: projectData.config.rms?.path,
        rmsVersion: projectData.config.rms?.version,
      }),
    [projectData.config.rms?.path, projectData.config.rms?.version],
  );
  const [formValues, setFormValues] = useState<ErtConfigValues>(initialValues);
  const [validation, setValidation] = useState<ValidationState>();
  const [experimentType, setExperimentType] =
    useState<ExperimentType>("uncertainty");

  const { data: rmsProjects } = useQuery(ertGetErtRmsProjectsOptions());
  const { data: existingConfigs } = useQuery(ertGetErtConfigsOptions());

  const selectedRmsProject = rmsProjects?.projects.find(
    (p) => p.name === formValues.rmsName,
  );
  const detectedRmsVersion = selectedRmsProject?.version ?? undefined;
  // The RMS version follows the selected RMS project when it can be detected.
  const values = useMemo(
    () =>
      detectedRmsVersion
        ? { ...formValues, rmsVersion: detectedRmsVersion }
        : formValues,
    [formValues, detectedRmsVersion],
  );

  const fieldErrors = useMemo(() => validateValues(values), [values]);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const content = useMemo(() => renderErtConfig(values), [values]);
  const isCurrent =
    validation?.content === content && validation.fileName === values.fileName;
  const fileExists = existingConfigs?.files.includes(values.fileName) ?? false;

  const errorLines = useMemo(
    () =>
      new Set(
        isCurrent
          ? (validation.result.errors ?? []).flatMap((e) =>
              e.line &&
              (!e.filename || e.filename.endsWith(`/${values.fileName}`))
                ? [e.line]
                : [],
            )
          : [],
      ),
    [isCurrent, validation, values.fileName],
  );

  const rmsNameOptions = useMemo(() => {
    const names = new Set((rmsProjects?.projects ?? []).map((p) => p.name));
    if (values.rmsName) {
      names.add(values.rmsName);
    }

    return [...names].filter(Boolean).sort();
  }, [rmsProjects, values.rmsName]);

  const setValue: SetValue = (key, value) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value };
      // The case name follows the file name until it is edited by the user.
      if (
        key === "fileName" &&
        prev.caseDir === caseDirFromFileName(prev.fileName)
      ) {
        next.caseDir = caseDirFromFileName(next.fileName);
      }

      return next;
    });
  };

  const validateMutation = useMutation({
    ...ertPostValidateErtConfigMutation(),
    meta: { errorPrefix: "Error validating ERT config" },
  });

  const saveMutation = useMutation({
    ...ertPutErtConfigMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ertGetErtConfigsQueryKey(),
      });
    },
    meta: {
      errorPrefix: "Error saving ERT config",
      preventDefaultErrorHandling: [HTTP_STATUS_422_UNPROCESSABLE_CONTENT],
    },
  });

  const validate = () => {
    const request = { fileName: values.fileName, content };
    validateMutation.mutate(
      { body: { name: request.fileName, content: request.content } },
      {
        onSuccess: (result) => {
          setValidation({ ...request, result });
        },
      },
    );
  };

  const save = () => {
    const request = { fileName: values.fileName, content };
    saveMutation.mutate(
      { path: { name: request.fileName }, body: { content: request.content } },
      {
        onSuccess: (result) => {
          setValidation({ ...request, result });
          toast.info(`Saved ert/model/${request.fileName}`);
        },
        onError: (error) => {
          if (
            !isAxiosError(error) ||
            error.response?.status !== HTTP_STATUS_422_UNPROCESSABLE_CONTENT
          ) {
            return;
          }
          const detail = (error.response.data as { detail?: unknown }).detail;
          if (detail && typeof detail === "object" && "validation" in detail) {
            setValidation({
              ...request,
              result: (detail as ErtConfigInvalidDetail).validation,
            });
            toast.error("The ERT config is invalid and was not saved");
          } else {
            toast.error(
              "Error saving ERT config: the request was not accepted",
            );
          }
        },
      },
    );
  };

  const openGuiMutation = useMutation({
    ...ertPostOpenErtGuiMutation(),
    meta: { errorPrefix: "Error opening the ERT GUI" },
  });

  const openGui = () => {
    openGuiMutation.mutate(
      { path: { name: values.fileName } },
      {
        onSuccess: () => {
          toast.info(
            `Opening ert/model/${values.fileName} in the ERT GUI. It may take a moment to appear.`,
          );
        },
      },
    );
  };

  const isBusy = validateMutation.isPending || saveMutation.isPending;
  const saveDisabledReason = projectReadOnly
    ? "Project is read-only"
    : hasFieldErrors
      ? "Fix the errors in the form first"
      : undefined;

  const fieldProps = { values, errors: fieldErrors, setValue };

  return (
    <>
      <PageText>
        Generate an ERT config file in <i>ert/model</i> for running an
        uncertainty set-up with RMS. Define the values below; the predefined
        values are set by FMU standards. The config is validated with ERT before
        it is saved.
      </PageText>

      <ExperimentTypeContainer>
        <NativeSelect
          id="ert-experimentType"
          label="Experiment type"
          value={experimentType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setExperimentType(e.target.value as ExperimentType);
          }}
        >
          {Object.entries(EXPERIMENT_TYPES).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </ExperimentTypeContainer>

      <PageHeader $variant="h3">User defined values</PageHeader>

      <FieldGroup>
        <legend>File and case</legend>
        <FieldGrid>
          <ValueTextField
            name="fileName"
            label="File name in ert/model"
            helperText={
              fileExists ? "Existing file will be overwritten" : undefined
            }
            {...fieldProps}
          />
          <ValueTextField
            name="caseDir"
            label="Case name (<CASE_DIR>)"
            {...fieldProps}
          />
          <ValueTextField
            name="scratch"
            label="Scratch disk (<SCRATCH>)"
            {...fieldProps}
          />
          <NativeSelect
            id="ert-runpathMode"
            label="Run type (RUNPATH)"
            value={values.runpathMode}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setValue("runpathMode", e.target.value as RunpathMode);
            }}
          >
            {Object.entries(RUNPATH_MODES).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FieldGrid>
      </FieldGroup>

      <FieldGroup>
        <legend>RMS</legend>
        <FieldGrid>
          {rmsNameOptions.length > 0 ? (
            <NativeSelect
              id="ert-rmsName"
              label="RMS project in rms/model (<RMS_NAME>)"
              value={values.rmsName}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setValue("rmsName", e.target.value);
              }}
            >
              {rmsNameOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <ValueTextField
              name="rmsName"
              label="RMS project in rms/model (<RMS_NAME>)"
              {...fieldProps}
            />
          )}
          <ValueTextField
            name="rmsVersion"
            label="RMS version (<RMS_VERSION>)"
            readOnly={detectedRmsVersion !== undefined}
            helperText={
              detectedRmsVersion
                ? "Detected automatically from the RMS project"
                : selectedRmsProject?.error
                  ? `Could not detect the version, enter it manually: ${selectedRmsProject.error}`
                  : undefined
            }
            {...fieldProps}
          />
        </FieldGrid>
      </FieldGroup>

      <FieldGroup>
        <legend>Design matrix</legend>
        <FieldGrid>
          <FullWidth>
            <ValueTextField
              name="designMatrix"
              label="Design matrix file (<DESIGN_MATRIX>)"
              helperText="Path relative to ert/model"
              {...fieldProps}
            />
          </FullWidth>
          <ValueTextField
            name="designSheet"
            label="Design sheet name (<DESIGN_SHEET>)"
            {...fieldProps}
          />
        </FieldGrid>
      </FieldGroup>

      <FieldGroup>
        <legend>Realizations and queue</legend>
        <FieldGrid>
          <ValueTextField
            name="numRealizations"
            label="Number of realizations (NUM_REALIZATIONS)"
            {...fieldProps}
          />
          <ValueTextField
            name="numCpu"
            label="CPUs per realization (NUM_CPU)"
            {...fieldProps}
          />
          <ValueTextField
            name="maxRuntime"
            label="Max runtime in seconds (MAX_RUNTIME)"
            {...fieldProps}
          />
          <NativeSelect
            id="ert-queueSystem"
            label="Queue system (QUEUE_SYSTEM)"
            value={values.queueSystem}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setValue("queueSystem", e.target.value as QueueSystem);
            }}
          >
            {QUEUE_SYSTEMS.map((qs) => (
              <option key={qs} value={qs}>
                {qs}
              </option>
            ))}
          </NativeSelect>
          {values.queueSystem === "LSF" && (
            <ValueTextField
              name="lsfQueue"
              label="LSF queue (LSF_QUEUE)"
              {...fieldProps}
            />
          )}
        </FieldGrid>
      </FieldGroup>

      <FieldGroup>
        <legend>Optional features</legend>
        {(Object.keys(OPTIONAL_FEATURES) as OptionalFeature[]).map((key) => (
          <div key={key}>
            <Checkbox
              label={OPTIONAL_FEATURES[key]}
              checked={values[key]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setValue(key, e.target.checked);
              }}
            />
          </div>
        ))}
      </FieldGroup>

      <ActionButtonsContainer>
        <GeneralButton
          variant="outlined"
          label="Reset to defaults"
          disabled={isBusy}
          onClick={() => {
            setFormValues(initialValues);
          }}
        />
      </ActionButtonsContainer>

      <PageSectionSpacer />

      <PageHeader $variant="h3">Predefined values</PageHeader>
      <PageText>
        These values follow FMU standards and are always included in the
        generated config.
      </PageText>
      <FieldGroup>
        <PredefinedTable>
          <tbody>
            {predefinedRows(values).map((row) => (
              <tr key={row.keyword}>
                <th>{row.keyword}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </PredefinedTable>
      </FieldGroup>

      <PageSectionSpacer />

      <PageHeader $variant="h3">Generated config</PageHeader>

      <ValidationResult validation={validation} isCurrent={isCurrent} />

      <ActionButtonsContainer>
        <GeneralButton
          variant="outlined"
          label="Validate with ERT"
          isPending={validateMutation.isPending}
          disabled={isBusy || hasFieldErrors}
          tooltipText={
            hasFieldErrors ? "Fix the errors in the form first" : undefined
          }
          onClick={validate}
        />
        <GeneralButton
          label={fileExists ? "Validate and overwrite" : "Validate and save"}
          isPending={saveMutation.isPending}
          disabled={isBusy || saveDisabledReason !== undefined}
          tooltipText={saveDisabledReason}
          onClick={save}
        />
        <GeneralButton
          variant="outlined"
          label="Open in ERT GUI"
          isPending={openGuiMutation.isPending}
          disabled={!fileExists || openGuiMutation.isPending}
          tooltipText={
            fileExists
              ? `Opens the saved ert/model/${values.fileName}; unsaved changes are not included`
              : "Save the config first"
          }
          onClick={openGui}
        />
      </ActionButtonsContainer>

      <Typography variant="caption">ert/model/{values.fileName}</Typography>
      <PreviewWithLines content={content} errorLines={errorLines} />
    </>
  );
}
