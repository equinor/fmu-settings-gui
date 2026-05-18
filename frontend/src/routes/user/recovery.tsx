import { createFileRoute } from "@tanstack/react-router";

import { Overview } from "#components/user/history/Overview";
import { PageHeader } from "#styles/common";

export const Route = createFileRoute("/user/recovery")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader>Recovery</PageHeader>

      <Overview />
    </>
  );
}
