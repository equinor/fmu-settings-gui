import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/project/mappings/")({
  component: () => <Navigate to="/project/mappings/overview" replace />,
});
