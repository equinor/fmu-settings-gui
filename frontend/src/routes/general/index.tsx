import { Typography } from "@equinor/eds-core-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { v1GetProjectOptions } from "../../client/@tanstack/react-query.gen";
import { displayDateTime } from "../../utils/datetime";

export const Route = createFileRoute("/general/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useQuery(v1GetProjectOptions());

  return (
    <>
      <Typography variant="h2">General</Typography>

      <Typography>
        Project: <strong>{data?.project_dir_name}</strong>
        <br />
        Path: {data?.path}
        <br />
        Created: {displayDateTime(data?.config.created_at ?? "")} by{" "}
        {data?.config.created_by}
        <br />
        Version: {data?.config.version}
      </Typography>
    </>
  );
}
