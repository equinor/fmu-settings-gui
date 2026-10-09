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
  cacheMaxRevisions?: number | undefined;
}) {
  return (
    <>
      <SnapshotHistory
        hasProject={hasProject}
        projectReadOnly={projectReadOnly}
        cacheMaxRevisions={cacheMaxRevisions}
      />

      {hasProject && (
        <>
          <PageSectionSpacer />
          <ProjectFileRecovery projectReadOnly={projectReadOnly} />
        </>
      )}
    </>
  );
}
