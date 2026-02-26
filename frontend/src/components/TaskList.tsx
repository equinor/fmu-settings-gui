import { Icon, Typography } from "@equinor/eds-core-react";
import { checkbox, warning_filled } from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { Link } from "@tanstack/react-router";

import { useTaskList } from "#services/tasks";
import { InfoBox } from "#styles/common";
import {
  TaskLabel,
  TaskListHeader,
  TaskProgressLabel,
  TaskRow,
} from "./TaskList.style";

export function TaskList() {
  const tasks = useTaskList();

  if (tasks.length === 0) {
    return null;
  }

  const completedCount = tasks.filter((t) => t.done).length;
  const allDone = completedCount === tasks.length;

  return (
    <InfoBox>
      <TaskListHeader>
        <Typography variant="h5">Setup Checklist</Typography>
        <TaskProgressLabel $allDone={allDone}>
          {completedCount} / {tasks.length} completed
        </TaskProgressLabel>
      </TaskListHeader>

      {tasks.map((task) => (
        <TaskRow key={task.id}>
          <Icon
            data={task.done ? checkbox : warning_filled}
            size={18}
            color={
              task.done
                ? tokens.colors.interactive.success__resting.hex
                : tokens.colors.interactive.warning__resting.hex
            }
          />
          {task.done ? (
            <TaskLabel>{task.label}</TaskLabel>
          ) : (
            <Typography link as={Link} to={task.to}>
              {task.label}
            </Typography>
          )}
        </TaskRow>
      ))}
    </InfoBox>
  );
}
