import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { FmuProject, LockStatus } from "#client/types.gen";
import { Loading } from "#components/common";
import { LockStatusBanner } from "#components/LockStatus";
import { EditableAccessInfo } from "#components/project/overview/Access";
import { EditableModelInfo } from "#components/project/overview/Model";
import { ProjectSelector } from "#components/project/overview/ProjectSelector";
import { useProject } from "#services/project";
import {
  PageCode,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { displayDateTime } from "#utils/datetime";
import { ProjectName } from "./index.style";
export const Route = createFileRoute("/project/")({
  component: RouteComponent,
});

function ProjectInfo({
  projectData,
  lockStatus,
}: {
  projectData: FmuProject;
  lockStatus?: LockStatus;
}) {
  return (
    <>
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

      <LockStatusBanner
        lockStatus={lockStatus}
        isReadOnly={projectData.is_read_only ?? true}
      />
    </>
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
  const project = useProject();

  return (
    <>
      {project.status && project.data ? (
        <>
          <ProjectInfo
            projectData={project.data}
            lockStatus={project.lockStatus}
          />
          <ProjectSelector />

          <PageSectionSpacer />

          <EditableModelInfo projectData={project.data} />

          <PageSectionSpacer />

          <EditableAccessInfo projectData={project.data} />
        </>
      ) : (
        <>
          <ProjectNotFound text={project.text ?? ""} />
          <ProjectSelector />
        </>
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
