import { Button, Typography } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { v1GetProjectOptions } from "../../client/@tanstack/react-query.gen";

export const Route = createFileRoute("/directory/")({
  component: RouteComponent,
});

function ProjectDirSelection() {
  return (
    <Typography>
      Enter project directory: <input /> <Button>Submit</Button>
    </Typography>
  );
}

function ProjectDirInfo() {
  const { data } = useQuery(v1GetProjectOptions());
  return (
    <Typography>
      Current project: <strong>{data?.project_dir_name}</strong>
      <br />
      Current path: {data?.path}
    </Typography>
  );
}

function RouteComponent() {
  const { projectDirNotFound } = Route.useRouteContext();

  return (
    <>
      <Typography variant="h2">Directory</Typography>

      {projectDirNotFound && <ProjectDirSelection />}

      {!projectDirNotFound && <ProjectDirInfo />}
    </>
  );
}
