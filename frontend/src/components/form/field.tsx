import {
  Autocomplete,
  TextField as EdsTextField,
  Icon,
  InputWrapper,
  NativeSelect,
} from "@equinor/eds-core-react";
import { error_filled, info_circle } from "@equinor/eds-icons";
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
} from "react";
import type z from "zod";

import { useFieldContext } from "#utils/form";
import type { ValidatorProps } from "#utils/validator";
import { CommonInputWrapper, SearchFieldInput } from "./field.style";

Icon.add({ error_filled, info_circle });

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

export interface OptionProps {
  value: string;
  label: string;
}

const helperTextLoadingOptions = "Loading options...";

export function TextField({
  label,
  multiline = false,
  rows,
  placeholder,
  disabled,
  helperText,
  isReadOnly,
  toUpperCase,
  setSubmitDisabled,
}: {
  label: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
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
        multiline={multiline}
        rows={rows}
        readOnly={isReadOnly}
        disabled={disabled}
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

export function Select({
  label,
  helperText,
  value,
  options,
  loadingOptions,
  onChange,
}: {
  label: string;
  helperText?: string;
  value: string;
  options: OptionProps[];
  loadingOptions?: boolean;
  onChange: (value: string) => void;
}) {
  const field = useFieldContext();

  return (
    <CommonInputWrapper
      helperProps={
        field.state.meta.isValid || loadingOptions
          ? { text: loadingOptions ? helperTextLoadingOptions : helperText }
          : {
              className: "errorText",
              icon: <Icon name="error_filled" title="Error" size={16} />,
              text: field.state.meta.errors
                .map((err: string) => err)
                .join(", "),
            }
      }
    >
      <NativeSelect
        id={field.name}
        label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </CommonInputWrapper>
  );
}

export function AutocompleteField({
  label,
  options,
  noOptionsText,
  helperText,
  disabled,
  loadingOptions,
}: {
  label: string;
  options: string[];
  noOptionsText?: string;
  disabled?: boolean;
  helperText?: string;
  loadingOptions?: boolean;
}) {
  const field = useFieldContext<string>();

  return (
    <CommonInputWrapper
      helperIcon={<Icon name="info_circle" title="Info" size={16} />}
      helperProps={
        field.state.meta.isValid || loadingOptions
          ? { text: loadingOptions ? helperTextLoadingOptions : helperText }
          : {
              className: "errorText",
              icon: <Icon name="error_filled" title="Error" size={16} />,
              text: field.state.meta.errors
                .map((err: string) => err)
                .join(", "),
            }
      }
    >
      <Autocomplete
        autoWidth
        id={field.name}
        label={label}
        options={options}
        loading={loadingOptions}
        initialSelectedOptions={[field.state.value]}
        noOptionsText={noOptionsText}
        onOptionsChange={({ selectedItems }) => {
          field.handleChange(selectedItems[0] ?? "");
        }}
        disabled={disabled}
        variant={!field.state.meta.isValid ? "error" : undefined}
      />
    </CommonInputWrapper>
  );
}
