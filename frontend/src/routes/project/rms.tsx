import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/project/rms")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
