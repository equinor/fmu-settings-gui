import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import { account_circle, dashboard, folder } from "@equinor/eds-icons";
import { Link } from "@tanstack/react-router";

export function Sidebar() {
  return (
    <EdsSideBar open>
      <EdsSideBar.Content>
        <EdsSideBar.Link label="Home" icon={dashboard} as={Link} to="/" />
        <EdsSideBar.Accordion label="User" icon={account_circle}>
          <EdsSideBar.AccordionItem
            label="API keys"
            as={Link}
            to="/user/keys"
          />
        </EdsSideBar.Accordion>
        <EdsSideBar.Accordion label="Project" icon={folder}>
          <EdsSideBar.AccordionItem
            label="Overview"
            as={Link}
            to="/project/overview"
          />
          <EdsSideBar.AccordionItem
            label="Masterdata"
            as={Link}
            to="/project/masterdata"
          />
        </EdsSideBar.Accordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
