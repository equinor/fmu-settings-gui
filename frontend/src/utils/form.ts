import { AnyFieldApi, createFormHookContexts } from "@tanstack/react-form";

import { OptionProps } from "#components/form/field";
import { IdentifierUuidType, NameUuidType } from "./model";

export type ListOperation = "addition" | "removal";

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

export function findOptionValueInNameUuidArray<T extends NameUuidType>(
  array: T[],
  value: string,
): T | undefined {
  const result = array.filter((element) => String(element.uuid) === value);

  return result.length === 1 ? result[0] : undefined;
}

/**
 * Adds or removes a name-uuid value to a list. The value can be a single value
 * or an array of values. Only adds a value if it doesn't already exist in the
 * list, determined by its uuid sub-value.
 * @param fieldContext The fieldApi.
 * @param operation "addition" or "removal".
 * @param value A single name-uuid value or an array of such values.
 */
export function handleNameUuidListOperation(
  fieldContext: AnyFieldApi,
  operation: ListOperation,
  value: NameUuidType | Array<NameUuidType>,
) {
  const valueList = Array.isArray(value) ? value : [value];
  const fieldValue = fieldContext.state.value as Array<NameUuidType>;

  if (operation === "addition") {
    valueList.map((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx < 0) {
        fieldContext.pushValue(value);
      }
    });
  } else {
    const indexes: Array<number> = [];
    valueList.map((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx >= 0) {
        indexes.push(idx);
      }
    });
    if (indexes.length > 0) {
      // Remove elements in descending index order to avoid index shifting
      indexes
        .sort((a, b) => b - a)
        .map((idx) => {
          fieldContext.removeValue(idx);
        });
    }
  }
}
