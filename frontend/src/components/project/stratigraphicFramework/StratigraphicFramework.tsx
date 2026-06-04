import { Icon } from "@equinor/eds-core-react";
import { collapse, expand } from "@equinor/eds-icons";
import { useLocation } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useState } from "react";

import type { RmsHorizon, RmsStratigraphicZone } from "#client";
import { PageSectionWidthConstrained } from "#styles/common";
import {
  getStorageItem,
  STORAGENAME_PAGESECTION_NOTWIDTHCONSTRAINED_BASE,
  setStorageItem,
} from "#utils/storage";
import { FrameworkDataContext } from "./FrameworkData";
import { getHorizonLineStyle, getZoneGridPlacement } from "./functions";
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
  enableWidthExpansion = false,
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
  enableWidthExpansion?: boolean;
  children: React.ReactNode[];
}) {
  const locationPathname = useLocation({
    select: (location) => location.pathname,
  });
  const storageKeyWidthConstraint = [
    STORAGENAME_PAGESECTION_NOTWIDTHCONSTRAINED_BASE,
    "stratigraphicFramework",
    locationPathname,
  ].join("-");

  const [notWidthConstrained, setNotWidthConstrained] = useState(
    enableWidthExpansion &&
      getStorageItem(sessionStorage, storageKeyWidthConstraint, "boolean"),
  );

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

  function toggleNotWidthConstraint() {
    setNotWidthConstrained((notWidthConstrained) => {
      setStorageItem(
        sessionStorage,
        storageKeyWidthConstraint,
        !notWidthConstrained,
      );

      return !notWidthConstrained;
    });
  }

  return (
    <PageSectionWidthConstrained $notConstrained={notWidthConstrained}>
      <StratigraphicFrameworkContainer
        $maxHeight={maxHeight}
        $disablePointerEvents={disablePointerEvents}
      >
        <StratigraphicFrameworkHeader
          $numStratColumns={frameworkData.numStratColumns}
        >
          <div>Horizons</div>
          <div>Zones</div>
          {enableWidthExpansion && (
            <div>
              <Icon
                data={notWidthConstrained ? collapse : expand}
                title={
                  notWidthConstrained
                    ? "Expand to full width"
                    : "Collapse width"
                }
                size={16}
                onClick={toggleNotWidthConstraint}
              />
            </div>
          )}
        </StratigraphicFrameworkHeader>

        <StratigraphicFrameworkContent
          $numStratColumns={frameworkData.numStratColumns}
        >
          <FrameworkDataContext value={frameworkData}>
            {horizons.map((horizon, idx) => (
              <GridLine
                key={horizon.name}
                $rowStart={(idx + 1) * 3 - 1}
                $lineStyle={getHorizonLineStyle(horizon)}
              ></GridLine>
            ))}

            {horizonsComponent}

            {zonesComponent}
          </FrameworkDataContext>
        </StratigraphicFrameworkContent>
      </StratigraphicFrameworkContainer>
    </PageSectionWidthConstrained>
  );
}
