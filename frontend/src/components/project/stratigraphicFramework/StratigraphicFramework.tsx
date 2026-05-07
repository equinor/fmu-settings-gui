import type React from "react";
import { useMemo } from "react";

import type { RmsHorizon, RmsStratigraphicZone } from "#client";
import { FrameworkDataContext } from "./FrameworkData";
import { getZoneGridPlacement } from "./functions";
import {
  GridLine,
  StratigraphicFrameworkContainer,
  StratigraphicFrameworkContent,
  StratigraphicFrameworkHeader,
} from "./StratigraphicFramework.style";

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
  disablePointerEvents = false,
  children: [horizonsComponent, zonesComponent],
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
  disablePointerEvents?: boolean;
  children: React.ReactNode[];
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
      zoneGridPlacement,
      numStratColumns: Math.max(
        1,
        ...Array.from(zoneGridPlacement.values(), (z) => z.gridColumn - 1),
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
      $maxHeight={maxHeight}
      $disablePointerEvents={disablePointerEvents}
    >
      <StratigraphicFrameworkHeader
        $numStratColumns={frameworkData.numStratColumns}
      >
        <div>Horizons</div>
        <div>Zones</div>
      </StratigraphicFrameworkHeader>

      <StratigraphicFrameworkContent
        $numStratColumns={frameworkData.numStratColumns}
      >
        <FrameworkDataContext value={frameworkData}>
          {horizons.map((horizon, idx) => (
            <GridLine
              key={horizon.name}
              $rowStart={(idx + 1) * 3 - 1}
              $lineStyle={
                horizon.type.startsWith("interpreted") ? "solid" : "dashed"
              }
            />
          ))}

          {horizonsComponent}

          {zonesComponent}
        </FrameworkDataContext>
      </StratigraphicFrameworkContent>
    </StratigraphicFrameworkContainer>
  );
}
