import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "#components/common";
import { FullChangelog } from "#components/home/Changelog";
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

  return <FullChangelog />;
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
