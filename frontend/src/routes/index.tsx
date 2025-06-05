import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Typography variant="h2">FMU Settings</Typography>

      <Typography variant="ingress">
        This is an application for managing the settings of FMU projects.
      </Typography>
    </>
  );
}
