import type {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  Smda,
  StratigraphicColumn,
} from "#client";

export type IdentifierUuidType =
  | CoordinateSystem
  | CountryItem
  | FieldItem
  | StratigraphicColumn;

export type NameUuidType = IdentifierUuidType | DiscoveryItem;

export function getNameFromNameUuidValue(value: NameUuidType) {
  return "short_identifier" in value
    ? value.short_identifier
    : value.identifier;
}

export function getNameFromMultipleNameUuidValues(values: Array<NameUuidType>) {
  let name = "";

  const firstValue = values.at(0);
  if (firstValue !== undefined) {
    name = getNameFromNameUuidValue(firstValue);
    if (values.length > 1) {
      name += ` (and ${String(values.length - 1)} more)`;
    }
  }

  return name;
}

export function emptyIdentifierUuid(): IdentifierUuidType {
  return {
    identifier: "(none)",
    uuid: "0",
  };
}

export function emptyMasterdata(): Smda {
  return {
    coordinate_system: emptyIdentifierUuid(),
    country: [] as CountryItem[],
    discovery: [] as DiscoveryItem[],
    field: [] as FieldItem[],
    stratigraphic_column: emptyIdentifierUuid(),
  };
}

export function getRmsProjectName(projectPath: string) {
  return projectPath.split("rms/model/").pop() ?? "";
}
