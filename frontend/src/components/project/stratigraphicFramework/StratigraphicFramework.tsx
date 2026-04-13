import { Button, Tooltip } from "@equinor/eds-core-react";
import type React from "react";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";

import type { RmsHorizon, RmsStratigraphicZone } from "#client";
import { FrameworkDataContext } from "./FrameworkData";
import { getZoneGridPlacement } from "./functions";
import {
  GridLine,
  HorizonItem,
  StratigraphicFrameworkContainer,
  StratigraphicFrameworkContent,
  StratigraphicFrameworkHeader,
} from "./StratigraphicFramework.style";

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
  children,
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
  children: React.ReactNode;
}) {
  const frameworkData = useMemo(() => {
    const zoneGridPlacement = getZoneGridPlacement(zones, horizons);
    const unselectedZoneNamesSet = new Set(unselectedZoneNames);

    return {
      horizons,
      zones,
      orphanHorizonNamesSet: new Set(orphanHorizonNames),
      orphanZoneNamesSet: new Set(orphanZoneNames),
      unselectedHorizonNamesSet: new Set(unselectedHorizonNames),
      unselectedZoneNamesSet,
      horizonsUsedByZones: new Set(
        zones
          .filter((z) => !unselectedZoneNamesSet.has(z.name))
          .flatMap((z) => [z.top_horizon_name, z.base_horizon_name]),
      ),
      onHorizonClick,
      onZoneClick,
      isInteractive: Boolean(onZoneClick ?? onHorizonClick),
      zoneGridPlacement,
      numGridRows: Math.max(1, horizons.length * 2),
      numStratColumns: Math.max(
        1,
        ...Array.from(zoneGridPlacement.values(), (z) => z.gridColumn),
      ),
    };
  }, [
    horizons,
    zones,
    orphanHorizonNames,
    orphanZoneNames,
    unselectedHorizonNames,
    unselectedZoneNames,
    onHorizonClick,
    onZoneClick,
  ]);

  return (
    <StratigraphicFrameworkContainer
      $disablePointerEvents={!frameworkData.isInteractive}
      $maxHeight={maxHeight}
    >
      <StratigraphicFrameworkHeader
        $numStratColumns={frameworkData.numStratColumns}
      >
        <div>Horizons</div>
        <div>Zones</div>
      </StratigraphicFrameworkHeader>

      <StratigraphicFrameworkContent
        $numStratColumns={frameworkData.numStratColumns}
        $numRows={frameworkData.numGridRows}
      >
        {horizons.map((horizon, index) => {
          const rowStart = index * 2 + 1;
          const isOrphan = frameworkData.orphanHorizonNamesSet.has(
            horizon.name,
          );
          const isUsedByZone = frameworkData.horizonsUsedByZones.has(
            horizon.name,
          );
          const isUnselected = frameworkData.unselectedHorizonNamesSet.has(
            horizon.name,
          );

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

        <FrameworkDataContext value={frameworkData}>
          {children}
        </FrameworkDataContext>
      </StratigraphicFrameworkContent>
    </StratigraphicFrameworkContainer>
  );
}
