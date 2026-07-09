import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import type { IconData } from "@equinor/eds-icons";
import { account_circle, dashboard, folder } from "@equinor/eds-icons";
import { Link, useLocation } from "@tanstack/react-router";

import { useProject } from "#services/project";
import { NestedAccordion } from "./Sidebar.style";

// EDS requires an icon for accordion headers; a blank icon keeps nested labels aligned.
const blankIcon: IconData = {
  name: "blank",
  prefix: "eds",
  height: "24",
  width: "24",
  svgPathData: "",
};

type AccordionSubItem = {
  label: string;
  to: string;
  children?: AccordionSubItem[];
};

function SidebarItem({
  item,
  currentPath,
}: {
  item: AccordionSubItem;
  currentPath: string;
}) {
  if (item.children) {
    return (
      <NestedAccordion>
        <EdsSideBar.Accordion
          label={item.label}
          icon={blankIcon}
          isExpanded={currentPath.startsWith(item.to)}
        >
          {item.children.map((child) => (
            <SidebarItem
              key={child.to}
              item={child}
              currentPath={currentPath}
            />
          ))}
        </EdsSideBar.Accordion>
      </NestedAccordion>
    );
  }

  return (
    <EdsSideBar.AccordionItem
      label={item.label}
      as={Link}
      to={item.to}
      active={currentPath === item.to}
    />
  );
}

export function Sidebar() {
  const project = useProject();
  const location = useLocation();

  const currentPath = location.pathname;

  const projectExpanded = currentPath.startsWith("/project");
  const userExpanded = currentPath.startsWith("/user");

  const ProjectSubItems: AccordionSubItem[] = [];
  if (project.status) {
    ProjectSubItems.push({ label: "Masterdata", to: "/project/masterdata" });
    ProjectSubItems.push({
      label: "RMS",
      to: "/project/rms",
      children: [
        { label: "Overview", to: "/project/rms/overview" },
        { label: "Stratigraphy", to: "/project/rms/stratigraphy" },
        { label: "Wellbores", to: "/project/rms/wellbores" },
      ],
    });
    ProjectSubItems.push({
      label: "Mappings",
      to: "/project/mappings",
      children: [
        { label: "Overview", to: "/project/mappings/overview" },
        { label: "Stratigraphy", to: "/project/mappings/stratigraphy" },
        { label: "Wellbores", to: "/project/mappings/wellbores" },
      ],
    });
    ProjectSubItems.push({ label: "History", to: "/project/history" });
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
            <SidebarItem key={item.to} item={item} currentPath={currentPath} />
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

          <EdsSideBar.AccordionItem
            label="Recovery"
            as={Link}
            to="/user/recovery"
            active={currentPath === "/user/recovery"}
          />
        </EdsSideBar.Accordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
