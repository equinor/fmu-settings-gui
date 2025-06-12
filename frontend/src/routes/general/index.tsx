import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { v1GetProjectOptions } from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { PageHeader, PageText } from "../../styles/common";
import { displayDateTime } from "../../utils/datetime";

export const Route = createFileRoute("/general/")({
  component: RouteComponent,
});

function Overview() {
  const { data } = useSuspenseQuery(v1GetProjectOptions());

  return (
    <>
      <PageText>
        Project: <strong>{data.project_dir_name}</strong>
        <br />
        Path: {data.path}
        <br />
        Created: {displayDateTime(data.config.created_at)} by{" "}
        {data.config.created_by}
        <br />
        Version: {data.config.version}
      </PageText>
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>General</PageHeader>

      <Suspense fallback={<Loading />}>
        <Overview />
      </Suspense>
    </>
  );
}
