import {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  Smda,
  StratigraphicColumn,
} from "#client";

// "Identifier" in type name refers to "identifier" key name
export type IdentifierUuidType = CoordinateSystem | StratigraphicColumn;

// "Identifier" in type name refers to both "identifier" and "short_identifier" key names
export type IdentifierUuidListType = CountryItem | DiscoveryItem;

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
