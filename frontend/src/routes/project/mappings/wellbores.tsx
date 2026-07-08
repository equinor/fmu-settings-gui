import { createFileRoute } from "@tanstack/react-router";

import { useProject } from "#services/project";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

export const Route = createFileRoute("/project/mappings/wellbores")({
  component: RouteComponent,
});

function RouteComponent() {
  const project = useProject();

  return (
    <PageContainerNotWidthConstrained>
      <PageSectionWidthConstrained>
        <PageHeader>Wellbores</PageHeader>
        <PageText>
          {project.status
            ? "Wellbore mappings are coming soon."
            : "Project not set."}
        </PageText>
      </PageSectionWidthConstrained>
    </PageContainerNotWidthConstrained>
  );
}
