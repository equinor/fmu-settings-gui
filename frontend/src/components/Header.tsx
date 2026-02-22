import {
  Button,
  Dialog,
  Icon,
  Tooltip,
  TopBar,
  Typography,
} from "@equinor/eds-core-react";
import { comment } from "@equinor/eds-icons";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import fmuLogo from "#assets/fmu_logo.png";
import type { LockInfo } from "#client/types.gen";
import { LockIcon } from "#components/LockStatus";
import { useProject } from "#services/project";
import { EditDialog, PageText } from "#styles/common";
import {
  FmuLogo,
  HeaderActionButton,
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
  const lockStatus = project.lockStatus;

  return (
    <ProjectInfoContainer>
      {project.status && project.data ? (
        <>
          <LockStatusIcon
            isReadOnly={!(lockStatus?.is_lock_acquired ?? false)}
            lockInfo={lockStatus?.lock_info}
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

function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => {
    setIsOpen(false);
  };
  const openDialog = () => {
    setIsOpen(true);
  };

  return (
    <>
      <HeaderActionButton onClick={openDialog}>
        Feedback <Icon data={comment} size={18} />
      </HeaderActionButton>

      <EditDialog
        isDismissable={true}
        open={isOpen}
        onClose={closeDialog}
        $maxWidth="32em"
      >
        <Dialog.Header>Let us know what you think</Dialog.Header>

        <Dialog.Content>
          <PageText>
            We are actively developing FMU Settings and always welcome your
            feedback! Your insights help us prioritize our efforts.
          </PageText>

          <PageText>
            We prefer open feedback on{" "}
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://app.slack.com/client/E086B9P9JM9/C09MFKN4NC9"
            >
              Slack
            </Typography>{" "}
            or{" "}
            <Typography
              link
              target="_blank"
              rel="noopener noreferrer"
              href="https://engage.cloud.microsoft/main/org/statoil.com/groups/eyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiI3OTMyMjAxIn0"
            >
              Viva Engage
            </Typography>
            . However, you can also contact the{" "}
            <Typography link href="mailto:fg_fmu-atlas@equinor.com">
              Atlas
            </Typography>{" "}
            team directly.
          </PageText>

          <PageText>Thanks! 🙏</PageText>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onClick={closeDialog}>Close</Button>
        </Dialog.Actions>
      </EditDialog>
    </>
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
          <FeedbackDialog />
          <ProjectInfo />
        </TopBar.Actions>
      </TopBar>
    </HeaderContainer>
  );
}
