import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import type { IconData } from "@equinor/eds-icons";
import { account_circle, dashboard, folder } from "@equinor/eds-icons";
import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

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

type SidebarAccordionState = {
  expanded: boolean;
  collapsedPath: string | undefined;
};

function SidebarAccordion({
  label,
  icon,
  path,
  currentPath,
  children,
}: {
  label: string;
  icon: IconData;
  path: string;
  currentPath: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<SidebarAccordionState>(() => ({
    expanded: currentPath.startsWith(path),
    collapsedPath: undefined,
  }));
  const isExpanded =
    state.expanded ||
    (currentPath.startsWith(path) && state.collapsedPath !== currentPath);

  const toggleExpand = () => {
    const expanded = !isExpanded;
    setState({
      expanded,
      collapsedPath: expanded ? undefined : currentPath,
    });
  };

  return (
    <EdsSideBar.Accordion
      label={label}
      icon={icon}
      isExpanded={isExpanded}
      toggleExpand={toggleExpand}
    >
      {children}
    </EdsSideBar.Accordion>
  );
}

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
        <SidebarAccordion
          label={item.label}
          icon={blankIcon}
          path={item.to}
          currentPath={currentPath}
        >
          {item.children.map((child) => (
            <SidebarItem
              key={child.to}
              item={child}
              currentPath={currentPath}
            />
          ))}
        </SidebarAccordion>
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

  const ProjectSubItems: AccordionSubItem[] = [];
  if (project.status) {
    ProjectSubItems.push({ label: "Masterdata", to: "/project/masterdata" });
    ProjectSubItems.push({
      label: "RMS",
      to: "/project/rms",
      children: [
        { label: "Overview", to: "/project/rms" },
        { label: "Stratigraphy", to: "/project/rms/stratigraphy" },
        { label: "Wellbores", to: "/project/rms/wellbores" },
      ],
    });
    ProjectSubItems.push({
      label: "Mappings",
      to: "/project/mappings",
      children: [
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

        <SidebarAccordion
          label="Project"
          icon={folder}
          path="/project"
          currentPath={currentPath}
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
        </SidebarAccordion>

        <SidebarAccordion
          label="User"
          icon={account_circle}
          path="/user"
          currentPath={currentPath}
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
        </SidebarAccordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
