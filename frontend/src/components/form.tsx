import {
  Button,
  DotProgress,
  TextField as EdsTextField,
  Icon,
  InputWrapper,
  Tooltip,
} from "@equinor/eds-core-react";
import { error_filled } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import z from "zod/v4";

import { fieldContext, formContext, useFieldContext } from "../utils/form";
import { handleValidator, ValidatorProps } from "../utils/validator";
import {
  EditableTextFieldFormContainer,
  SearchFieldFormContainer,
  SearchFieldInput,
} from "./form.style";

Icon.add({ error_filled });

export type StringObject = { [x: string]: string };

interface FormSubmitCallbackProps {
  message: string;
  formReset: () => void;
}

export interface MutationCallbackProps<T> {
  formValue: T;
  formSubmitCallback: (props: FormSubmitCallbackProps) => void;
  formReset: () => void;
}

interface BasicTextFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  helperText?: string;
}

interface SetStateFormProps {
  setStateCallback: (value: string) => void;
}

interface MutationFormProps {
  mutationCallback: (props: MutationCallbackProps<StringObject>) => void;
  mutationIsPending: boolean;
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
          helperIcon: <Icon name="error_filled" title="Error" />,
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

export function SubmitButton({
  label,
  disabled,
  isPending,
}: {
  label: string;
  disabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <Tooltip
      title={
        disabled
          ? "Value can be submitted when it has been changed and is valid"
          : ""
      }
    >
      <Button
        type="submit"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
        }}
      >
        {isPending ? <DotProgress /> : label}
      </Button>
    </Tooltip>
  );
}

const { useAppForm: useAppFormEditableTextFieldForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
});

type EditableTextFieldFormProps = CommonTextFieldProps & MutationFormProps;

export function EditableTextFieldForm({
  name,
  label,
  value,
  placeholder,
  helperText,
  length,
  minLength,
  mutationCallback,
  mutationIsPending,
}: EditableTextFieldFormProps) {
  const [isReadonly, setIsReadonly] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true);

  const validator = handleValidator({ length, minLength });

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
    setIsReadonly(true);
  };

  const form = useAppFormEditableTextFieldForm({
    defaultValues: {
      [name]: value,
    },
    onSubmit: ({ formApi, value }) => {
      mutationCallback({
        formValue: value,
        formSubmitCallback,
        formReset: formApi.reset,
      });
    },
  });

  return (
    <EditableTextFieldFormContainer>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField
          name={name}
          {...(validator && {
            validators: {
              onBlur: validator,
            },
          })}
        >
          {(field) => (
            <field.TextField
              label={label}
              placeholder={placeholder}
              helperText={helperText}
              isReadOnly={isReadonly}
              setSubmitDisabled={setSubmitDisabled}
            />
          )}
        </form.AppField>

        <form.AppForm>
          {isReadonly ? (
            <Button
              onClick={() => {
                setIsReadonly(false);
              }}
            >
              Edit
            </Button>
          ) : (
            <>
              <form.SubmitButton
                label="Save"
                disabled={submitDisabled}
                isPending={mutationIsPending}
              />
              <Button
                type="reset"
                color="secondary"
                variant="outlined"
                onClick={(e) => {
                  e.preventDefault();
                  form.reset();
                  setIsReadonly(true);
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </form.AppForm>
      </form>
    </EditableTextFieldFormContainer>
  );
}

const { useAppForm: useAppFormSearchFieldForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { SearchField },
  formComponents: { SubmitButton },
});

type SearchFieldFormProps = Omit<BasicTextFieldProps, "label"> &
  SetStateFormProps;

export function SearchFieldForm({
  name,
  value,
  helperText,
  setStateCallback,
}: SearchFieldFormProps) {
  const form = useAppFormSearchFieldForm({
    defaultValues: {
      [name]: value,
    },
    onSubmit: ({ formApi, value }) => {
      setStateCallback(value[name]);
      formApi.reset();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <SearchFieldFormContainer>
        <form.AppField name={name}>
          {(field) => <field.SearchField helperText={helperText} toUpperCase />}
        </form.AppField>

        <form.AppForm>
          <form.SubmitButton label="Search" />
        </form.AppForm>
      </SearchFieldFormContainer>
    </form>
  );
}
