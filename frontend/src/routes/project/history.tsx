import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Viewer } from "#components/project/history/Viewer";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/history")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();
  const projectReadOnly = !(project.lockStatus?.is_lock_acquired ?? false);

  return project.status ? (
    <Viewer projectReadOnly={projectReadOnly} />
  ) : (
    <PageText>Project not set.</PageText>
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
