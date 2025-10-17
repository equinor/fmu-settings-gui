import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { FmuProject, LockStatus } from "#client";
import { Loading } from "#components/common";
import { LockInfoPopOver } from "#components/LockInfo";
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

      {projectData.is_read_only && lockStatus?.lock_info && (
        <LockInfoPopOver lock_info={lockStatus.lock_info} />
      )}
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
