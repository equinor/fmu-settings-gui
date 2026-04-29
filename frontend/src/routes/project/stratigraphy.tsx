import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

import { Loading, SmdaHealthCheckInfo } from "#components/common";
import { Overview } from "#components/project/stratigraphy/Overview";
import {
  mappingsPaths,
  useProject,
  useProjectMappings,
} from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageHeader, PageText } from "#styles/common";
import {
  getStorageItem,
  STORAGENAME_STRATIGRAPHY_EDIT_MODE,
  setStorageItem,
} from "#utils/storage";

export const Route = createFileRoute("/project/stratigraphy")({
  component: RouteComponent,
});

function Content() {
  const [editMode, setEditMode] = useState(
    getStorageItem(
      sessionStorage,
      STORAGENAME_STRATIGRAPHY_EDIT_MODE,
      "boolean",
    ),
  );
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();

  const project = useProject();
  const mappings = useProjectMappings(mappingsPaths.stratigraphyRmsSmda);
  const { data: healthCheck } = useSmdaHealthCheck();

  useEffect(() => {
    setStorageItem(
      sessionStorage,
      STORAGENAME_STRATIGRAPHY_EDIT_MODE,
      editMode,
    );
  }, [editMode]);

  function toggleEditMode() {
    setEditMode((prevMode) => !prevMode);
  }

  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  return (
    <>
      {project.data?.config.rms !== undefined &&
      project.data.config.rms !== null ? (
        <>
          <Overview
            rmsProject={project.data.config.rms}
            mappings={
              mappings.status && mappings.data !== undefined
                ? mappings.data
                : []
            }
            stratigraphicColumn={
              project.data.config.masterdata?.smda.stratigraphic_column
            }
            smdaHealthStatus={healthCheck.status}
            projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
            editMode={editMode}
          />

          {editMode ? (
            <SmdaHealthCheckInfo
              feature="editing mappings"
              healthCheck={healthCheck}
              setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
            />
          ) : (
            <PageText>
              {" "}
              💡 To manage mappings,{" "}
              <Typography onClick={toggleEditMode} link>
                enable editing mode.
              </Typography>
            </PageText>
          )}
        </>
      ) : (
        <PageText>No RMS project is selected</PageText>
      )}
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Stratigraphy</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
