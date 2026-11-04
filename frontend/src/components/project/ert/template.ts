export const EXPERIMENT_TYPES = {
  uncertainty: "Uncertainty study",
  ahm: "AHM (assisted history matching)",
  prediction: "Prediction",
} as const;
export type ExperimentType = keyof typeof EXPERIMENT_TYPES;

export const QUEUE_SYSTEMS = ["LOCAL", "LSF"] as const;
export type QueueSystem = (typeof QUEUE_SYSTEMS)[number];

export const RUNPATH_MODES = {
  iteration: "Uncertainty / history matching (iter-<ITER>)",
  prediction: "Prediction (pred)",
} as const;
export type RunpathMode = keyof typeof RUNPATH_MODES;

/** Values the user has to, or can, define. */
export type ErtConfigValues = {
  fileName: string;
  scratch: string;
  caseDir: string;
  rmsName: string;
  rmsVersion: string;
  designMatrix: string;
  designSheet: string;
  numCpu: number;
  numRealizations: number;
  maxRuntime: number;
  queueSystem: QueueSystem;
  lsfQueue: string;
  runpathMode: RunpathMode;
  installCustomJobs: boolean;
  hookRunFmuconfig: boolean;
  hookRunFmuconfigRate: boolean;
  hookWfFmuobs: boolean;
  includeGeoseis: boolean;
  sumoUpload: boolean;
};

export type OptionalFeature = keyof Pick<
  ErtConfigValues,
  | "installCustomJobs"
  | "hookRunFmuconfig"
  | "hookRunFmuconfigRate"
  | "hookWfFmuobs"
  | "includeGeoseis"
  | "sumoUpload"
>;

export const OPTIONAL_FEATURES: Record<OptionalFeature, string> = {
  installCustomJobs:
    "Install custom jobs and workflows (../input/config/install_custom_jobs.ert)",
  hookRunFmuconfig:
    'Update "global_variables.yml" before simulation (run_fmuconfig)',
  hookRunFmuconfigRate:
    'Update "rate_scaling.yml" before simulation (run_fmuconfig_rate)',
  hookWfFmuobs:
    "Create yaml version of ERT observations for Webviz (wf_fmuobs)",
  includeGeoseis: "GEOSEIS, for visualization (../input/config/geoseis.ert)",
  sumoUpload: "Upload results to Sumo (SUMO_UPLOAD)",
};

/** Values that are predefined and only shown in the GUI. */
export const PREDEFINED = {
  user: "$USER",
  rmsWorkflowName: "MAIN",
  sumoCasepath: "<SCRATCH>/<USER>/<CASE_DIR>",
  enspath: "../output/<CASE_DIR>/storage",
  updateLogPath: "../output/<CASE_DIR>/update_log",
  runpathFile: "../output/<CASE_DIR>/runpath_file",
  randomSeed: 123456,
  minRealizations: 1,
  maxSubmit: 1,
  lsfMaxRunning: 200,
  defaultSheet: "DefaultValues",
} as const;

export const RUNPATHS: Record<RunpathMode, string> = {
  iteration: "<SCRATCH>/<USER>/<CASE_DIR>/realization-<IENS>/iter-<ITER>/",
  prediction: "<SCRATCH>/<USER>/<CASE_DIR>/realization-<IENS>/pred/",
};

export function predefinedRows(
  values: ErtConfigValues,
): Array<{ keyword: string; value: string }> {
  return [
    { keyword: "DEFINE <USER>", value: PREDEFINED.user },
    { keyword: "DEFINE <RMS_WF_NAME>", value: PREDEFINED.rmsWorkflowName },
    { keyword: "DEFINE <SUMO_CASEPATH>", value: PREDEFINED.sumoCasepath },
    { keyword: "RUNPATH", value: RUNPATHS[values.runpathMode] },
    { keyword: "ENSPATH", value: PREDEFINED.enspath },
    { keyword: "UPDATE_LOG_PATH", value: PREDEFINED.updateLogPath },
    { keyword: "RUNPATH_FILE", value: PREDEFINED.runpathFile },
    { keyword: "RANDOM_SEED", value: String(PREDEFINED.randomSeed) },
    { keyword: "MIN_REALIZATIONS", value: String(PREDEFINED.minRealizations) },
    { keyword: "MAX_SUBMIT", value: String(PREDEFINED.maxSubmit) },
    {
      keyword: "QUEUE_OPTION LSF MAX_RUNNING",
      value: String(PREDEFINED.lsfMaxRunning),
    },
    { keyword: "HOOK_WORKFLOW", value: "echo_config_file PRE_SIMULATION" },
    {
      keyword: "HOOK_WORKFLOW_JOB",
      value:
        'xhook_create_case_metadata WF_CREATE_CASE_METADATA "--sumo" PRE_SIMULATION',
    },
    { keyword: "INCLUDE", value: "../input/config/make_folders.ert" },
    {
      keyword: "FORWARD_MODEL COPY_DIRECTORY",
      value:
        "<CONFIG_PATH>/../../rms/input/well_modelling → <RUNPATH>/rms/input",
    },
    {
      keyword: "DESIGN_MATRIX",
      value: `<CONFIG_PATH>/<DESIGN_MATRIX> DESIGN_SHEET:<DESIGN_SHEET> DEFAULT_SHEET:${PREDEFINED.defaultSheet}`,
    },
    {
      keyword: "FORWARD_MODEL DESIGN_KW",
      value:
        "rms_seed.tmpl → RMS_SEED, global_variables.yml.tmpl → global_variables.yml",
    },
    {
      keyword: "FORWARD_MODEL RMS",
      value:
        "<RMS_NAME>, <RMS_VERSION>, workflow <RMS_WF_NAME>, target RMS_TARGET_MAIN",
    },
  ];
}

