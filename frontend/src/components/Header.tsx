import {
  Button,
  Dialog,
  Icon,
  Popover,
  Tooltip,
  TopBar,
  Typography,
} from "@equinor/eds-core-react";
import {
  assignment,
  check,
  checkbox,
  comment,
  warning_filled,
} from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import fmuLogo from "#assets/fmu-logo.svg";
import type { LockInfo } from "#client/types.gen";
import { LockIcon } from "#components/LockStatus";
import { useProject } from "#services/project";
import { useTaskList } from "#services/tasks";
import { GenericDialog, PageText } from "#styles/common";
import { AppMenu } from "./AppMenu";
import {
  FmuLogo,
  HeaderActionButton,
  HeaderContainer,
  ProjectInfoContainer,
  ProjectInfoItemContainer,
  TaskBadgeCount,
  TaskBadgeDone,
  TaskBadgeWrapper,
  TaskIndicatorContainer,
  TopBarContainer,
} from "./Header.style";
import {
  TaskCompletedLabel,
  TaskRow,
  TasksProgressLabel,
} from "./home/TaskList.style";

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

      <GenericDialog
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
      </GenericDialog>
    </>
  );
}

function TaskIndicator() {
  const tasks = useTaskList();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (tasks.length === 0) {
    return null;
  }

  const pendingCount = tasks.filter((t) => !t.done).length;
  const allDone = pendingCount === 0;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <TaskIndicatorContainer>
      <HeaderActionButton
        aria-haspopup
        aria-expanded={isOpen}
        onClick={handleToggle}
        ref={setAnchorEl}
      >
        <TaskBadgeWrapper>
          <Icon data={assignment} />
          {allDone ? (
            <TaskBadgeDone>
              <Icon data={check} />
            </TaskBadgeDone>
          ) : (
            <TaskBadgeCount>{pendingCount}</TaskBadgeCount>
          )}
        </TaskBadgeWrapper>
      </HeaderActionButton>

      <Popover
        open={isOpen}
        onClose={handleClose}
        anchorEl={anchorEl}
        placement="bottom-end"
        trapFocus
      >
        <Popover.Header>
          <Popover.Title>Project setup checklist</Popover.Title>
        </Popover.Header>
        <Popover.Content>
          <TasksProgressLabel
            $allDone={allDone}
            $marginBottom={tokens.spacings.comfortable.small}
          >
            {tasks.length - pendingCount} / {tasks.length} completed
          </TasksProgressLabel>
          {tasks.map((task) => (
            <TaskRow key={task.id}>
              <Icon
                data={task.done ? checkbox : warning_filled}
                size={16}
                color={
                  task.done
                    ? tokens.colors.interactive.success__resting.hex
                    : tokens.colors.interactive.warning__resting.hex
                }
              />
              {task.done ? (
                <TaskCompletedLabel>{task.label}</TaskCompletedLabel>
              ) : (
                <Typography link as={Link} to={task.to} onClick={handleClose}>
                  {task.label}
                </Typography>
              )}
            </TaskRow>
          ))}
        </Popover.Content>
      </Popover>
    </TaskIndicatorContainer>
  );
}

export function Header() {
  return (
    <HeaderContainer>
      <TopBar>
        <TopBar.Header>
          <TopBarContainer>
            <AppMenu />
            <Button
              variant="ghost"
              as={Link}
              to="/"
              style={{ backgroundColor: "inherit" }}
            >
              <FmuLogo src={fmuLogo} />
            </Button>
            <Typography>FMU Settings</Typography>
          </TopBarContainer>
        </TopBar.Header>
        <TopBar.Actions>
          <TaskIndicator />
          <FeedbackDialog />
          <ProjectInfo />
        </TopBar.Actions>
      </TopBar>
    </HeaderContainer>
  );
}
