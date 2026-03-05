import { Accordion, Icon, Typography } from "@equinor/eds-core-react";
import { checkbox, warning_filled } from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useTaskList } from "#services/tasks";
import {
  TaskCompletedLabel,
  TaskRow,
  TasksProgressLabel,
} from "./TaskList.style";

export function TaskList() {
  const tasks = useTaskList();
  const completedCount = tasks.filter((t) => t.done).length;
  const allDone = completedCount === tasks.length;
  const [open, setOpen] = useState(!allDone);

  useEffect(() => {
    if (allDone) setOpen(false);
  }, [allDone]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Accordion>
      <Accordion.Item isExpanded={open} onExpandedChange={setOpen}>
        <Accordion.Header>
          Project setup checklist
          <TasksProgressLabel $allDone={allDone}>
            {completedCount} / {tasks.length} completed
          </TasksProgressLabel>
        </Accordion.Header>
        <Accordion.Panel>
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
                <Typography link as={Link} to={task.to}>
                  {task.label}
                </Typography>
              )}
            </TaskRow>
          ))}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
