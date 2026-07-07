import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/project/rms")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();

  return location.pathname === "/project/rms" ? (
    <Navigate to="/project/rms/overview" replace />
  ) : (
    <Outlet />
  );
}
