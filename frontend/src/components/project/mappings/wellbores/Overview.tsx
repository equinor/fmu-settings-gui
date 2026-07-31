import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import type { FieldItem, RmsProject } from "#client";
import { useWellboreMappings } from "#services/mappings";
import { useSmdaWellHeaders } from "#services/smda";
import { PageText, WarningBox } from "#styles/common";
import { WellboreMappingsTable } from "./WellboreMappingsTable";

export function Overview({
  rmsProject,
  fields,
  smdaHealthStatus,
  projectReadOnly,
}: {
  rmsProject: RmsProject;
  fields: FieldItem[];
  smdaHealthStatus: boolean;
  projectReadOnly: boolean;
}) {
  const rmsWellbores = useMemo(
    () => rmsProject.wells ?? [],
    [rmsProject.wells],
  );
  const nonPlannedRmsWellboreNames = useMemo(
    () =>
      rmsWellbores
        .filter((wellbore) => !wellbore.planned)
        .map((wellbore) => wellbore.name),
    [rmsWellbores],
  );

  const { mappings, saveMappings, isSaving } = useWellboreMappings();
  const wellHeaders = useSmdaWellHeaders({
    fields,
    enabled:
      smdaHealthStatus &&
      !projectReadOnly &&
      nonPlannedRmsWellboreNames.length > 0,
  });

  return (
    <>
      <PageText>
        The following are the mappings for wellbores, showing the names in RMS,
        simulator files, and SMDA. Blue rows are planned wellbores and can be
        mapped to simulator names, but not SMDA names.
      </PageText>

      {!wellHeaders.hasFields && nonPlannedRmsWellboreNames.length > 0 && (
        <WarningBox>
          <PageText $marginBottom="0">
            No field is set in the masterdata.{" "}
            <Link to="/project/masterdata">Add a field</Link> to enable matching
            RMS wellbores to SMDA names.
          </PageText>
        </WarningBox>
      )}

      {wellHeaders.isError && (
        <WarningBox>
          <PageText $marginBottom="0">
            Some SMDA wellbore names could not be loaded. The SMDA names
            available for mapping can be incomplete.
          </PageText>
        </WarningBox>
      )}

      <WellboreMappingsTable
        rmsWellbores={rmsWellbores}
        mappings={mappings}
        smdaHeaders={wellHeaders.smdaHeaders}
        smdaHealthStatus={smdaHealthStatus}
        projectReadOnly={projectReadOnly}
        isSaving={isSaving}
        saveMappings={saveMappings}
      />
    </>
  );
}
