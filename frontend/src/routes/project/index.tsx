import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import type { FmuProject, LockStatus } from "#client/types.gen";
import { Loading } from "#components/common";
import { LockStatusBanner } from "#components/LockStatus";
import { EditableAccessInfo } from "#components/project/overview/Access";
import { EditableModelInfo } from "#components/project/overview/Model";
import { ProjectSelector } from "#components/project/overview/ProjectSelector";
import { useProject } from "#services/project";
import {
  InfoBox,
  PageCode,
  PageHeader,
  PageSectionSpacer,
  PageText,
} from "#styles/common";
import { displayDateTime } from "#utils/datetime";
export const Route = createFileRoute("/project/")({
  component: RouteComponent,
});

function ProjectInfoBox({ projectData }: { projectData: FmuProject }) {
  const created_date = displayDateTime(projectData.config.created_at);

  return (
    <InfoBox>
      <PageHeader $variant="h3" $marginBottom="0">
        {projectData.project_dir_name}
      </PageHeader>

      <PageText $marginBottom="0">
        <span className="emphasis">{projectData.path}</span>
        <br />
        Created: {created_date} by {projectData.config.created_by}
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
        <br />
        Version: {projectData.config.version}
      </PageText>
    </InfoBox>
  );
}

function ProjectInfo({
  projectData,
  lockStatus,
}: {
  projectData: FmuProject;
  lockStatus?: LockStatus;
}) {
  return (
    <>
      <ProjectInfoBox projectData={projectData} />

      <LockStatusBanner lockStatus={lockStatus} />
    </>
  );
}

function ProjectNotFound({ text }: { text: string }) {
  const hasText = text !== "";
  const lead = `No project selected${hasText ? ":" : "."}`;

  return (
    <>
      <PageText>{lead}</PageText>

      {hasText && <PageCode>{text}</PageCode>}
    </>
  );
}

function Content() {
  const project = useProject();
  const projectReadOnly = !(project.lockStatus?.is_lock_acquired ?? false);

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

          <EditableModelInfo
            projectData={project.data}
            projectReadOnly={projectReadOnly}
          />

          <PageSectionSpacer />

          <EditableAccessInfo
            projectData={project.data}
            projectReadOnly={projectReadOnly}
          />
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
