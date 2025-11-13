import { createFileRoute } from "@tanstack/react-router";

import { Resources } from "#components/home/Resources";
import { PageHeader, PageSectionSpacer, PageText } from "#styles/common";

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

      <PageSectionSpacer />

      <Resources />
    </>
  );
}
