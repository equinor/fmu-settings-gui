import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageText } from "../styles/common";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader>FMU Settings</PageHeader>

      <PageText $variant="ingress">
        This is an application for managing the settings of FMU projects.
      </PageText>
    </>
  );
}