const DEFAULT_FILE_NAME = "uncertainty_RMS.ert";

/** The default case name for a config file name, e.g. "uncertainty_RMS". */
export function caseDirFromFileName(fileName: string): string {
  return fileName.replace(/\.ert$/, "");
}

export function defaultErtConfigValues({
  rmsPath,
  rmsVersion,
}: {
  rmsPath?: string | null | undefined;
  rmsVersion?: string | null | undefined;
}): ErtConfigValues {
  return {
    fileName: DEFAULT_FILE_NAME,
    scratch: "/scratch/fmu",
    caseDir: caseDirFromFileName(DEFAULT_FILE_NAME),
    rmsName: rmsPath ? (rmsPath.split("/").pop() ?? "") : "",
    rmsVersion: rmsVersion ?? "",
    designMatrix: "../input/distributions/design_matrix_one_by_one.xlsx",
    designSheet: "DesignSheet01",
    numCpu: 1,
    numRealizations: 100,
    maxRuntime: 18000,
    queueSystem: "LOCAL",
    lsfQueue: "mr",
    runpathMode: "iteration",
    installCustomJobs: true,
    hookRunFmuconfig: false,
    hookRunFmuconfigRate: false,
    hookWfFmuobs: false,
    includeGeoseis: false,
    sumoUpload: true,
  };
}

export type FieldErrors = Partial<Record<keyof ErtConfigValues, string>>;

const SINGLE_TOKEN = /^\S+$/;
const ERT_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.ert$/;

export function validateValues(values: ErtConfigValues): FieldErrors {
  const errors: FieldErrors = {};

  const requireToken = (key: keyof ErtConfigValues, value: string) => {
    if (value.trim() === "") {
      errors[key] = "Required";
    } else if (!SINGLE_TOKEN.test(value.trim())) {
      errors[key] = "Must not contain whitespace";
    }
  };
  const requirePositiveInt = (key: keyof ErtConfigValues, value: number) => {
    if (!Number.isInteger(value) || value < 1) {
      errors[key] = "Must be a whole number of at least 1";
    }
  };

  if (!ERT_FILE_NAME.test(values.fileName)) {
    errors.fileName =
      "Must end with .ert and only contain letters, digits, '_', '.' and '-'";
  }
  requireToken("scratch", values.scratch);
  requireToken("caseDir", values.caseDir);
  requireToken("rmsName", values.rmsName);
  requireToken("rmsVersion", values.rmsVersion);
  requireToken("designMatrix", values.designMatrix);
  requireToken("designSheet", values.designSheet);
  if (values.queueSystem === "LSF") {
    requireToken("lsfQueue", values.lsfQueue);
  }
  requirePositiveInt("numCpu", values.numCpu);
  requirePositiveInt("numRealizations", values.numRealizations);
  requirePositiveInt("maxRuntime", values.maxRuntime);

  return errors;
}

const commentIf = (enabled: boolean) => (enabled ? "" : "-- ");

const LINE = "-----------------------------------------------------";

const section = (title: string) => `${LINE}\n-- ${title}\n${LINE}`;

