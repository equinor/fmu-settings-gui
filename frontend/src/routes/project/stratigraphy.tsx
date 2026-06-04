import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

import { Loading, SmdaHealthCheckInfo } from "#components/common";
import { Overview } from "#components/project/stratigraphy/Overview";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";
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
    return (
      <PageSectionWidthConstrained>
        <PageText>Project not set.</PageText>
      </PageSectionWidthConstrained>
    );
  }

  return (
    <>
      {project.data?.config.rms !== undefined &&
      project.data.config.rms !== null ? (
        <>
          <Overview
            rmsProject={project.data.config.rms}
            stratigraphicColumn={
              project.data.config.masterdata?.smda.stratigraphic_column
            }
            smdaHealthStatus={healthCheck.status}
            projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
            editMode={editMode}
          />

          <PageSectionWidthConstrained>
            {editMode ? (
              <SmdaHealthCheckInfo
                feature="editing mappings"
                healthCheck={healthCheck}
                setRequestAcquireSsoAccessToken={
                  setRequestAcquireSsoAccessToken
                }
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
          </PageSectionWidthConstrained>
        </>
      ) : (
        <PageSectionWidthConstrained>
          <PageText>No RMS project is selected.</PageText>
        </PageSectionWidthConstrained>
      )}
    </>
  );
}

function RouteComponent() {
  return (
    <PageContainerNotWidthConstrained>
      <PageSectionWidthConstrained>
        <PageHeader>Stratigraphy</PageHeader>
      </PageSectionWidthConstrained>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageContainerNotWidthConstrained>
  );
}
