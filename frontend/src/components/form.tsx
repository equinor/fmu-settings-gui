import { AnyFieldApi } from "@tanstack/react-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import z from "zod/v4";

import { useFieldContext } from "../utils/form";

export function TextField({
  setSubmitDisabled,
}: {
  setSubmitDisabled: Dispatch<SetStateAction<boolean>>;
}) {
  const field = useFieldContext<string>();

  useEffect(() => {
    setSubmitDisabled(field.state.meta.isDefaultValue);
  }, [setSubmitDisabled, field.state.meta.isDefaultValue]);

  return (
    <>
      <input
        id={field.name}
        type="text"
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(e.target.value);
        }}
      />
      <FieldError field={field} />
    </>
  );
}

function FieldError({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isValid && (
        <span>
          {field.state.meta.errors
            .map((err: z.ZodError) => err.message)
            .join(", ")}
        </span>
      )}
    </>
  );
}

export function SubmitButton({ disabled }: { disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled}>
      Submit
    </button>
  );
}
