import z, { type ZodString } from "zod";

export interface ValidatorProps {
  length?: number;
  minLength?: number;
}

export function handleValidator({ length, minLength }: ValidatorProps) {
  let validator: ZodString | undefined;

  if (length !== undefined) {
    validator = z
      .string()
      .refine((val: string) => val === "" || val.length === length, {
        error: `Value must be empty or exactly ${String(length)} characters long`,
      });
  } else if (minLength !== undefined) {
    validator = z
      .string()
      .refine((val) => val === "" || val.length >= minLength, {
        error: `Value must be empty or at least ${String(minLength)} characters long`,
      });
  }

  return validator;
}

export function requiredStringValidator() {
  return z.string().nonempty({ error: "Required" });
}
