import { Button } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { v1GetProjectOptions } from "../../client/@tanstack/react-query.gen";
import { PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/directory/")({
  component: RouteComponent,
});

function ProjectDirSelection() {
  return (
    <PageText>
      Enter project directory: <input /> <Button>Submit</Button>
    </PageText>
  );
}

function ProjectDirInfo() {
  const { data } = useQuery(v1GetProjectOptions());
  return (
    <PageText>
      Current project: <strong>{data?.project_dir_name}</strong>
      <br />
      Current path: {data?.path}
    </PageText>
  );
}

function RouteComponent() {
  const { projectDirNotFound } = Route.useRouteContext();

  return (
    <>
      <PageHeader>Directory</PageHeader>

      {projectDirNotFound && <ProjectDirSelection />}

      {!projectDirNotFound && <ProjectDirInfo />}
    </>
  );
}
