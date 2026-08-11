import { createFileRoute } from "@tanstack/react-router";

import { useProject } from "#services/project";
import { PageHeader, PageText } from "#styles/common";

export const Route = createFileRoute("/project/mappings/wellbores")({
  component: RouteComponent,
});

function RouteComponent() {
  const project = useProject();

  return (
    <>
      <PageHeader>Wellbores</PageHeader>
      <PageText>
        {project.status
          ? "Wellbore mappings are coming soon."
          : "Project not set."}
      </PageText>
    </>
  );
}
