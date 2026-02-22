import { createFormHook } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "react-toastify";

import { fieldContext, formContext } from "#utils/form";
import { handleValidator } from "#utils/validator";
import { CancelButton, GeneralButton, SubmitButton } from "./button";
import {
  type BasicTextFieldProps,
  type CommonTextFieldProps,
  SearchField,
  TextField,
} from "./field";
import {
  EditableTextFieldFormContainer,
  SearchFieldFormContainer,
} from "./form.style";

export type StringObject = { [x: string]: string };

export interface FormSubmitCallbackProps {
  message: string;
  formReset: () => void;
}

export interface MutationCallbackProps<T> {
  formValue: T;
  formSubmitCallback: (props: FormSubmitCallbackProps) => void;
  formReset: () => void;
}

interface SetStateFormProps {
  setStateCallback: (value: string) => void;
}

interface MutationFormProps {
  mutationCallback: (props: MutationCallbackProps<StringObject>) => void;
  mutationIsPending: boolean;
}

const { useAppForm: useAppFormEditableTextFieldForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { CancelButton, GeneralButton, SubmitButton },
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
            <form.GeneralButton
              label="Edit"
              onClick={() => {
                setIsReadonly(false);
              }}
            />
          ) : (
            <>
              <form.SubmitButton
                label="Save"
                disabled={submitDisabled}
                isPending={mutationIsPending}
                helperTextDisabled="Value can be submitted when it has been changed and is valid"
              />
              <form.CancelButton
                onClick={(e) => {
                  e.preventDefault();
                  form.reset();
                  setIsReadonly(true);
                }}
              />
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
