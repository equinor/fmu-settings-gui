import { createFormHookContexts } from "@tanstack/react-form";

import { OptionProps } from "#components/form/field";
import { IdentifierUuidType } from "./model";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export function identifierUuidArrayToOptionsArray(
  input: IdentifierUuidType[],
): OptionProps[] {
  return input.map((element) => ({
    value: element.uuid,
    label: element.identifier,
  }));
}

export function findOptionValueInIdentifierUuidArray(
  array: IdentifierUuidType[],
  value: string,
): IdentifierUuidType | undefined {
  const result = array.filter((element) => String(element.uuid) === value);
  return result.length === 1 ? result[0] : undefined;
}
