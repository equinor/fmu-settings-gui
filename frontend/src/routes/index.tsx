import { Typography } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { v1GetProjectOptions } from "../client/@tanstack/react-query.gen";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useQuery(v1GetProjectOptions());

  return (
    <>
      <Typography variant="h2">FMU Settings</Typography>

      <Typography variant="ingress">
        This is an application for managing the settings of FMU projects.
      </Typography>

      <Typography>
        Current project: <strong>{data?.project_dir_name}</strong>
        <br />
        Current path: {data?.path}
      </Typography>
    </>
  );
}
