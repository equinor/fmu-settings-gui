import type { OptionProps } from "#components/form/field";
import type { ElementMapping, SpecialOptionId } from "./types";

export const emptyName = "(not set)";
export const noZoneName = "No zone";

export function emptyZoneMapping(): ElementMapping {
  return {
    elementType: undefined,
    rmsName: "",
    unmappable: false,
    smdaName: "",
    smdaUuid: "",
    aliases: [],
  };
}

export const specialOptions: Record<SpecialOptionId, OptionProps> = {
  empty: { value: "_empty", label: emptyName },
  divider: { value: "_divider", label: "------------------------------" },
  unmappableZone: { value: "_unmappable", label: "Zone doesn't exist in SMDA" },
};

export function getLabelForStratUnitOption(name: string, level: number) {
  const indent = "\xA0\xA0 ".repeat(level > 1 ? level - 1 : 0);

  return `${indent}${name}`;
}

export function validateSelectValue(value: string) {
  return value === specialOptions.divider.value
    ? "A value needs to be selected"
    : undefined;
}
