import type { DataSystem } from "#client";
import type { OptionProps } from "#components/form/field";
import type {
  ElementMapping,
  ElementMappingTarget,
  ElementMappingTargetUpdate,
  ElementType,
  SpecialOptionId,
} from "./types";

const emptyName = "(not set)";

export const specialOptions: Record<SpecialOptionId, OptionProps> = {
  empty: { value: "_empty", label: emptyName },
  divider: { value: "_divider", label: "------------------------------" },
  unmappableHorizon: {
    value: "_unmappableHorizon",
    label: "Horizon doesn't exist in SMDA",
  },
  unmappableWellbore: {
    value: "_unmappableWellbore",
    label: "Wellbore doesn't exist in SMDA",
  },
  unmappableZone: {
    value: "_unmappableZone",
    label: "Zone doesn't exist in SMDA",
  },
};

export const specialOptionsValuesUnmappable = [
  specialOptions.unmappableHorizon.value,
  specialOptions.unmappableWellbore.value,
  specialOptions.unmappableZone.value,
];

export function emptyElementMapping(
  targetSystems: DataSystem[],
): ElementMapping {
  return {
    elementType: undefined,
    name: "",
    aliases: [],
    meta: {},
    targets: targetSystems.reduce<ElementMapping["targets"]>(
      (acc, targetSystem) => {
        acc[targetSystem] = emptyElementMappingTarget();

        return acc;
      },
      {},
    ),
  };
}

export function emptyElementMappingTarget(): ElementMappingTarget {
  return {
    unmappable: false,
    name: "",
    uuid: "",
  };
}

export function emptyElementMappingTargetUpdate(): ElementMappingTargetUpdate {
  return {
    name: "",
    uuid: "",
  };
}

function getNoElementName(elementType: ElementType) {
  switch (elementType) {
    case "horizon":
      return "No horizon";
    case "wellbore":
      return "No wellbore";
    case "zone":
      return "No zone";
    default:
      return "(unknown element type)";
  }
}

export function getUnmappableOption(elementType: ElementType) {
  switch (elementType) {
    case "horizon":
      return specialOptions.unmappableHorizon;
    case "wellbore":
      return specialOptions.unmappableWellbore;
    case "zone":
      return specialOptions.unmappableZone;
    default:
      return { value: "_unknown", label: "(unknown element type)" };
  }
}

export function createSpecialOptions(
  elementType: ElementType,
  withDivider: boolean,
) {
  const options: OptionProps[] = [
    specialOptions.empty,
    getUnmappableOption(elementType),
  ];
  if (withDivider) {
    options.push(specialOptions.divider);
  }

  return options;
}

export function getElementMappingTargetName(
  elementMapping: ElementMapping,
  targetSystem: DataSystem,
) {
  if (elementMapping.elementType && targetSystem in elementMapping.targets) {
    const targetData = elementMapping.targets[targetSystem];
    if (targetData !== undefined) {
      if (targetData.name !== "") {
        return targetData.name;
      } else if (targetData.unmappable) {
        return getNoElementName(elementMapping.elementType);
      }
    }
  }

  return emptyName;
}

export function getElementMappingTargetNameOptionsInitialValue(
  elementMapping: ElementMapping | undefined,
  targetSystem: DataSystem,
): OptionProps {
  if (elementMapping?.elementType && targetSystem in elementMapping.targets) {
    const targetData = elementMapping.targets[targetSystem];
    if (targetData !== undefined) {
      let value: string;
      if (targetData.unmappable) {
        value = getUnmappableOption(elementMapping.elementType).value;
      } else if (targetData.uuid === "") {
        value = specialOptions.empty.value;
      } else {
        value = targetData.uuid;
      }

      return { value, label: targetData.name };
    }
  }

  return { value: "", label: "" };
}
