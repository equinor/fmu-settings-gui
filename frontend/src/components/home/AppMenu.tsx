import { Button, Icon, Popover, Typography } from "@equinor/eds-core-react";
import { apps } from "@equinor/eds-icons";
import { useState } from "react";

import fmuLogo from "#assets/fmu-logo.svg";
import sumoLogo from "#assets/sumo.svg";
import webvizLogo from "#assets/webviz-logo.svg";
import { AppWrapper } from "./AppMenu.style";

export function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        aria-haspopup
        aria-expanded={isOpen}
        variant="ghost"
        onClick={handleOpen}
        ref={setAnchorEl}
        style={{ paddingInline: "8px" }}
      >
        <Icon data={apps} />
      </Button>
      <Popover
        open={isOpen}
        onClose={handleClose}
        anchorEl={anchorEl}
        placement="bottom-start"
        trapFocus
      >
        <Popover.Content>
          <AppWrapper>
            <Button
              as="a"
              variant="ghost"
              href="https://webviz.fmu.equinor.com/"
              target="_blank"
            >
              <img src={webvizLogo} alt="Webviz" />
              <Typography variant="h6">Webviz</Typography>
            </Button>
            <Button
              as="a"
              variant="ghost"
              href="https://fmu.equinor.com/"
              target="_blank"
            >
              <img src={fmuLogo} alt="FMU Hub" />
              <Typography variant="h6">FMU Hub</Typography>
            </Button>
            <Button
              as="a"
              variant="ghost"
              href="https://sumo.fmu.equinor.com/"
              target="_blank"
            >
              <img src={sumoLogo} alt="Sumo" />
              <Typography variant="h6">Sumo</Typography>
            </Button>
          </AppWrapper>
        </Popover.Content>
      </Popover>
    </>
  );
}
