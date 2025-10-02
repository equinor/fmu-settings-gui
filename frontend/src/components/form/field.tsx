import {
  TextField as EdsTextField,
  Icon,
  InputWrapper,
} from "@equinor/eds-core-react";
import { error_filled } from "@equinor/eds-icons";
import { ChangeEvent, Dispatch, SetStateAction, useEffect } from "react";
import z from "zod/v4";

import { useFieldContext } from "#utils/form";
import { ValidatorProps } from "#utils/validator";
import { SearchFieldInput } from "./field.style";

Icon.add({ error_filled });

export interface BasicTextFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  helperText?: string;
}

export interface CommonTextFieldProps
  extends BasicTextFieldProps,
    ValidatorProps {}

export function TextField({
  label,
  placeholder,
  helperText,
  isReadOnly,
  toUpperCase,
  setSubmitDisabled,
}: {
  label: string;
  placeholder?: string;
  helperText?: string;
  isReadOnly?: boolean;
  toUpperCase?: boolean;
  setSubmitDisabled?: Dispatch<SetStateAction<boolean>>;
}) {
  const field = useFieldContext<string>();

  useEffect(() => {
    if (setSubmitDisabled) {
      setSubmitDisabled(
        field.state.meta.isDefaultValue || !field.state.meta.isValid,
      );
    }
  }, [
    setSubmitDisabled,
    field.state.meta.isDefaultValue,
    field.state.meta.isValid,
  ]);

  return (
    <InputWrapper helperProps={{ text: helperText }}>
      <EdsTextField
        id={field.name}
        name={field.name}
        label={label}
        readOnly={isReadOnly}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          let value = e.target.value;
          if (toUpperCase) {
            value = value.toUpperCase();
          }
          field.handleChange(value);
        }}
        {...(!field.state.meta.isValid && {
          variant: "error",
          helperIcon: <Icon name="error_filled" title="Error" size={16} />,
          helperText: field.state.meta.errors
            .map((err: z.ZodError) => err.message)
            .join(", "),
        })}
      />
    </InputWrapper>
  );
}

export function SearchField({
  placeholder,
  helperText,
  toUpperCase,
}: {
  placeholder?: string;
  helperText?: string;
  toUpperCase?: boolean;
}) {
  const field = useFieldContext<string>();

  return (
    <InputWrapper helperProps={{ text: helperText }}>
      <SearchFieldInput
        id={field.name}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => {
          let value = e.target.value;
          if (toUpperCase) {
            value = value.toUpperCase();
          }
          field.handleChange(value);
        }}
      />
    </InputWrapper>
  );
}
