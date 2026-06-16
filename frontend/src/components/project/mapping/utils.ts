import type { OptionProps } from "#components/form/field";
import type {
  ElementMapping,
  ElementType,
  SpecialOptionId,
} from "../stratigraphy/types";

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

export function getElementMappingSmdaName(elementMapping: ElementMapping) {
  if (elementMapping.smdaName !== "") {
    return elementMapping.smdaName;
  } else if (elementMapping.unmappable) {
    return elementMapping.elementType === "horizon"
      ? noHorizonName
      : noZoneName;
  } else {
    return emptyName;
  }
}

export function getElementMappingSmdaNameOptionsInitialValue(
  elementMapping: ElementMapping | undefined,
) {
  let value = "";

  if (elementMapping?.unmappable) {
    value =
      elementMapping.elementType === "horizon"
        ? specialOptions.unmappableHorizon.value
        : specialOptions.unmappableZone.value;
  } else if ((elementMapping?.smdaUuid ?? "") === "") {
    value = specialOptions.empty.value;
  } else {
    value = elementMapping?.smdaUuid ?? "";
  }

  return { value, label: elementMapping?.smdaName ?? "" };
}
