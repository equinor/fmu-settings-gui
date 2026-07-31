import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import type { FieldItem, RmsProject } from "#client";
import { Loading, SmdaHealthCheckInfo } from "#components/common";
import { Overview } from "#components/project/mappings/wellbores/Overview";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/mappings/wellbores")({
  component: RouteComponent,
});

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

function RmsProjectContent({
  rmsProject,
  fields,
  projectReadOnly,
}: {
  rmsProject: RmsProject;
  fields: FieldItem[];
  projectReadOnly: boolean;
}) {
  const { data: healthCheck } = useSmdaHealthCheck();
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();

  return (
    <>
      <Overview
        rmsProject={rmsProject}
        fields={fields}
        smdaHealthStatus={healthCheck.status}
        projectReadOnly={projectReadOnly}
      />

      {!healthCheck.status && (
        <div id="smda-connection-details">
          <SmdaHealthCheckInfo
            feature="editing SMDA wellbore names"
            healthCheck={healthCheck}
            setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
          />
        </div>
      )}
    </>
  );
}
