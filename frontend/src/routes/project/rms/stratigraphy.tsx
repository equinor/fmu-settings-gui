import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Stratigraphy } from "#components/project/rms/Stratigraphy";
import { useProject } from "#services/project";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

export const Route = createFileRoute("/project/rms/stratigraphy")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  return project.status && project.data ? (
    <Stratigraphy
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
