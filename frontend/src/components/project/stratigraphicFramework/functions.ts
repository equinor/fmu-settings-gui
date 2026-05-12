import { use } from "react";

import type { RmsHorizon, RmsStratigraphicZone } from "#client";
import { FrameworkDataContext } from "./FrameworkData";
import type { HorizonLineStyle, ZonePlacementInfo } from "./types";
import { findIndexByName } from "./utils";

export function useFrameworkData() {
  const data = use(FrameworkDataContext);

  if (data === null) {
    throw new Error("Stratigraphy framework data is not set");
  }

  return data;
}

export function getHorizonLineStyle(horizon: RmsHorizon): HorizonLineStyle {
  return horizon.type.startsWith("interpreted") ? "solid" : "dashed";
}

export function getZoneGridPlacement(
  zones: RmsStratigraphicZone[],
  horizons: RmsHorizon[],
) {
  const defaultColumn = 2;
  const gridPlacement = new Map<string, ZonePlacementInfo>();

  zones.forEach((zone) => {
    const topHorizonIndex = findIndexByName(horizons, zone.top_horizon_name);
    const baseHorizonIndex = findIndexByName(horizons, zone.base_horizon_name);
    if (topHorizonIndex < 0 || baseHorizonIndex < 0) {
      console.warn(
        "Top or base horizon for zone",
        zone.name,
        "not found when calculcating grid placement, ignoring this zone",
      );

      return;
    }

    const horizonIndices: number[] = [];
    for (let i = topHorizonIndex; i < baseHorizonIndex; i++) {
      horizonIndices.push(i);
    }

    gridPlacement.set(zone.name, {
      horizonIndices,
      rowStart: topHorizonIndex + 1,
      rowEnd: baseHorizonIndex + 1,
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
