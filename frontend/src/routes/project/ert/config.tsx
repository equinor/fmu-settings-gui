import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { ErtConfigEditor } from "#components/project/ert/ErtConfig";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/ert/config")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  if (!project.status || !project.data) {
    return <PageText>FMU project not set.</PageText>;
  }

  return (
    <ErtConfigEditor
      projectData={project.data}
      projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
    />
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>ERT config</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
