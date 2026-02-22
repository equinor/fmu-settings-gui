import { Button, Tooltip } from "@equinor/eds-core-react";
import { Fragment } from "react/jsx-runtime";

import type { RmsHorizon, RmsStratigraphicZone } from "#client";
import {
  GridLine,
  HorizonItem,
  StratigraphicFrameworkContainer,
  StratigraphicFrameworkContent,
  StratigraphicFrameworkHeader,
  ZoneItem,
} from "./StratigraphicFramework.style";
import { findIndexByName } from "./utils.ts";

type ZonePlacementInfo = {
  horizonIndices: number[];
  rowStart: number;
  rowEnd: number;
  gridColumn: number;
};

function getZoneGridPlacement(
  zones: RmsStratigraphicZone[],
  horizons: RmsHorizon[],
) {
  const defaultColumn = 1;
  const gridPlacement = new Map<string, ZonePlacementInfo>();

  zones.forEach((zone) => {
    const topHorizonIndex = findIndexByName(horizons, zone.top_horizon_name);
    const baseHorizonIndex = findIndexByName(horizons, zone.base_horizon_name);

    const horizonIndices: number[] = [];
    for (let i = topHorizonIndex; i < baseHorizonIndex; i++) {
      horizonIndices.push(i);
    }

    gridPlacement.set(zone.name, {
      horizonIndices,
      rowStart: topHorizonIndex,
      rowEnd: baseHorizonIndex,
      gridColumn: defaultColumn,
    });
  });

  const columnOccupancy = new Map<number, Set<number>>();

  // Sort to place zones with least horizon span size first
  Array.from(gridPlacement.values())
    .sort((a, b) => a.horizonIndices.length - b.horizonIndices.length)
    .forEach((info) => {
      let gridColumn = defaultColumn;
      let foundColumn = false;

      while (!foundColumn) {
        if (!columnOccupancy.has(gridColumn)) {
          columnOccupancy.set(gridColumn, new Set());
        }

        const occupied = columnOccupancy.get(gridColumn);
        if (!occupied) {
          throw new Error("Invalid stratigraphy grid state");
        }
        const hasOverlap = info.horizonIndices.some((idx) => occupied.has(idx));

        if (!hasOverlap) {
          info.horizonIndices.forEach((idx) => {
            occupied.add(idx);
          });
          info.gridColumn = gridColumn;
          foundColumn = true;
        } else {
          gridColumn++;
        }
      }
    });

  return gridPlacement;
}

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

function HorizonTooltipContent(
  horizon: RmsHorizon,
  isOrphan: boolean,
  isUsedByZone: boolean,
) {
  return (
    <>
      {horizon.name}
      <br />
      Type: {horizon.type}
      <br />
      {isOrphan
        ? "Horizon does not exist in RMS"
        : isUsedByZone
          ? "Horizon is used by one or more zones"
          : ""}
    </>
  );
}
export function StratigraphicFramework({
  horizons,
  zones,
  unselectedHorizonNames,
  unselectedZoneNames,
  orphanHorizonNames,
  orphanZoneNames,
  onZoneClick,
  onHorizonClick,
  maxHeight,
}: {
  horizons: RmsHorizon[];
  zones: RmsStratigraphicZone[];
  unselectedHorizonNames?: string[];
  unselectedZoneNames?: string[];
  orphanHorizonNames?: string[];
  orphanZoneNames?: string[];
  onZoneClick?: (zone: RmsStratigraphicZone, isUnselected: boolean) => void;
  onHorizonClick?: (horizon: RmsHorizon, isUnselected: boolean) => void;
  maxHeight?: string;
}) {
  const isInteractive = onZoneClick ?? onHorizonClick;
  const zoneGridPlacement = getZoneGridPlacement(zones, horizons);
  const numGridRows = Math.max(1, horizons.length * 2);
  const numStratColumns = Math.max(
    1,
    ...Array.from(zoneGridPlacement.values(), (z) => z.gridColumn),
  );
  const orphanHorizonNamesSet = new Set(orphanHorizonNames);
  const orphanZoneNamesSet = new Set(orphanZoneNames);
  const unselectedHorizonNamesSet = new Set(unselectedHorizonNames);
  const unselectedZoneNamesSet = new Set(unselectedZoneNames);

  const horizonsUsedByZones = new Set(
    zones
      .filter((z) => !unselectedZoneNamesSet.has(z.name))
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
          const isUnselected = unselectedHorizonNamesSet.has(horizon.name);

          return (
            <Fragment key={horizon.name}>
              <HorizonItem style={{ gridRow: `${rowStart} / span 2` }}>
                <Tooltip
                  title={HorizonTooltipContent(horizon, isOrphan, isUsedByZone)}
                >
                  <Button
                    className={
                      isOrphan ? "orphan" : isUnselected ? "unselected" : ""
                    }
                    onClick={() => onHorizonClick?.(horizon, isUnselected)}
                    variant="ghost"
                    color={isOrphan ? "danger" : "primary"}
                    disabled={isUsedByZone && !isOrphan}
                  >
                    {horizon.name}
                  </Button>
                </Tooltip>
              </HorizonItem>

              <GridLine
                $lineStyle={
                  horizon.type.startsWith("interpreted") ? "solid" : "dashed"
                }
                style={{ gridRow: rowStart }}
              />
            </Fragment>
          );
        })}

        {zones.map((zone) => {
          const grid = zoneGridPlacement.get(zone.name);
          if (!grid) {
            return null;
          }
          const isOrphan = orphanZoneNamesSet.has(zone.name);
          const isUnselected = unselectedZoneNamesSet.has(zone.name);

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
                  className={
                    isOrphan ? "orphan" : isUnselected ? "unselected" : ""
                  }
                  onClick={() => onZoneClick?.(zone, isUnselected)}
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
