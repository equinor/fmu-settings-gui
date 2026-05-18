import { PageSectionSpacer } from "#styles/common";
import { ProjectFileRecovery } from "./ProjectFileRecovery";
import { SnapshotHistory } from "./SnapshotHistory";

export function Overview({
  hasProject,
  projectReadOnly,
  cacheMaxRevisions,
}: {
  hasProject: boolean;
  projectReadOnly: boolean;
  cacheMaxRevisions?: number;
}) {
  return (
    <>
      <SnapshotHistory
        hasProject={hasProject}
        projectReadOnly={projectReadOnly}
        cacheMaxRevisions={cacheMaxRevisions}
      />

      <PageSectionSpacer />

      <ProjectFileRecovery
        hasProject={hasProject}
        projectReadOnly={projectReadOnly}
      />
    </>
  );
}
