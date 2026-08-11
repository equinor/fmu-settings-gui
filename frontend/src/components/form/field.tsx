import {
  Autocomplete,
  TextField as EdsTextField,
  Icon,
  InputWrapper,
  NativeSelect,
} from "@equinor/eds-core-react";
import {
  add_circle_filled,
  error_filled,
  info_circle,
  remove,
} from "@equinor/eds-icons";
import type { ChangeEvent } from "react";
import type z from "zod";

import { useFieldContext } from "#utils/form";
import type { ValidatorProps } from "#utils/validator";
import { CommonInputWrapper, SearchFieldInput } from "./field.style";

Icon.add({ add_circle_filled, error_filled, info_circle, remove });

export interface BasicTextFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string | undefined;
  helperText?: string | undefined;
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
}: {
  label: string;
  multiline?: boolean | undefined;
  rows?: number | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  helperText?: string | undefined;
  isReadOnly?: boolean | undefined;
  toUpperCase?: boolean | undefined;
}) {
  const field = useFieldContext<string>();

  return (
    <InputWrapper
      {...(helperText !== undefined && { helperProps: { text: helperText } })}
    >
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
  placeholder?: string | undefined;
  helperText?: string | undefined;
  toUpperCase?: boolean | undefined;
}) {
  const field = useFieldContext<string>();

  return (
    <InputWrapper
      {...(helperText !== undefined && { helperProps: { text: helperText } })}
    >
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

export function ArrayTextField({ removeValue }: { removeValue: () => void }) {
  const field = useFieldContext<string>();

  return (
    <>
      <EdsTextField
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          field.handleChange(e.target.value);
        }}
      />
      <Icon
        className="removeIcon"
        name="remove"
        title="Remove"
        size={16}
        onClick={removeValue}
      />
    </>
  );
}

export function ArrayTextAddItem({
  emptyText,
  pushEmpty,
}: {
  emptyText?: string | undefined;
  pushEmpty: () => void;
}) {
  const field = useFieldContext<string>();

  return (
    <>
      <div className="emptyRow">
        {field.state.value.length === 0 && emptyText !== undefined && (
          <span className="missingValue">{emptyText}</span>
        )}
      </div>
      <Icon
        className="addIcon"
        name="add_circle_filled"
        title="Add"
        size={16}
        onClick={pushEmpty}
      />
    </>
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
  helperText?: string | undefined;
  value: string;
  options: OptionProps[];
  loadingOptions?: boolean | undefined;
  onChange: (value: string) => void;
}) {
  const field = useFieldContext();

  return (
    <CommonInputWrapper
      helperProps={
        field.state.meta.isValid || loadingOptions
          ? {
              text: loadingOptions
                ? helperTextLoadingOptions
                : (helperText ?? ""),
            }
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
  noOptionsText?: string | undefined;
  disabled?: boolean | undefined;
  helperText?: string | undefined;
  loadingOptions?: boolean | undefined;
}) {
  const field = useFieldContext<string>();

  return (
    <CommonInputWrapper
      helperIcon={<Icon name="info_circle" title="Info" size={16} />}
      helperProps={
        field.state.meta.isValid || loadingOptions
          ? {
              text: loadingOptions
                ? helperTextLoadingOptions
                : (helperText ?? ""),
            }
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
        {...(loadingOptions !== undefined && { loading: loadingOptions })}
        initialSelectedOptions={[field.state.value]}
        {...(noOptionsText !== undefined && { noOptionsText })}
        onOptionsChange={({ selectedItems }) => {
          field.handleChange(selectedItems[0] ?? "");
        }}
        {...(disabled !== undefined && { disabled })}
        {...(!field.state.meta.isValid && { variant: "error" })}
      />
    </CommonInputWrapper>
  );
}
