import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "../../styles/common";

export const Route = createFileRoute("/general/smda")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PageHeader>SMDA</PageHeader>;
}
