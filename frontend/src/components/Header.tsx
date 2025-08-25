import { Button, TopBar, Typography } from "@equinor/eds-core-react";
import { Link } from "@tanstack/react-router";

import fmuLogo from "../assets/fmu_logo.png";
import { useProject } from "../services/project";
import { FmuLogo, HeaderContainer, ProjectInfoContainer } from "./Header.style";

function ProjectInfo() {
  const { data: project } = useProject();
  return (
    <ProjectInfoContainer>
      Project:{" "}
      {project.status && project.data ? (
        <span>{project.data.project_dir_name}</span>
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
