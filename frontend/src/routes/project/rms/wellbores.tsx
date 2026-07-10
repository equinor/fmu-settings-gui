import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Wellbores } from "#components/project/rms/Wellbores";
import { useProject } from "#services/project";
import {
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

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
    <PageSectionWidthConstrained>
      <PageText>Project not set.</PageText>
    </PageSectionWidthConstrained>
  );
}

function RouteComponent() {
  return (
    <>
      <PageSectionWidthConstrained>
        <PageHeader>Wellbores</PageHeader>
      </PageSectionWidthConstrained>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
