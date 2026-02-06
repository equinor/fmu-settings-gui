import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Overview } from "#components/project/rms/Overview";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/rms")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  return project.status && project.data ? (
    <Overview
      rmsData={project.data.config.rms}
      projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
    />
  ) : (
    <PageText>Project not set.</PageText>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>RMS</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
