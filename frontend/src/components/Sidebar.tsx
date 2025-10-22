import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import { account_circle, dashboard, folder } from "@equinor/eds-icons";
import { Link } from "@tanstack/react-router";

import { useProject } from "#services/project";

type AccordianSubItem = {
  label: string;
  to: string;
};

export function Sidebar() {
  const project = useProject();

  const ProjectSubItems: AccordianSubItem[] = [];
  if (project.status) {
    ProjectSubItems.push({ label: "Masterdata", to: "/project/masterdata" });
  }

  return (
    <EdsSideBar open>
      <EdsSideBar.Content>
        <EdsSideBar.Link label="Home" icon={dashboard} as={Link} to="/" />
        <EdsSideBar.Accordion label="Project" icon={folder}>
          <EdsSideBar.AccordionItem label="Overview" as={Link} to="/project" />
          {ProjectSubItems.map((item) => (
            <EdsSideBar.AccordionItem
              key={item.to}
              label={item.label}
              as={Link}
              to={item.to}
            />
          ))}
        </EdsSideBar.Accordion>
        <EdsSideBar.Accordion label="User" icon={account_circle}>
          <EdsSideBar.AccordionItem
            label="API keys"
            as={Link}
            to="/user/keys"
          />
        </EdsSideBar.Accordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
