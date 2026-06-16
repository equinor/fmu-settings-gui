import { specialOptions } from "../mapping/utils";

export function getLabelForStratUnitOption(name: string, level: number) {
  const indent = "\xA0\xA0 ".repeat(level > 1 ? level - 1 : 0);

  return `${indent}${name}`;
}

export function validateSelectValue(value: string) {
  return value === specialOptions.divider.value
    ? "A value needs to be selected"
    : undefined;
}
