import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "../../styles/common";

export const Route = createFileRoute("/mappings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PageHeader>Mappings</PageHeader>;
}
