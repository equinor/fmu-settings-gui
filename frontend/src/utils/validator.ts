import z, { type ZodString } from "zod";

export interface ValidatorProps {
  length?: number;
  minLength?: number;
  initialValue?: string;
}

export function handleValidator({
  length,
  minLength,
  initialValue,
}: ValidatorProps) {
  let validator: ZodString | undefined;

  if (length !== undefined) {
    validator = z
      .string()
      .refine(
        (val: string) =>
          val === "" || val === initialValue || val.length === length,
        {
          error: `Value must be empty or exactly ${String(length)} characters long`,
        },
      );
  } else if (minLength !== undefined) {
    validator = z
      .string()
      .refine(
        (val) => val === "" || val === initialValue || val.length >= minLength,
        {
          error: `Value must be empty or at least ${String(minLength)} characters long`,
        },
      );
  }

  return validator;
}

export function requiredStringValidator() {
  return z.string().nonempty({ error: "Required" });
}
