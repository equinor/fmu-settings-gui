import { createFileRoute } from "@tanstack/react-router";

import { useProject } from "#services/project";
import {
  PageContainerNotWidthConstrained,
  PageHeader,
  PageSectionWidthConstrained,
  PageText,
} from "#styles/common";

export const Route = createFileRoute("/project/rms/wellbores")({
  component: RouteComponent,
});

function RouteComponent() {
  const project = useProject();

  return (
    <PageContainerNotWidthConstrained>
      <PageSectionWidthConstrained>
        <PageHeader>RMS wellbores</PageHeader>
        <PageText>
          {project.status
            ? "No wellbore content available yet."
            : "Project not set."}
        </PageText>
      </PageSectionWidthConstrained>
    </PageContainerNotWidthConstrained>
  );
}
