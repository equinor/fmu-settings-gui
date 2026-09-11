import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import type { FieldItem, RmsProject } from "#client";
import { Loading, SmdaHealthCheckInfo } from "#components/common";
import { Overview } from "#components/project/mappings/wellbores/Overview";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageHeader, PageText } from "#styles/common";
import {
  getStorageItem,
  STORAGENAME_WELLBORE_MAPPINGS_EDIT_MODE,
  setStorageItem,
} from "#utils/storage";

export const Route = createFileRoute("/project/mappings/wellbores")({
  component: RouteComponent,
});

function RmsProjectContent({
  rmsProject,
  fields,
  projectReadOnly,
}: {
  rmsProject: RmsProject;
  fields: FieldItem[];
  projectReadOnly: boolean;
}) {
  const [editMode, setEditMode] = useState(() =>
    getStorageItem(
      sessionStorage,
      STORAGENAME_WELLBORE_MAPPINGS_EDIT_MODE,
      "boolean",
    ),
  );
  const { data: healthCheck } = useSmdaHealthCheck();
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();

  function toggleEditMode() {
    setEditMode((prevMode) => {
      setStorageItem(
        sessionStorage,
        STORAGENAME_WELLBORE_MAPPINGS_EDIT_MODE,
        !prevMode,
      );

      return !prevMode;
    });
  }

  return (
    <>
      <Overview
        rmsProject={rmsProject}
        fields={fields}
        smdaHealthStatus={healthCheck.status}
        projectReadOnly={projectReadOnly}
        editMode={editMode}
      />

      {projectReadOnly ? (
        <PageText>
          💡 The project is read-only, so the mappings are not editable.
        </PageText>
      ) : editMode ? (
        <div id="smda-connection-details">
          <SmdaHealthCheckInfo
            feature="editing SMDA wellbore names"
            healthCheck={healthCheck}
            setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
          />
        </div>
      ) : (
        <PageText>
          💡 To manage mappings,{" "}
          <Typography onClick={toggleEditMode} link>
            enable editing mode.
          </Typography>
        </PageText>
      )}
    </>
  );
}

function Content() {
  const project = useProject();

  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  const rmsProject = project.data?.config.rms;
  if (!rmsProject) {
    return <PageText>No RMS project is selected.</PageText>;
  }

  return (
    <RmsProjectContent
      rmsProject={rmsProject}
      fields={project.data?.config.masterdata?.smda.field ?? []}
      projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
    />
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Wellbores</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
