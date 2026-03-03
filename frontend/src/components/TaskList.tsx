import { Accordion, Icon, Typography } from "@equinor/eds-core-react";
import { checkbox, warning_filled } from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useTaskList } from "#services/tasks";
import { TaskLabel, TaskProgressLabel, TaskRow } from "./TaskList.style";

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
          Setup Checklist
          <TaskProgressLabel $allDone={allDone}>
            {completedCount} / {tasks.length} completed
          </TaskProgressLabel>
        </Accordion.Header>
        <Accordion.Panel>
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
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
