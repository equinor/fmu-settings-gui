import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  projectPostMappingsExportRmsSimulatorRenamingTableMutation,
  projectPostMappingsImportRmsEclipseCsvMutation,
} from "#client/@tanstack/react-query.gen";
import { ConfirmCloseDialog, OrphanWarningBox } from "#components/common";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { TextField } from "#components/form/field";
import type { ElementMappings } from "#components/project/common/mapping/types";
import type { SaveWellboreMappings } from "#services/mappings";
import { EditDialog, GenericDialog, PageText } from "#styles/common";
import { HTTP_STATUS_404_NOT_FOUND } from "#utils/api";
import { fieldContext, formContext } from "#utils/form";
import { useConfirmClose } from "#utils/ui";
import {
  mergeImportedMappings,
  prepareImportedMappings,
  removeSimulatorMappings,
} from "./functions";
import { MappingAction } from "./MappingAction";
import { RemoveMappingsAction } from "./RemoveMappingsAction";
import type { PendingImport } from "./types";

const DEFAULT_IMPORT_PATH =
  "rms/input/well_modelling/well_info/rms_eclipse.csv";
const DEFAULT_EXPORT_PATH =
  "rms/input/well_modelling/well_info/rms_simulator.renaming_table";
type MappingFileOperation = "import" | "export";

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});

function MappingFilePathDialog({
  operation,
  disabled,
  isPending,
  pathError,
  clearPathError,
  closeDialog,
  submitPath,
}: {
  operation: MappingFileOperation;
  disabled: boolean;
  isPending: boolean;
  pathError?: string | undefined;
  clearPathError: () => void;
  closeDialog: () => void;
  submitPath: (path: string) => void;
}) {
  const isImport = operation === "import";
  const defaultPath = isImport ? DEFAULT_IMPORT_PATH : DEFAULT_EXPORT_PATH;
  const form = useAppForm({
    defaultValues: { path: "" },
    onSubmit: ({ value }) => {
      if (!disabled) {
        submitPath(value.path.trim());
      }
    },
  });
  const confirmClose = useConfirmClose({
    enable: true,
    determineRequiresConfirmation: () => !form.state.isDefaultValue,
    onCloseConfirmed: () => {
      form.reset();
      clearPathError();
      closeDialog();
    },
  });

  return (
    <>
      <ConfirmCloseDialog
        isOpen={confirmClose.confirmCloseDialogOpen}
        handleConfirmCloseDecision={confirmClose.handleDecision}
      />

      <EditDialog
        open={true}
        isDismissable={true}
        onClose={confirmClose.handleCloseRequest}
        $width="42em"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <Dialog.Header>
            {isImport ? (
              <span>
                Import simulator names from <code>rms_eclipse.csv</code>
              </span>
            ) : (
              "Export simulator names to a renaming table"
            )}
          </Dialog.Header>

          <Dialog.CustomContent>
            <PageText>
              {isImport ? (
                <>
                  Enter the path to the <code>rms_eclipse.csv</code> file
                  containing the simulator names.
                </>
              ) : (
                "Choose where to save the renaming table containing the simulator names."
              )}{" "}
              The path starts from the project root. Leave it empty to use the
              default location shown below.
            </PageText>
            {isImport && (
              <PageText>
                The file may contain other columns. The application imports only
                the <code>RMS_WELL_NAME</code> and{" "}
                <code>ECLIPSE_WELL_NAME</code> columns.
              </PageText>
            )}
            <form.AppField name="path" listeners={{ onChange: clearPathError }}>
              {(field) => (
                <field.TextField
                  label="File path from project root"
                  helperText={`Default: ${defaultPath}`}
                  errorText={pathError}
                />
              )}
            </form.AppField>
          </Dialog.CustomContent>

          <Dialog.Actions>
            <SubmitButton
              label={
                isImport ? "Import simulator names" : "Export simulator names"
              }
              disabled={disabled}
              isPending={isPending}
              helperTextDisabled={
                isPending
                  ? "File operation in progress"
                  : "Project is read-only"
              }
            />
            <CancelButton
              onClick={(event) => {
                event.preventDefault();
                confirmClose.handleCloseRequest();
              }}
            />
          </Dialog.Actions>
        </form>
      </EditDialog>
    </>
  );
}

function ImportWarningDialog({
  pendingImport,
  disabled,
  isPending,
  closeDialog,
  saveImport,
}: {
  pendingImport: PendingImport;
  disabled: boolean;
  isPending: boolean;
  closeDialog: () => void;
  saveImport: () => void;
}) {
  const hasAcceptedMappings = Object.values(pendingImport.mappings).some(
    (mapping) => Boolean(mapping.targets.simulator?.name),
  );

  return (
    <GenericDialog
      open={true}
      isDismissable={true}
      onClose={closeDialog}
      $width="38em"
    >
      <Dialog.Header>Some simulator names cannot be imported</Dialog.Header>

      <Dialog.CustomContent>
        <OrphanWarningBox
          message={
            "The following RMS wellbores are not stored in the project configuration. " +
            "Their simulator names will not be imported."
          }
          listItems={pendingImport.excludedRmsWellboreNames}
        />

        <PageText $marginBottom="0">
          {hasAcceptedMappings ? (
            "Confirm that you want to import all simulator names in the file " +
            "that map to RMS wellbores stored in the project configuration."
          ) : (
            <>
              None of the RMS wellbores in <code>rms_eclipse.csv</code> are
              stored in the project configuration, so no simulator names can be
              imported.
            </>
          )}
        </PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        {hasAcceptedMappings ? (
          <>
            <GeneralButton
              label="Import simulator names"
              disabled={disabled}
              isPending={isPending}
              tooltipText={
                disabled
                  ? isPending
                    ? "Wellbore mappings are being saved"
                    : "Project is read-only"
                  : undefined
              }
              onClick={saveImport}
            />
            <CancelButton onClick={closeDialog} />
          </>
        ) : (
          <GeneralButton label="Close" onClick={closeDialog} />
        )}
      </Dialog.Actions>
    </GenericDialog>
  );
}

