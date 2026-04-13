import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

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
  const [masterdataEditMode, setMasterdataEditMode] = useState(
    getStorageItem(sessionStorage, STORAGENAME_MASTERDATA_EDIT_MODE, "boolean"),
  );
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();

  useEffect(() => {
    setStorageItem(
      sessionStorage,
      STORAGENAME_MASTERDATA_EDIT_MODE,
      masterdataEditMode,
    );
  }, [masterdataEditMode]);

  function toggleMasterdataEditMode() {
    setMasterdataEditMode((prevMode) => !prevMode);
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
        masterdataEditMode={masterdataEditMode}
      />

      {masterdataEditMode ? (
        <SmdaHealthCheckInfo
          feature="editing masterdata"
          healthCheck={healthCheck}
          setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
        />
      ) : (
        <PageText>
          💡 To manage masterdata,{" "}
          <Typography onClick={toggleMasterdataEditMode} link>
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
