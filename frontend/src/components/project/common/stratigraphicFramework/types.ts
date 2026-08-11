import type { RmsHorizon, RmsStratigraphicZone } from "#client";

export type ItemType = RmsHorizon | RmsStratigraphicZone;

export type ZonePlacementInfo = {
  horizonIndices: number[];
  rowStart: number;
  rowEnd: number;
  gridColumn: number;
};

export type FrameworkData = {
  horizons: RmsHorizon[];
  zones: RmsStratigraphicZone[];
  orphanHorizonNamesSet: Set<string>;
  orphanZoneNamesSet: Set<string>;
  unselectedHorizonNamesSet: Set<string>;
  unselectedZoneNamesSet: Set<string>;
  horizonsUsedByZones: Set<string>;
  onHorizonClick?:
    | ((horizon: RmsHorizon, isUnselected: boolean) => void)
    | undefined;
  onZoneClick?:
    | ((zone: RmsStratigraphicZone, isUnselected: boolean) => void)
    | undefined;
  zoneGridPlacement: Map<string, ZonePlacementInfo>;
  numStratColumns: number;
};

export type HorizonLineStyle = "solid" | "dashed";
