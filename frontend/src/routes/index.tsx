import { createFileRoute } from "@tanstack/react-router";

import type { FmuProject } from "#client";
import { ProjectSelector } from "#components/project/overview/ProjectSelector";
import { useProject } from "#services/project";
import {
  InfoBox,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { displayDateTime } from "#utils/datetime";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function ProjectInfoBox({ projectData }: { projectData: FmuProject }) {
  return (
    <InfoBox>
      <PageHeader $variant="h3" $marginBottom="0">
        {projectData.project_dir_name}
      </PageHeader>

      <PageText>
        <span className="emphasis">{projectData.path}</span>
        <br />
        Last modified:{" "}
        {projectData.config.last_modified_at ? (
          <>
            {displayDateTime(projectData.config.last_modified_at)} by{" "}
            {projectData.config.last_modified_by ?? (
              <span className="missingValue">unknown</span>
            )}
          </>
        ) : (
          <span className="missingValue">unknown</span>
        )}
      </PageText>

      <PageText $marginBottom="0">
        {projectData.config.model?.description ? (
          <span className="multilineValue">
            {projectData.config.model.description}
          </span>
        ) : (
          <span className="missingValue">
            No description found for the model
          </span>
        )}
      </PageText>
    </InfoBox>
  );
}

function RouteComponent() {
  const project = useProject();

  return (
    <>
      <PageHeader>FMU Settings</PageHeader>

      <PageText $variant="ingress">
        This is an application for managing the settings of FMU projects.
      </PageText>

      {project.data ? (
        <ProjectInfoBox projectData={project.data} />
      ) : (
        <>
          <PageText>No project selected</PageText>

          <ProjectSelector />
        </>
      )}

      <PageSectionSpacer />
    </>
  );
}
