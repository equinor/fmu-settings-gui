import { Button, Tooltip } from "@equinor/eds-core-react";
import { Fragment } from "react/jsx-runtime";

import { RmsHorizon, RmsStratigraphicZone } from "#client";
import { findIndexByName, ZoneWithColumn } from "#services/stratigraphy";
import {
  GridLine,
  HorizonItem,
  StratigraphicFrameworkContainer,
  StratigraphicFrameworkContent,
  StratigraphicFrameworkHeader,
  ZoneItem,
} from "./StratigraphicFramework.style";

function ZoneTooltipContent(zone: RmsStratigraphicZone) {
  return (
    <>
      Name: {zone.name}
      <br />
      Top: {zone.top_horizon_name}
      <br />
      Base: {zone.base_horizon_name}
    </>
  );
}

export function StratigraphicFramework({
  horizons,
  zones,
  inactiveHorizonNames,
  inactiveZoneNames,
  orphanHorizonNames,
  orphanZoneNames,
  onZoneClick,
  onHorizonClick,
  maxHeight,
}: {
  horizons: RmsHorizon[];
  zones: ZoneWithColumn[];
  inactiveHorizonNames?: string[];
  inactiveZoneNames?: string[];
  orphanHorizonNames?: string[];
  orphanZoneNames?: string[];
  onZoneClick?: (zone: ZoneWithColumn, isInactive: boolean) => void;
  onHorizonClick?: (horizon: RmsHorizon, isInactive: boolean) => void;
  maxHeight?: string;
}) {
  const numStratColumns = Math.max(1, ...zones.map((z) => z.column));
  const numGridRows = Math.max(1, horizons.length * 2);
  const isInteractive = onZoneClick ?? onHorizonClick;

  const orphanHorizonNamesSet = new Set(orphanHorizonNames);
  const orphanZoneNamesSet = new Set(orphanZoneNames);
  const inactiveHorizonNamesSet = new Set(inactiveHorizonNames);
  const inactiveZoneNamesSet = new Set(inactiveZoneNames);

  const horizonsUsedByZones = new Set(
    zones
      .filter((z) => !inactiveZoneNamesSet.has(z.name))
      .flatMap((z) => [z.top_horizon_name, z.base_horizon_name]),
  );

  return (
    <StratigraphicFrameworkContainer
      $disablePointerEvents={!isInteractive}
      $maxHeight={maxHeight}
    >
      <StratigraphicFrameworkHeader $numStratColumns={numStratColumns}>
        <div>Horizons</div>
        <div>Zones</div>
      </StratigraphicFrameworkHeader>

      <StratigraphicFrameworkContent
        $numStratColumns={numStratColumns}
        $numRows={numGridRows}
      >
        {horizons.map((horizon, index) => {
          const rowStart = index * 2 + 1;
          const isOrphan = orphanHorizonNamesSet.has(horizon.name);
          const isUsedByZone = horizonsUsedByZones.has(horizon.name);
          const isInactive = inactiveHorizonNamesSet.has(horizon.name);

          return (
            <Fragment key={horizon.name}>
              <HorizonItem style={{ gridRow: `${rowStart} / span 2` }}>
                <Tooltip
                  title={
                    isOrphan
                      ? "Horizon does not exist in RMS"
                      : isUsedByZone
                        ? "Horizon is used by one or more zones"
                        : ""
                  }
                >
                  <Button
                    className={
                      isOrphan ? "orphan" : isInactive ? "inactive" : ""
                    }
                    onClick={() => onHorizonClick?.(horizon, isInactive)}
                    variant="ghost"
                    color={isOrphan ? "danger" : "primary"}
                    disabled={isUsedByZone && !isOrphan}
                  >
                    {horizon.name}
                  </Button>
                </Tooltip>
              </HorizonItem>

              <GridLine style={{ gridRow: rowStart }} />
            </Fragment>
          );
        })}

        {zones.map((zone) => {
          const topIndex = findIndexByName(horizons, zone.top_horizon_name);
          const baseIndex = findIndexByName(horizons, zone.base_horizon_name);
          const rowStart = topIndex * 2 + 2;
          const rowEnd = baseIndex * 2 + 2;
          const isOrphan = orphanZoneNamesSet.has(zone.name);
          const isInactive = inactiveZoneNamesSet.has(zone.name);

          return (
            <ZoneItem
              key={zone.name}
              style={{
                gridRow: `${rowStart} / ${rowEnd}`,
                gridColumn: zone.column + 1,
              }}
            >
              <Tooltip
                title={
                  isOrphan
                    ? "Zone does not exist in RMS"
                    : ZoneTooltipContent(zone)
                }
              >
                <Button
                  className={isOrphan ? "orphan" : isInactive ? "inactive" : ""}
                  onClick={() => onZoneClick?.(zone, isInactive)}
                  variant="ghost"
                  color={isOrphan ? "danger" : "secondary"}
                >
                  {zone.name}
                </Button>
              </Tooltip>
            </ZoneItem>
          );
        })}
      </StratigraphicFrameworkContent>
    </StratigraphicFrameworkContainer>
  );
}
