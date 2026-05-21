import type { OptionProps } from "#components/form/field";
import type { ElementMapping, ElementType, SpecialOptionId } from "./types";

export const emptyName = "(not set)";
export const noHorizonName = "No horizon";
export const noZoneName = "No zone";

export function emptyElementMapping(): ElementMapping {
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
  unmappableHorizon: {
    value: "_unmappableHorizon",
    label: "Horizon doesn't exist in SMDA",
  },
  unmappableZone: {
    value: "_unmappableZone",
    label: "Zone doesn't exist in SMDA",
  },
};

export function createSpecialOptions(
  elementType: ElementType,
  withDivider: boolean,
) {
  const options: OptionProps[] = [
    specialOptions.empty,
    elementType === "horizon"
      ? specialOptions.unmappableHorizon
      : specialOptions.unmappableZone,
  ];
  if (withDivider) {
    options.push(specialOptions.divider);
  }

  return options;
}

export function getLabelForStratUnitOption(name: string, level: number) {
  const indent = "\xA0\xA0 ".repeat(level > 1 ? level - 1 : 0);

  return `${indent}${name}`;
}

export function validateSelectValue(value: string) {
  return value === specialOptions.divider.value
    ? "A value needs to be selected"
    : undefined;
}
