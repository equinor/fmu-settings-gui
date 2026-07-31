import type {
  InternalWellboreIdentifierMapping,
  InternalWellboreMappings,
  RmsWell,
  SmdaWellHeader,
} from "#client";
import {
  emptyName,
  type SourceTargetPair,
} from "#components/project/mapping/utils";
import { isSmdaWellboreMapping } from "#services/mappings";
import type { WellboreMappingFormValue, WellboreMappingRow } from "./types";

export const wellboreSmdaOptions = {
  empty: {
    value: "",
    label: emptyName,
  },
  unmappable: {
    value: "_unmappableWellbore",
    label: "Wellbore doesn't exist in SMDA",
  },
  divider: {
    value: "_divider",
    label: "",
  },
} as const;

export function isRmsMapping(
  mapping: InternalWellboreIdentifierMapping,
  targetSystem: "rms" | "simulator" | "smda",
) {
  return (
    mapping.source_system === "rms" && mapping.target_system === targetSystem
  );
}

function rmsSelfMapping(
  rmsWellboreName: string,
): InternalWellboreIdentifierMapping {
  return {
    mapping_type: "wellbore",
    source_system: "rms",
    target_system: "rms",
    relation_type: "primary",
    source_id: rmsWellboreName,
    target_id: rmsWellboreName,
  };
}

function resolveSimulatorMapping(
  rmsWellboreName: string,
  simulatorName: string,
): InternalWellboreIdentifierMapping | undefined {
  const targetId = simulatorName.trim();
  if (!targetId) {
    return undefined;
  }

  return {
    mapping_type: "wellbore",
    source_system: "rms",
    target_system: "simulator",
    relation_type: "primary",
    source_id: rmsWellboreName,
    target_id: targetId,
  };
}

function resolveSmdaMapping(
  rmsWellboreName: string,
  smdaUuid: string,
  smdaHeaders: SmdaWellHeader[],
  existingMapping?: InternalWellboreIdentifierMapping,
): InternalWellboreIdentifierMapping | undefined {
  if (smdaUuid === wellboreSmdaOptions.unmappable.value) {
    return {
      mapping_type: "wellbore",
      source_system: "rms",
      target_system: "smda",
      relation_type: "unmappable",
      source_id: rmsWellboreName,
      target_id: null,
      target_uuid: null,
    };
  }

  if (!smdaUuid) {
    return undefined;
  }

  const smdaHeader = smdaHeaders.find(
    (header) => header.wellbore_uuid === smdaUuid,
  );
  if (smdaHeader) {
    return {
      mapping_type: "wellbore",
      source_system: "rms",
      target_system: "smda",
      relation_type: "primary",
      source_id: rmsWellboreName,
      target_id: smdaHeader.unique_wellbore_identifier,
      target_uuid: smdaHeader.wellbore_uuid,
    };
  }

  return existingMapping?.target_uuid === smdaUuid
    ? existingMapping
    : undefined;
}

export function createWellboreMappingRows(
  rmsWellbores: RmsWell[],
  mappings: InternalWellboreMappings,
): WellboreMappingRow[] {
  const simulatorMappingsByRms = new Map<
    string,
    InternalWellboreIdentifierMapping
  >();
  const smdaMappingsByRms = new Map<
    string,
    InternalWellboreIdentifierMapping
  >();

  mappings.forEach((mapping) => {
    if (
      isRmsMapping(mapping, "simulator") &&
      mapping.relation_type === "primary" &&
      !simulatorMappingsByRms.has(mapping.source_id)
    ) {
      simulatorMappingsByRms.set(mapping.source_id, mapping);
    } else if (
      isSmdaWellboreMapping(mapping) &&
      !smdaMappingsByRms.has(mapping.source_id)
    ) {
      smdaMappingsByRms.set(mapping.source_id, mapping);
    }
  });

  return rmsWellbores.map((wellbore) => {
    const rmsWellboreName = wellbore.name;
    const smdaMapping = wellbore.planned
      ? undefined
      : smdaMappingsByRms.get(rmsWellboreName);

    return {
      rmsWellboreName,
      planned: wellbore.planned ?? false,
      simulatorName:
        simulatorMappingsByRms.get(rmsWellboreName)?.target_id ?? "",
      smdaName: smdaMapping?.target_id ?? "",
      smdaUuid: smdaMapping?.target_uuid ?? "",
      unmappable: smdaMapping?.relation_type === "unmappable",
    };
  });
}

export function updateWellboreMapping(
  mappings: InternalWellboreMappings,
  row: WellboreMappingRow,
  value: WellboreMappingFormValue,
  smdaHeaders: SmdaWellHeader[],
): InternalWellboreMappings {
  const rmsWellboreName = row.rmsWellboreName;
  const existingSmdaMapping = mappings.find(
    (mapping) =>
      mapping.source_id === rmsWellboreName && isRmsMapping(mapping, "smda"),
  );
  const replacementMappings = [
    resolveSimulatorMapping(rmsWellboreName, value.simulatorName),
    resolveSmdaMapping(
      rmsWellboreName,
      value.smdaUuid,
      smdaHeaders,
      existingSmdaMapping,
    ),
  ].filter((mapping) => mapping !== undefined);

  const preservedMappings = mappings.filter((mapping) => {
    if (mapping.source_id !== rmsWellboreName) {
      return true;
    }
    if (isRmsMapping(mapping, "smda")) {
      return false;
    }
    if (
      isRmsMapping(mapping, "simulator") &&
      mapping.relation_type === "primary"
    ) {
      return false;
    }
    if (isRmsMapping(mapping, "rms") && mapping.relation_type === "primary") {
      return false;
    }

    return true;
  });
  const hasPreservedCrossSystemMapping = preservedMappings.some(
    (mapping) =>
      mapping.source_id === rmsWellboreName &&
      mapping.source_system !== mapping.target_system,
  );
  const hasCrossSystemMapping =
    hasPreservedCrossSystemMapping || replacementMappings.length > 0;

  return [
    ...preservedMappings,
    ...(hasCrossSystemMapping ? [rmsSelfMapping(rmsWellboreName)] : []),
    ...replacementMappings,
  ];
}

export function wellboreSmdaTargetPairs(
  mappings: InternalWellboreMappings,
): SourceTargetPair[] {
  return mappings.flatMap((mapping) =>
    isRmsMapping(mapping, "smda") &&
    mapping.relation_type === "primary" &&
    mapping.target_uuid
      ? [{ sourceId: mapping.source_id, targetUuid: mapping.target_uuid }]
      : [],
  );
}
