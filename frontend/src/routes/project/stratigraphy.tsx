import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/project/stratigraphy")({
  component: () => <Navigate to="/project/mappings/stratigraphy" replace />,
});
