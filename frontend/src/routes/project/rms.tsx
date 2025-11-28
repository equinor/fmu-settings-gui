import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { EditableRmsInfo } from "#components/project/overview/Rms";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/rms")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  return <EditableRmsInfo projectData={project.data} />;
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
