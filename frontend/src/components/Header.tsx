import { Button, Tooltip, TopBar, Typography } from "@equinor/eds-core-react";
import { Link } from "@tanstack/react-router";

import fmuLogo from "#assets/fmu_logo.png";
import { LockIcon } from "#components/LockStatus";
import { useProject } from "#services/project";
import { FmuLogo, HeaderContainer, ProjectInfoContainer } from "./Header.style";

function ProjectInfo() {
  const project = useProject();
  const lockInfo = project.lockStatus?.lock_info;

  return (
    <ProjectInfoContainer>
      {project.status && project.data ? (
        <>
          <Tooltip
            title={
              project.data.is_read_only
                ? "Project is read-only" +
                  (lockInfo
                    ? ` and locked by ${lockInfo.user}@${lockInfo.hostname}`
                    : "")
                : "Project is editable"
            }
          >
            <span>
              <LockIcon isReadOnly={project.data.is_read_only ?? true} />
            </span>
          </Tooltip>
          <span> {project.data.project_dir_name}</span>
        </>
      ) : (
        "(not set)"
      )}
    </ProjectInfoContainer>
  );
}

export function Header() {
  return (
    <HeaderContainer>
      <TopBar>
        <TopBar.Header>
          <Button
            variant="ghost"
            as={Link}
            to="/"
            style={{ backgroundColor: "inherit" }}
          >
            <FmuLogo src={fmuLogo} />
          </Button>
          <Typography variant="h1_bold">FMU Settings</Typography>
        </TopBar.Header>
        <TopBar.Actions>
          <ProjectInfo />
        </TopBar.Actions>
      </TopBar>
    </HeaderContainer>
  );
}
