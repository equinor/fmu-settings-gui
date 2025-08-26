import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { FmuProject } from "#client";
import { Loading } from "#components/common";
import { useProject } from "#services/project";
import { PageCode, PageHeader, PageText } from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import { ProjectName } from "./index.style";

export const Route = createFileRoute("/project/")({
  component: RouteComponent,
});

function ProjectInfo({ projectData }: { projectData: FmuProject }) {
  return (
    <PageText>
      Project: <ProjectName>{projectData.project_dir_name}</ProjectName>
      <br />
      Path: {projectData.path}
      <br />
      Created: {displayDateTime(projectData.config.created_at)} by{" "}
      {projectData.config.created_by}
      <br />
      Version: {projectData.config.version}
    </PageText>
  );
}

function ProjectNotFound({ text }: { text: string }) {
  const hasText = text !== "";
  const lead = "No project selected" + (hasText ? ":" : ".");

  return (
    <>
      <PageText>{lead}</PageText>

      {hasText && <PageCode>{text}</PageCode>}
    </>
  );
}

function Content() {
  const { data: project } = useProject();

  return (
    <>
      {project.status && project.data ? (
        <ProjectInfo projectData={project.data} />
      ) : (
        <ProjectNotFound text={project.text ?? ""} />
      )}
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Project</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
