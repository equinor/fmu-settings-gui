import { Button, TopBar, Typography } from "@equinor/eds-core-react";
import { Link } from "@tanstack/react-router";

import fmuLogo from "#assets/fmu_logo.png";
import { LockIcon } from "#components/LockInfo";
import { useProject } from "#services/project";
import { FmuLogo, HeaderContainer, ProjectInfoContainer } from "./Header.style";

function ProjectInfo() {
  const project = useProject();

  return (
    <ProjectInfoContainer>
      {project.status && project.data ? (
        <>
          <LockIcon
            isReadOnly={project.data.is_read_only ?? true}
            toolTipText={
              project.data.is_read_only && project.lockStatus?.lock_info
                ? `Project is locked by user ${project.lockStatus.lock_info.user} 
                   on host ${project.lockStatus.lock_info.hostname}`
                : "Project is open for editing"
            }
          />
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
