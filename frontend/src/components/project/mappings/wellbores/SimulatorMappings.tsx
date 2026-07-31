import { Dialog } from "@equinor/eds-core-react";
import { createFormHook } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import type { InternalWellboreMappings } from "#client";
import {
  projectPostMappingsExportRmsSimulatorRenamingTableMutation,
  projectPostMappingsImportRmsEclipseCsvMutation,
} from "#client/@tanstack/react-query.gen";
import { OrphanWarningBox } from "#components/common";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import { TextField } from "#components/form/field";
import type { SaveWellboreMappings } from "#services/mappings";
import { EditDialog, GenericDialog, PageText } from "#styles/common";
import { fieldContext, formContext } from "#utils/form";
import {
  isRmsMapping,
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
  closeDialog,
  submitPath,
}: {
  operation: "import" | "export";
  disabled: boolean;
  isPending: boolean;
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

  return (
    <EditDialog
      open={true}
      isDismissable={true}
      onClose={closeDialog}
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
          <form.AppField name="path">
            {(field) => (
              <field.TextField
                label="File path from project root"
                placeholder={defaultPath}
                helperText={`Default: ${defaultPath}`}
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
              isPending ? "File operation in progress" : "Project is read-only"
            }
          />
          <CancelButton onClick={closeDialog} />
        </Dialog.Actions>
      </form>
    </EditDialog>
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
  const hasAcceptedMappings = pendingImport.mappings.some((mapping) =>
    isRmsMapping(mapping, "simulator"),
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
            "The following RMS wellbores are not saved in this project. " +
            "Their simulator names will not be imported."
          }
          listItems={pendingImport.excludedRmsWellboreNames}
        />

        <PageText $marginBottom="0">
          {hasAcceptedMappings ? (
            'Select "Import simulator names" to import every simulator name ' +
            "in the file that maps to an RMS wellbore saved in this project."
          ) : (
            <>
              None of the RMS wellbores in <code>rms_eclipse.csv</code> are
              saved in this project, so no simulator names can be imported.
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
  mappings,
  savedRmsWellboreNames,
  projectReadOnly,
  isSaving,
  saveMappings,
}: {
  mappings: InternalWellboreMappings;
  savedRmsWellboreNames: string[];
  projectReadOnly: boolean;
  isSaving: boolean;
  saveMappings: SaveWellboreMappings;
}) {
  const [mappingFileOperation, setMappingFileOperation] = useState<
    "import" | "export"
  >();
  const [pendingImport, setPendingImport] = useState<PendingImport>();
  const importMutation = useMutation({
    ...projectPostMappingsImportRmsEclipseCsvMutation(),
    meta: { errorPrefix: "Could not import simulator names" },
  });
  const exportMutation = useMutation({
    ...projectPostMappingsExportRmsSimulatorRenamingTableMutation(),
    meta: {
      errorPrefix: "Could not export simulator names to a renaming table",
    },
  });
  const hasSimulatorMappings = useMemo(
    () => mappings.some((mapping) => isRmsMapping(mapping, "simulator")),
    [mappings],
  );
  const fileOperationPending =
    mappingFileOperation === "import"
      ? importMutation.isPending
      : exportMutation.isPending;
  const importBlocked = projectReadOnly
    ? "Project is read-only"
    : !savedRmsWellboreNames.length
      ? "Save RMS wellbores before importing simulator names"
      : undefined;

  const saveImportedMappings = (
    importedMappings: PendingImport["mappings"],
  ) => {
    saveMappings(mergeImportedMappings(mappings, importedMappings), {
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
            savedRmsWellboreNames,
          );
          if (prepared.excludedRmsWellboreNames.length) {
            setPendingImport(prepared);
          } else if (prepared.mappings.length) {
            saveImportedMappings(prepared.mappings);
          } else {
            toast.info(
              "The file does not contain any RMS wellbores saved in this " +
                "project",
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
          closeDialog={() => {
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
              operation="simulator"
              mappingsAfterRemoval={() => removeSimulatorMappings(mappings)}
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
