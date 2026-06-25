import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { Loading, SmdaHealthCheckInfo } from "#components/common";
import { Overview } from "#components/project/masterdata/Overview";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageHeader, PageText } from "#styles/common";
import {
  getStorageItem,
  STORAGENAME_MASTERDATA_EDIT_MODE,
  setStorageItem,
} from "#utils/storage";

export const Route = createFileRoute("/project/masterdata")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();
  const { data: healthCheck } = useSmdaHealthCheck();
  const [editMode, setEditMode] = useState(() =>
    getStorageItem(sessionStorage, STORAGENAME_MASTERDATA_EDIT_MODE, "boolean"),
  );
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();

  function toggleEditMode() {
    setEditMode((prevMode) => {
      setStorageItem(
        sessionStorage,
        STORAGENAME_MASTERDATA_EDIT_MODE,
        !prevMode,
      );

      return !prevMode;
    });
  }

  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  return (
    <>
      <Overview
        projectMasterdata={project.data?.config.masterdata?.smda ?? undefined}
        smdaHealthStatus={healthCheck.status}
        projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
        editMode={editMode}
      />

      {editMode ? (
        <SmdaHealthCheckInfo
          feature="editing masterdata"
          healthCheck={healthCheck}
          setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
        />
      ) : (
        <PageText>
          💡 To manage masterdata,{" "}
          <Typography onClick={toggleEditMode} link>
            enable editing mode.
          </Typography>
        </PageText>
      )}
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Masterdata</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
