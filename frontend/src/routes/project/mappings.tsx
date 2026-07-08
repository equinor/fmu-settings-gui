import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PageContainerNotWidthConstrained } from "#styles/common";

export const Route = createFileRoute("/project/mappings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainerNotWidthConstrained>
      <Outlet />
    </PageContainerNotWidthConstrained>
  );
}
