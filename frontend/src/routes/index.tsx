import { createFileRoute } from "@tanstack/react-router";

import { FmuProject } from "#client/types.gen";
import { Resources } from "#components/home/Resources";
import { ProjectInfoBox } from "#components/ProjectInfo";
import { ProjectStatus } from "#components/ProjectStatus";
import { ProjectSelector } from "#components/project/overview/ProjectSelector";
import { useProject } from "#services/project";
import {
  InfoBox,
  PageHeader,
  PageSectionSpacer,
  PageText,
  ProjectInfoContainer,
} from "#styles/common";
export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function ModelDescription({ projectData }: { projectData: FmuProject }) {
  return (
    <>
      <PageHeader $variant="h6"> Model description</PageHeader>
      <InfoBox>
        <span className="multilineValue">
          {projectData.config.model?.description ??
            "No description found for the model. \nHead over to the project overview page to provide one!"}
        </span>
      </InfoBox>
    </>
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
        <>
          <ProjectInfoContainer>
            <ProjectInfoBox projectData={project.data} />
            <ProjectStatus projectData={project.data} detailed={false} />
          </ProjectInfoContainer>

          <ModelDescription projectData={project.data} />
        </>
      ) : (
        <>
          <PageText>No project selected</PageText>
          <ProjectSelector />
        </>
      )}

      <PageSectionSpacer />

      <Resources />
    </>
  );
}
