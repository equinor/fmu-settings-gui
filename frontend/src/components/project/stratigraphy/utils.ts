import type { OptionProps } from "#components/form/field";
import type { SpecialOptionId } from "./types";

export const emptyName = "(not set)";

export const specialOptions: Record<SpecialOptionId, OptionProps> = {
  empty: { value: "_empty", label: emptyName },
  divider: { value: "_divider", label: "------------------------------" },
  unmappableZone: { value: "_unmappable", label: "Zone doesn't exist in SMDA" },
};

export function validateSelectValue(value: string) {
  return value === specialOptions.divider.value
    ? "A value needs to be selected"
    : undefined;
}

export const tempUnmappable: { id: string; uuid: string } = {
  id: "_unmappable",
  uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
};
