import { SideBar as EdsSideBar } from "@equinor/eds-core-react";
import {
  account_circle,
  dashboard,
  folder,
  settings,
  shuffle,
} from "@equinor/eds-icons";
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
        <EdsSideBar.Link
          label="Directory"
          icon={folder}
          as={Link}
          to="/directory"
        />
        <EdsSideBar.Accordion label="General" icon={settings}>
          <EdsSideBar.AccordionItem label="Overview" as={Link} to="/general" />
          <EdsSideBar.AccordionItem label="SMDA" as={Link} to="/general/smda" />
        </EdsSideBar.Accordion>
        <EdsSideBar.Accordion label="Mappings" icon={shuffle}>
          <EdsSideBar.AccordionItem label="Overview" as={Link} to="/mappings" />
        </EdsSideBar.Accordion>
      </EdsSideBar.Content>
    </EdsSideBar>
  );
}
