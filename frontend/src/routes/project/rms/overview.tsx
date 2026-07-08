import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Overview } from "#components/project/rms/Overview";
import { useProject } from "#services/project";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

export const Route = createFileRoute("/project/rms/overview")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  return project.status && project.data ? (
    <Overview
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
        <PageHeader>Overview</PageHeader>
      </PageSectionWidthConstrained>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageContainerNotWidthConstrained>
  );
}
