import { Button, Tooltip } from "@equinor/eds-core-react";

import type { RmsStratigraphicZone } from "#client";
import { useFrameworkData } from "../stratigraphicFramework/functions.ts";
import { ZoneItem } from "./StratigraphicFramework.style";

function ZoneTooltipContent(zone: RmsStratigraphicZone, isOrphan: boolean) {
  return (
    <>
      {zone.name}
      <br />
      Top: {zone.top_horizon_name}
      <br />
      Base: {zone.base_horizon_name}
      <br />
      {isOrphan ? "Zone does not exist in RMS" : ""}
    </>
  );
}

export function Zones() {
  const frameworkData = useFrameworkData();

  return frameworkData.zones.map((zone) => {
    const grid = frameworkData.zoneGridPlacement.get(zone.name);

    if (!grid) {
      return null;
    }

    const isOrphan = frameworkData.orphanZoneNamesSet.has(zone.name);
    const isUnselected = frameworkData.unselectedZoneNamesSet.has(zone.name);

    return (
      <ZoneItem
        key={zone.name}
        style={{
          gridRow: `${grid.rowStart * 2 + 2} / ${grid.rowEnd * 2 + 2}`,
          gridColumn: grid.gridColumn + 1,
        }}
      >
        <Tooltip title={ZoneTooltipContent(zone, isOrphan)}>
          <Button
            className={isOrphan ? "orphan" : isUnselected ? "unselected" : ""}
            onClick={() => frameworkData.onZoneClick?.(zone, isUnselected)}
            variant="ghost"
            color={isOrphan ? "danger" : "secondary"}
          >
            {zone.name}
          </Button>
        </Tooltip>
      </ZoneItem>
    );
  });
}
