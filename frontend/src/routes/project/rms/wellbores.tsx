import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Wellbores } from "#components/project/rms/Wellbores";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/rms/wellbores")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  return project.status && project.data ? (
    <Wellbores
      rmsData={project.data.config.rms}
      projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
      isRmsProjectOpen={!!project.rmsExpiresAt}
    />
  ) : (
    <PageText>Project not set.</PageText>
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
