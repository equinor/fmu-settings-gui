import { Typography } from "@equinor/eds-core-react";

import { FmuProject } from "#client";
import { InfoBox } from "#styles/common";

export function ProjectInfoBox({
  projectData,
  extended,
}: {
  projectData: FmuProject;
  extended?: boolean;
}) {
  const created_date = new Date(
    projectData.config.created_at,
  ).toLocaleDateString();

  return (
    <InfoBox>
      <Typography variant="h3">{projectData.project_dir_name}</Typography>
      <Typography token={{ fontSize: "14px" }}>
        {projectData.path} <br /> Last modified{" "}
        <span className="missingValue">unknown</span>{" "}
        {/* TODO: Add last modified date*/}
        {extended && (
          <>
            <br />
            Created {created_date} by {projectData.config.created_by}
            <br /> <br />
            FMU settings version {projectData.config.version}
          </>
        )}
      </Typography>
    </InfoBox>
  );
}
