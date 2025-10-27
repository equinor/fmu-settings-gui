import {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  Smda,
  StratigraphicColumn,
} from "#client";

export type NameUuidType = CountryItem | DiscoveryItem;

export type IdentifierUuidType = CoordinateSystem | StratigraphicColumn;

export function emptyIdentifierUuid(): IdentifierUuidType {
  return {
    identifier: "(none)",
    uuid: "0",
  };
}

export function emptyMasterdata(): Smda {
  return {
    coordinate_system: emptyIdentifierUuid() as CoordinateSystem,
    country: Array<CountryItem>(),
    discovery: Array<DiscoveryItem>(),
    field: Array<FieldItem>(),
    stratigraphic_column: emptyIdentifierUuid() as StratigraphicColumn,
  };
}