export function SimulatorMappings({
  elementMappings,
  projectReadOnly,
  isSaving,
  saveMappings,
}: {
  elementMappings: ElementMappings;
  projectReadOnly: boolean;
  isSaving: boolean;
  saveMappings: SaveWellboreMappings;
}) {
  const [mappingFileOperation, setMappingFileOperation] =
    useState<MappingFileOperation>();
  const [pendingImport, setPendingImport] = useState<PendingImport>();
  const importMutation = useMutation({
    ...projectPostMappingsImportRmsEclipseCsvMutation(),
    meta: {
      errorPrefix: "Could not import simulator names",
      preventDefaultErrorHandling: [HTTP_STATUS_404_NOT_FOUND],
    },
  });
  const exportMutation = useMutation({
    ...projectPostMappingsExportRmsSimulatorRenamingTableMutation(),
    meta: {
      errorPrefix: "Could not export simulator names to a renaming table",
    },
  });
  const hasSimulatorMappings = useMemo(
    () =>
      Object.values(elementMappings).some((mapping) =>
        Boolean(mapping.targets.simulator?.name),
      ),
    [elementMappings],
  );
  const fileOperationPending =
    mappingFileOperation === "import"
      ? importMutation.isPending
      : exportMutation.isPending;
  const importPathError =
    importMutation.error?.response?.status === HTTP_STATUS_404_NOT_FOUND
      ? ((importMutation.error.response.data as { detail?: string } | undefined)
          ?.detail ?? "The file could not be found")
      : undefined;
  const importBlocked = projectReadOnly
    ? "Project is read-only"
    : !Object.keys(elementMappings).length
      ? "Select RMS wellbores to store in the project configuration before importing simulator names"
      : undefined;

  const saveImportedMappings = (
    importedMappings: PendingImport["mappings"],
  ) => {
    saveMappings(mergeImportedMappings(elementMappings, importedMappings), {
      successMessage: "Simulator names imported",
      onSuccess: () => {
        setPendingImport(undefined);
      },
    });
  };

  const importMappings = (path: string) => {
    importMutation.mutate(
      { body: path ? { relative_path: path } : null },
      {
        onSuccess: (result) => {
          setMappingFileOperation(undefined);
          const prepared = prepareImportedMappings(
            result.wellbore ?? [],
            elementMappings,
          );
          if (prepared.excludedRmsWellboreNames.length) {
            setPendingImport(prepared);
          } else if (Object.keys(prepared.mappings).length > 0) {
            saveImportedMappings(prepared.mappings);
          } else {
            toast.info(
              "The file does not contain any RMS wellbores stored in the " +
                "project configuration",
            );
          }
        },
      },
    );
  };

  const exportMappings = (path: string) => {
    exportMutation.mutate(
      { body: path ? { relative_path: path } : null },
      {
        onSuccess: (result) => {
          setMappingFileOperation(undefined);
          toast.info(result.message);
        },
      },
    );
  };

  return (
    <>
      {pendingImport && (
        <ImportWarningDialog
          pendingImport={pendingImport}
          disabled={projectReadOnly || isSaving}
          isPending={isSaving}
          closeDialog={() => {
            setPendingImport(undefined);
          }}
          saveImport={() => {
            saveImportedMappings(pendingImport.mappings);
          }}
        />
      )}

      {mappingFileOperation && (
        <MappingFilePathDialog
          operation={mappingFileOperation}
          disabled={projectReadOnly || fileOperationPending}
          isPending={fileOperationPending}
          pathError={
            mappingFileOperation === "import" ? importPathError : undefined
          }
          clearPathError={importMutation.reset}
          closeDialog={() => {
            importMutation.reset();
            setMappingFileOperation(undefined);
          }}
          submitPath={
            mappingFileOperation === "import" ? importMappings : exportMappings
          }
        />
      )}

      <MappingAction
        title="Simulator names"
        description={
          hasSimulatorMappings ? (
            "Export to a renaming table or clear the names."
          ) : (
            <>
              Import simulator names from an <code>rms_eclipse.csv</code> file.
            </>
          )
        }
      >
        {!hasSimulatorMappings && (
          <GeneralButton
            label="Import simulator names"
            disabled={Boolean(importBlocked) || importMutation.isPending}
            isPending={importMutation.isPending}
            tooltipText={importBlocked}
            onClick={() => {
              importMutation.reset();
              setMappingFileOperation("import");
            }}
          />
        )}

        {hasSimulatorMappings && (
          <>
            <GeneralButton
              label="Export simulator names"
              disabled={projectReadOnly || exportMutation.isPending}
              isPending={exportMutation.isPending}
              tooltipText={projectReadOnly ? "Project is read-only" : undefined}
              onClick={() => {
                setMappingFileOperation("export");
              }}
            />
            <RemoveMappingsAction
              targetSystem="simulator"
              mappingsAfterRemoval={() =>
                removeSimulatorMappings(elementMappings)
              }
              projectReadOnly={projectReadOnly}
              isSaving={isSaving}
              saveMappings={saveMappings}
            />
          </>
        )}
      </MappingAction>
    </>
  );
}
