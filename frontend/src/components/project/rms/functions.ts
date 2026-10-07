import type { DataSystem } from "#client";
import type {
  ElementMappings,
  ElementMappingsTargetDataCleared,
  ElementMappingTarget,
} from "#components/project/common/mapping/types";

const dataSystemLabels: Record<DataSystem, string> = {
  rms: "RMS",
  smda: "SMDA",
  simulator: "Simulator",
  pdm: "PDM",
};

function getTargetMappingText(
  sourceName: string,
  targetSystem: DataSystem,
  targetData: ElementMappingTarget,
) {
  const source = `${dataSystemLabels.rms}: ${sourceName}`;
  const targetLabel = dataSystemLabels[targetSystem];
  if (targetData.unmappable) {
    return `${source} -> Does not exist in ${targetLabel}`;
  }

  return `${source} -> ${targetLabel}: ${targetData.name || "(not set)"}`;
}

export function getRemovedMappingTexts(
  removedMappings: ElementMappings,
  targetDataCleared: ElementMappingsTargetDataCleared = {},
) {
  const removedMappingTexts = Object.values(removedMappings).flatMap(
    (mapping) => [
      ...Object.entries(mapping.targets).flatMap(([targetKey, targetData]) => {
        if (
          !targetData.unmappable &&
          targetData.name === "" &&
          targetData.uuid === ""
        ) {
          return [];
        }

        return [
          getTargetMappingText(
            mapping.name,
            targetKey as DataSystem,
            targetData,
          ),
        ];
      }),
      ...mapping.aliases.map(
        (alias) => `RMS: ${alias} -> RMS: ${mapping.name} (alias)`,
      ),
    ],
  );
  const clearedTargetTexts = Object.entries(targetDataCleared).flatMap(
    ([sourceName, clearedTargets]) =>
      Object.entries(clearedTargets).map(([targetKey, targetData]) =>
        getTargetMappingText(sourceName, targetKey as DataSystem, targetData),
      ),
  );

  return [...removedMappingTexts, ...clearedTargetTexts];
}
