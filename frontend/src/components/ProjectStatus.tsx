import { Button, Icon, Tooltip, Typography } from "@equinor/eds-core-react";
import {
  check,
  close,
  error_outlined,
  go_to,
  thumbs_up,
  warning_outlined,
} from "@equinor/eds-icons";
import { tokens } from "@equinor/eds-tokens";
import { Link } from "@tanstack/react-router";

import { FmuProject } from "#client/types.gen";
import {
  ProjectStatusContainer,
  ProjectStatusHeader,
  ProjectStatusIconContainer,
  StatusChecksContainer,
} from "./ProjectStatus.style";

Icon.add({
  warning_outlined,
  close,
  error_outlined,
  check,
  thumbs_up,
  go_to,
});

type Status = "success" | "warning" | "error";

type StatusCheck = {
  description: string;
  status: Status;
};

function doProjectStatusChecks(projectData: FmuProject) {
  const has_masterdata = !!projectData.config.masterdata;
  const has_access = !!projectData.config.access;
  const has_model = !!projectData.config.model;

  const checks: StatusCheck[] = [
    {
      description: "Masterdata is " + (has_masterdata ? "present" : "missing"),
      status: has_masterdata ? "success" : "error",
    },
    {
      description:
        "Access information is " + (has_access ? "present" : "missing"),
      status: has_access ? "success" : "error",
    },
    {
      description:
        "Model information is " + (has_model ? "present" : "missing"),
      status: has_model ? "success" : "error",
    },
  ];

  return checks;
}

function getIconForStatus(status: Status) {
  switch (status) {
    case "success":
      return (
        <Icon
          name={"check"}
          color={tokens.colors.interactive.success__resting.hex}
        />
      );
    case "warning":
      return (
        <Icon
          name={"warning_outlined"}
          color={tokens.colors.interactive.warning__resting.hex}
        />
      );
    case "error":
      return (
        <Icon
          name={"close"}
          color={tokens.colors.interactive.danger__resting.hex}
        />
      );
  }
}

function StatusInfoTable({
  statusChecks,
  detailed = false,
}: {
  statusChecks: StatusCheck[];
  detailed?: boolean;
}) {
  const order: Status[] = ["error", "warning", "success"];

  return (
    <StatusChecksContainer>
      <table>
        <tbody>
          {statusChecks
            .filter((check) => detailed || check.status !== "success")
            .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
            .map((check) => (
              <tr key={check.description}>
                <td>
                  <Typography variant="cell_text" group="table">
                    {check.description}
                  </Typography>
                </td>
                <td>{getIconForStatus(check.status)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </StatusChecksContainer>
  );
}

export function ProjectStatus({
  projectData,
  detailed = false,
}: {
  projectData: FmuProject;
  detailed?: boolean;
}) {
  const statusChecks = doProjectStatusChecks(projectData);

  const hasError = statusChecks.some((check) => check.status === "error");
  const hasWarning = statusChecks.some((check) => check.status === "warning");

  const variant = hasError ? "error" : hasWarning ? "warning" : "success";

  return (
    <ProjectStatusContainer>
      <ProjectStatusHeader>
        <ProjectStatusIconContainer $variant={variant}>
          <Icon
            name={
              hasError
                ? "error_outlined"
                : hasWarning
                  ? "warning_outlined"
                  : "thumbs_up"
            }
          />
        </ProjectStatusIconContainer>

        <div>
          <Typography variant="h6">Project status</Typography>
          <Typography token={{ fontSize: "14px" }}>
            {hasError
              ? "Some checks need attention"
              : hasWarning
                ? "Some checks may require review"
                : "All checks passed"}
          </Typography>
        </div>

        {!detailed && (
          <Tooltip title="View details in project overview">
            <Button variant="ghost_icon" as={Link} to="/project">
              <Icon name="go_to" />
            </Button>
          </Tooltip>
        )}
      </ProjectStatusHeader>

      {detailed && (
        <StatusInfoTable statusChecks={statusChecks} detailed={true} />
      )}
    </ProjectStatusContainer>
  );
}