/** Render an ERT config file following the layout of uncertainty_RMS.ert. */
export function renderErtConfig(v: ErtConfigValues): string {
  const p = PREDEFINED;
  const isLsf = v.queueSystem === "LSF";
  const isPrediction = v.runpathMode === "prediction";

  return `-- ==============================================================================
--
-- ERT CONFIGURATION FILE
--                                 "Uncertainty set-up"
-- Generated by fmu-settings
--
-- References:
--  FMU wiki portal:           https://wiki.equinor.com/wiki/index.php/FMU_portal_home
--  FMU related documentation: https://fmu.equinor.com/documentation
--  ERT technical description: https://fmu-docs.equinor.com/docs/ert/index.html
--
-- ==============================================================================


${section("Internal variables")}

DEFINE <USER>            ${p.user}
DEFINE <SCRATCH>         ${v.scratch.trim()}
DEFINE <CASE_DIR>        ${v.caseDir.trim()}
--
DEFINE <RMS_NAME>        ${v.rmsName.trim()}
DEFINE <RMS_VERSION>     ${v.rmsVersion.trim()}
DEFINE <RMS_WF_NAME>     ${p.rmsWorkflowName}
--
DEFINE <DESIGN_MATRIX>   ${v.designMatrix.trim()}
DEFINE <DESIGN_SHEET>    ${v.designSheet.trim()}  -- name of sheet in xlsx with the matrix to be parsed
DEFINE <SUMO_CASEPATH>   ${p.sumoCasepath}


${section("Runpath folder")}

-- Runpath folder from where all realizations are run
${commentIf(!isPrediction)}RUNPATH  ${RUNPATHS.iteration}
${commentIf(isPrediction)}RUNPATH  ${RUNPATHS.prediction}


${section("ert storage settings")}

ENSPATH          ${p.enspath}       -- Storage of internal ert data
UPDATE_LOG_PATH  ${p.updateLogPath}    -- Info of active and inactive data points
RUNPATH_FILE     ${p.runpathFile}  -- List of runpaths

RANDOM_SEED  ${p.randomSeed}  -- ERT seed value


${section("Queue settings")}

NUM_CPU             ${v.numCpu}
NUM_REALIZATIONS    ${v.numRealizations}  -- Set number of realizations to run
MAX_RUNTIME         ${v.maxRuntime}  -- Set the maximum allowed run time (in seconds)
MIN_REALIZATIONS    ${p.minRealizations}  -- Success criteria
MAX_SUBMIT          ${p.maxSubmit}  -- How many times should the queue system retry a simulation.
QUEUE_OPTION  LSF MAX_RUNNING ${p.lsfMaxRunning}  -- Choke the number of simultaneous run

${commentIf(isLsf)}QUEUE_OPTION LSF LSF_QUEUE  ${v.lsfQueue.trim() || "mr"}  -- Assign LSF cluster queue
QUEUE_SYSTEM ${v.queueSystem}


${LINE}
-- Install custom jobs and workflows
${LINE}

${commentIf(v.installCustomJobs)}INCLUDE  ../input/config/install_custom_jobs.ert


${section("Hook workflows")}

HOOK_WORKFLOW   echo_config_file   PRE_SIMULATION  -- Write ert config file run information to scratch
${commentIf(v.hookRunFmuconfig)}HOOK_WORKFLOW   run_fmuconfig      PRE_SIMULATION  -- Update "global_variables.yml" and "global_variables.yml.tmpl" files
${commentIf(v.hookRunFmuconfigRate)}HOOK_WORKFLOW   run_fmuconfig_rate PRE_SIMULATION  -- Update "rate_scaling.yml" and "rate_scaling.yml.tmpl" files
${commentIf(v.hookWfFmuobs)}HOOK_WORKFLOW   wf_fmuobs          PRE_SIMULATION  -- Create yaml version of ERT observations for use with Webviz
HOOK_WORKFLOW_JOB  xhook_create_case_metadata  WF_CREATE_CASE_METADATA  "--sumo"  PRE_SIMULATION  -- Create case metadata using dataio


${section("Forward Models")}

INCLUDE  ../input/config/make_folders.ert  -- Make general folder structure


${LINE}
---- copy rms folders/files
${LINE}

FORWARD_MODEL COPY_DIRECTORY(<FROM>=<CONFIG_PATH>/../../rms/input/well_modelling, <TO>=<RUNPATH>/rms/input)


${section("Design matrix uncertainty parameters")}

DESIGN_MATRIX <CONFIG_PATH>/<DESIGN_MATRIX> DESIGN_SHEET:<DESIGN_SHEET> DEFAULT_SHEET:${p.defaultSheet}


${section("Populate template files with their uncertainty parameter values")}

FORWARD_MODEL DESIGN_KW(<template_file>=<CONFIG_PATH>/../input/templates/rms_seed.tmpl,                  <result_file>=<RUNPATH>/rms/model/RMS_SEED)
FORWARD_MODEL DESIGN_KW(<template_file>=<CONFIG_PATH>/../../fmuconfig/output/global_variables.yml.tmpl,  <result_file>=<RUNPATH>/fmuconfig/output/global_variables.yml)


${LINE}
---- RMS
${LINE}

-- Run Main workflow
FORWARD_MODEL RMS(<IENS>=<IENS>, <RMS_VERSION>=<RMS_VERSION>, <RMS_PROJECT>=<CONFIG_PATH>/../../rms/model/<RMS_NAME>, <RMS_WORKFLOW>=<RMS_WF_NAME>, <RMS_TARGET_FILE>=RMS_TARGET_MAIN)


${LINE}
---- Export data for visualisation (webviz,RMS covisualization)
${LINE}

${commentIf(v.includeGeoseis)}INCLUDE  ../input/config/geoseis.ert  -- GEOSEIS, for visualization


${section("SUMO")}

${commentIf(v.sumoUpload)}FORWARD_MODEL SUMO_UPLOAD
`;
}
