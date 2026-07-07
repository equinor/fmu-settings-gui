import { createFileRoute } from "@tanstack/react-router";

import { useProject } from "#services/project";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

export const Route = createFileRoute("/project/mappings/overview")({
  component: RouteComponent,
});

function RouteComponent() {
  const project = useProject();

  return (
    <PageContainerNotWidthConstrained>
      <PageSectionWidthConstrained>
        <PageHeader>Mappings overview</PageHeader>
        <PageText>
          {project.status
            ? "No mappings overview content available yet."
            : "Project not set."}
        </PageText>
      </PageSectionWidthConstrained>
    </PageContainerNotWidthConstrained>
  );
}
