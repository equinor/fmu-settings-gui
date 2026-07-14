import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/project/mappings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
