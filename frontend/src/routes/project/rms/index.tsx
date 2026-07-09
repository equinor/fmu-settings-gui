import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/project/rms/")({
  component: () => <Navigate to="/project/rms/overview" replace />,
});
