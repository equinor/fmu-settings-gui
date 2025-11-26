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
  ProjectInfoContainer,
} from "#styles/common";

export const Route = createFileRoute("/project/")({
  component: RouteComponent,
});

import { ProjectInfoBox } from "#components/ProjectInfo";
import { ProjectStatus } from "#components/ProjectStatus";

function ProjectInfo({
  projectData,
  lockStatus,
}: {
  projectData: FmuProject;
  lockStatus?: LockStatus;
}) {
  return (
    <ProjectInfoContainer>
      <div>
        <ProjectInfoBox projectData={projectData} extended={true} />
        <LockStatusBanner
          lockStatus={lockStatus}
          isReadOnly={projectData.is_read_only ?? true}
        />
      </div>

      <ProjectStatus projectData={projectData} detailed={true} />
    </ProjectInfoContainer>
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
