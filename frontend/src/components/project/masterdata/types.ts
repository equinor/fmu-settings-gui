import type {
  CoordinateSystem,
  CountryItem,
  DiscoveryItem,
  FieldItem,
  SmdaMasterdataResult,
  StratigraphicColumn,
} from "#client";
import type { ListOperation } from "#utils/form";

export type SmdaMasterdataResultGrouped = Record<string, SmdaMasterdataResult>;

export type SmdaMasterdataCoordinateSystemFields = {
  coordinateSystem: CoordinateSystem;
  fields: Array<FieldItem>;
};

export type MasterdataItemType = CountryItem | DiscoveryItem | FieldItem;
export type FieldItemType = "country" | "discovery" | "field";

export type ItemListGrouped<T> = Record<string, Array<T>>;

export type OptionsData = {
  coordinateSystems: Array<CoordinateSystem>;
  coordinateSystemsOptions: Array<CoordinateSystem>;
  stratigraphicColumns: Array<StratigraphicColumn>;
  stratigraphicColumnsOptions: Array<StratigraphicColumn>;
};

export type ItemLists = {
  field: Array<FieldItem>;
  country: Array<CountryItem>;
  discovery: ItemListGrouped<DiscoveryItem>;
};

export type FormMasterdataBase = {
  field: Array<FieldItem>;
  country: Array<CountryItem>;
  discovery: ItemListGrouped<DiscoveryItem>;
};

export type FormMasterdataSub = Omit<FormMasterdataBase, "field">;

export type FormMasterdataProject = FormMasterdataBase & OptionsData;

export type SelectedItems = {
  operation: ListOperation;
  items: ItemLists;
};
