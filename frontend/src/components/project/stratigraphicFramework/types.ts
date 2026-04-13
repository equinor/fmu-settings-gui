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
  onHorizonClick?: (horizon: RmsHorizon, isUnselected: boolean) => void;
  onZoneClick?: (zone: RmsStratigraphicZone, isUnselected: boolean) => void;
  isInteractive: boolean;
  zoneGridPlacement: Map<string, ZonePlacementInfo>;
  numGridRows: number;
  numStratColumns: number;
};
