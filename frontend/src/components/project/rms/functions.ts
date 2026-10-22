import type { DataSystem } from "#client";
import type {
  ElementMappings,
  ElementMappingsTargetDataCleared,
  ElementMappingTarget,
} from "#components/project/common/mapping/types";
import { DataSystemNames } from "#utils/model";
import { capitalize } from "#utils/string";

function getTargetMappingText(
  sourceName: string,
  targetSystem: DataSystem,
  targetData: ElementMappingTarget,
) {
  const source = `${DataSystemNames.rms}: ${sourceName}`;
  const targetLabel = DataSystemNames[targetSystem];
  if (targetData.unmappable) {
    return `${capitalize(source)} -> Does not exist in ${targetLabel}`;
  }

  return `${capitalize(source)} -> ${capitalize(targetLabel)}: ${targetData.name || "(not set)"}`;
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
