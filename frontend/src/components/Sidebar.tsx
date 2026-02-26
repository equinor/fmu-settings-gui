import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import { account_circle, dashboard, folder } from "@equinor/eds-icons";
import { Link, useLocation } from "@tanstack/react-router";

import { useProject } from "#services/project";

type AccordianSubItem = {
  label: string;
  to: string;
};

export function Sidebar() {
  const project = useProject();
  const location = useLocation();

  const currentPath = location.pathname;

  const projectExpanded = currentPath.startsWith("/project");
  const userExpanded = currentPath.startsWith("/user");

  const ProjectSubItems: AccordianSubItem[] = [];
  if (project.status) {
    ProjectSubItems.push({ label: "Masterdata", to: "/project/masterdata" });
    ProjectSubItems.push({ label: "RMS", to: "/project/rms" });
  }

  return (
    <EdsSideBar open>
      <EdsSideBar.Content>
        <EdsSideBar.Link
          label="Home"
          icon={dashboard}
          as={Link}
          to="/"
          active={currentPath === "/"}
        />

        <EdsSideBar.Accordion
          label="Project"
          icon={folder}
          isExpanded={projectExpanded}
        >
          <EdsSideBar.AccordionItem
            label="Overview"
            as={Link}
            to="/project"
            active={currentPath === "/project"}
          />

          {ProjectSubItems.map((item) => (
            <EdsSideBar.AccordionItem
              key={item.to}
              label={item.label}
              as={Link}
              to={item.to}
              active={currentPath === item.to}
            />
          ))}
        </EdsSideBar.Accordion>

        <EdsSideBar.Accordion
          label="User"
          icon={account_circle}
          isExpanded={userExpanded}
        >
          <EdsSideBar.AccordionItem
            label="API keys"
            as={Link}
            to="/user/keys"
            active={currentPath === "/user/keys"}
          />
        </EdsSideBar.Accordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
