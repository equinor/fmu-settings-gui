import { AnyFieldApi, createFormHookContexts } from "@tanstack/react-form";

import { OptionProps } from "#components/form/field";
import { IdentifierUuidListType, IdentifierUuidType } from "./model";

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

export function findOptionValueInIdentifierUuidArray(
  array: IdentifierUuidType[],
  value: string,
): IdentifierUuidType | undefined {
  const result = array.filter((element) => String(element.uuid) === value);
  return result.length === 1 ? result[0] : undefined;
}

export function handleIdentifierUuidListOperation(
  fieldContext: AnyFieldApi,
  operation: ListOperation,
  value: IdentifierUuidListType,
) {
  console.log(
    "===== handleListOperation operation =",
    operation,
    "value =",
    value,
  );

  if (operation === "addition") {
    fieldContext.pushValue(value);
  } else {
    const idx = (
      fieldContext.state.value as Array<IdentifierUuidListType>
    ).findIndex((v) => v.uuid === value.uuid);
    console.log("     found value at idx ", idx);
    if (idx >= 0) {
      fieldContext.removeValue(idx);
    }
  }
}
