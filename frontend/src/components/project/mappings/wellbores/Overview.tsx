import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import type { FieldItem, RmsProject } from "#client";
import { useWellboreMappings } from "#services/mappings";
import { useSmdaWellHeaders } from "#services/smda";
import { PageText, WarningBox } from "#styles/common";
import { createWellboreElementMappings } from "./functions";
import { MappingActions } from "./Overview.style";
import { SimulatorMappings } from "./SimulatorMappings";
import { SmdaMappings } from "./SmdaMappings";
import { WellboreMappingsTable } from "./WellboreMappingsTable";

export function Overview({
  rmsProject,
  fields,
  smdaHealthStatus,
  projectReadOnly,
  editMode,
}: {
  rmsProject: RmsProject;
  fields: FieldItem[];
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
  editMode: boolean;
}) {
  const rmsWellbores = useMemo(
    () => rmsProject.wells ?? [],
    [rmsProject.wells],
  );
  const { mappings, saveMappings, isSaving } = useWellboreMappings();
  const elementMappings = useMemo(
    () => createWellboreElementMappings(rmsWellbores, mappings),
    [mappings, rmsWellbores],
  );
  const nonPlannedRmsWellboreNames = useMemo(
    () =>
      rmsWellbores
        .filter((wellbore) => !wellbore.planned)
        .map((wellbore) => wellbore.name),
    [rmsWellbores],
  );
  const wellHeaders = useSmdaWellHeaders({
    fields,
    enabled:
      editMode &&
      smdaHealthStatus &&
      !projectReadOnly &&
      nonPlannedRmsWellboreNames.length > 0,
  });

  return (
    <>
      <PageText>
        The following mappings show wellbore names in RMS, simulator files, and
        SMDA. Blue rows are planned wellbores.
      </PageText>

      {editMode && rmsWellbores.length > 0 && (
        <MappingActions>
          <SimulatorMappings
            elementMappings={elementMappings}
            projectReadOnly={projectReadOnly}
            isSaving={isSaving}
            saveMappings={saveMappings}
          />

          <SmdaMappings
            elementMappings={elementMappings}
            nonPlannedRmsWellboreNames={nonPlannedRmsWellboreNames}
            wellHeaders={wellHeaders}
            smdaHealthStatus={smdaHealthStatus}
            projectReadOnly={projectReadOnly}
            isSaving={isSaving}
            saveMappings={saveMappings}
          />
        </MappingActions>
      )}

      {editMode &&
        !wellHeaders.hasFields &&
        nonPlannedRmsWellboreNames.length > 0 && (
          <WarningBox>
            <PageText $marginBottom="0">
              No field is set in the masterdata.{" "}
              <Link to="/project/masterdata">Add a field</Link> to enable
              matching RMS wellbores to SMDA names.
            </PageText>
          </WarningBox>
        )}

      {editMode && wellHeaders.isError && (
        <WarningBox>
          <PageText $marginBottom="0">
            Some SMDA wellbore names could not be loaded. The SMDA names
            available for mapping can be incomplete.
          </PageText>
        </WarningBox>
      )}

      <WellboreMappingsTable
        elementMappings={elementMappings}
        smdaHeaders={wellHeaders.smdaHeaders}
        smdaHeadersError={wellHeaders.isError}
        smdaHealthStatus={smdaHealthStatus}
        projectReadOnly={projectReadOnly}
        editMode={editMode}
        isSaving={isSaving}
        saveMappings={saveMappings}
      />
    </>
  );
}
