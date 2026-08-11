import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { Changelog } from "#components/project/changelog/Changelog";
import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/changelog")({
  component: RouteComponent,
});

function Content() {
  const project = useProject();

  if (!(project.status && project.data !== undefined)) {
    return <PageText>No project selected.</PageText>;
  }

  return <Changelog />;
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Changelog</PageHeader>

      <PageText>
        This page displays the full changelog for the selected project. Use the
        filters to narrow the list by change type or number of entries.
      </PageText>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
