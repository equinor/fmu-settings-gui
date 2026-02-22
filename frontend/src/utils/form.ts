import {
  type AnyFieldApi,
  type AnyFormApi,
  createFormHookContexts,
} from "@tanstack/react-form";

import type { Smda } from "#client";
import type { OptionProps } from "#components/form/field";
import type { IdentifierUuidType, NameUuidType } from "./model";

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
    valueList.forEach((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx < 0) {
        fieldContext.pushValue(value);
      }
    });
  } else {
    const indexes: Array<number> = [];
    valueList.forEach((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx >= 0) {
        indexes.push(idx);
      }
    });
    if (indexes.length > 0) {
      // Remove elements in descending index order to avoid index shifting
      indexes
        .sort((a, b) => b - a)
        .forEach((idx) => {
          fieldContext.removeValue(idx);
        });
    }
  }
}

/**
 * Adds or removes a name-uuid value to a list for the specified field, using
 * the form context. The value can be a single value or an array of values.
 * Only adds a value if it doesn't already exist in the list, determined by its
 * uuid sub-value. Only forms with data of type Smda is supported.
 * @param formContext The formApi.
 * @param operation "addition" or "removal".
 * @param fieldName The field name.
 * @param value A single name-uuid value or an array of such values.
 */
export function handleNameUuidListOperationOnForm(
  // fieldContext: AnyFieldApi,
  formContext: AnyFormApi,
  operation: ListOperation,
  fieldName: keyof Smda,
  value: NameUuidType | Array<NameUuidType>,
) {
  const valueList = Array.isArray(value) ? value : [value];
  const fieldValue = formContext.getFieldValue(
    fieldName,
  ) as Array<NameUuidType>;

  if (operation === "addition") {
    valueList.forEach((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx < 0) {
        formContext.pushFieldValue(fieldName as never, value);
      }
    });
  } else {
    const indexes: Array<number> = [];
    valueList.forEach((value) => {
      const idx = fieldValue.findIndex((v) => v.uuid === value.uuid);
      if (idx >= 0) {
        indexes.push(idx);
      }
    });
    if (indexes.length > 0) {
      // Remove elements in descending index order to avoid index shifting
      indexes
        .sort((a, b) => b - a)
        .forEach((idx) => {
          void formContext.removeFieldValue(fieldName as never, idx);
        });
    }
  }
}
