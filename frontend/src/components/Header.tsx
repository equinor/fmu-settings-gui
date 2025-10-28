import { Button, Tooltip, TopBar, Typography } from "@equinor/eds-core-react";
import { Link } from "@tanstack/react-router";

import fmuLogo from "#assets/fmu_logo.png";
import { LockInfo } from "#client/types.gen";
import { LockIcon } from "#components/LockStatus";
import { useProject } from "#services/project";
import {
  FmuLogo,
  HeaderContainer,
  ProjectInfoContainer,
  ProjectInfoItemContainer,
} from "./Header.style";

function LockStatusIcon({
  isReadOnly,
  lockInfo,
}: {
  isReadOnly: boolean;
  lockInfo: LockInfo | null | undefined;
}) {
  return (
    <Tooltip
      title={
        isReadOnly
          ? "Project is read-only" +
            (lockInfo
              ? ` and locked by ${lockInfo.user}@${lockInfo.hostname}`
              : "")
          : "Project is editable"
      }
    >
      <span>
        <LockIcon isReadOnly={isReadOnly} />
      </span>
    </Tooltip>
  );
}

function ProjectInfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <ProjectInfoItemContainer>
      <Typography variant="caption">{label}</Typography>
      <Typography bold color={value ? undefined : "warning"}>
        {value ?? "not set"}
      </Typography>
    </ProjectInfoItemContainer>
  );
}

function ProjectInfo() {
  const project = useProject();

  return (
    <ProjectInfoContainer>
      {project.status && project.data ? (
        <>
          <LockStatusIcon
            isReadOnly={project.data.is_read_only ?? true}
            lockInfo={project.lockStatus?.lock_info}
          />
          <ProjectInfoItem
            label="Asset"
            value={project.data.config.access?.asset.name}
          />
          <ProjectInfoItem
            label="Model"
            value={project.data.config.model?.name}
          />
          <ProjectInfoItem
            label="Revision"
            value={project.data.config.model?.revision}
          />
        </>
      ) : (
        "No project selected"
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
