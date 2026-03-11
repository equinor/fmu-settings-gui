import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Viewer } from "#components/project/history/Viewer";
import { useProject } from "#services/project";
import { PageHeader } from "#styles/common";

export const Route = createFileRoute("/project/history")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();
  const hasProject = project.status && project.data !== undefined;
  const projectReadOnly =
    hasProject && !(project.lockStatus?.is_lock_acquired ?? false);

  return (
    <Viewer
      key={project.data?.path ?? "history-no-project"}
      hasProject={hasProject}
      projectReadOnly={projectReadOnly}
      cacheMaxRevisions={project.data?.config.cache_max_revisions}
    />
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>History</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
