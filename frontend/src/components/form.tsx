import {
  Button,
  DotProgress,
  TextField as EdsTextField,
  Icon,
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
import z, { ZodString } from "zod/v4";

import { fieldContext, formContext, useFieldContext } from "../utils/form";
import { EditableTextFieldFormContainer } from "./form.style";

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

export interface CommonTextFieldFormProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  length?: number;
  minLength?: number;
}

interface MutationFormProps {
  mutationCallback: (props: MutationCallbackProps<StringObject>) => void;
  mutationIsPending: boolean;
}

export function TextField({
  label,
  placeholder,
  isReadOnly,
  setSubmitDisabled,
}: {
  label: string;
  placeholder?: string;
  isReadOnly?: boolean;
  setSubmitDisabled: Dispatch<SetStateAction<boolean>>;
}) {
  const field = useFieldContext<string>();

  useEffect(() => {
    setSubmitDisabled(
      field.state.meta.isDefaultValue || !field.state.meta.isValid,
    );
  }, [
    setSubmitDisabled,
    field.state.meta.isDefaultValue,
    field.state.meta.isValid,
  ]);

  return (
    <EdsTextField
      id={field.name}
      name={field.name}
      label={label}
      readOnly={isReadOnly}
      value={field.state.value}
      placeholder={placeholder}
      onBlur={field.handleBlur}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        field.handleChange(e.target.value);
      }}
      {...(!field.state.meta.isValid && {
        variant: "error",
        helperIcon: <Icon name="error_filled" title="Error" />,
        helperText: field.state.meta.errors
          .map((err: z.ZodError) => err.message)
          .join(", "),
      })}
    />
  );
}

export function SubmitButton({
  disabled,
  isPending,
}: {
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
        {isPending ? <DotProgress /> : "Save"}
      </Button>
    </Tooltip>
  );
}

const { useAppForm: useAppFormEditableTextField } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
});

type EditableTextFieldFormProps = CommonTextFieldFormProps & MutationFormProps;

export function EditableTextFieldForm({
  name,
  label,
  value,
  placeholder,
  length,
  minLength,
  mutationCallback,
  mutationIsPending,
}: EditableTextFieldFormProps) {
  const [isReadonly, setIsReadonly] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true);

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

  const formSubmitCallback = ({
    message,
    formReset,
  }: FormSubmitCallbackProps) => {
    toast.info(message);
    formReset();
    setIsReadonly(true);
  };

  const form = useAppFormEditableTextField({
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
