import { Button } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { projectGetProjectOptions } from "../../client/@tanstack/react-query.gen";
import { PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/project/overview")({
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
  const { data } = useQuery(projectGetProjectOptions());
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
      <PageHeader>Project</PageHeader>

      {projectDirNotFound && <ProjectDirSelection />}

      {!projectDirNotFound && <ProjectDirInfo />}
    </>
  );
}
