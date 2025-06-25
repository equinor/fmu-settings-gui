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
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import z, { ZodString } from "zod/v4";

import { UserApiKeys } from "../client";
import {
  v1GetUserOptions,
  v1GetUserQueryKey,
  v1PatchApiKeyMutation,
} from "../client/@tanstack/react-query.gen";
import { queryMutationRetry } from "../utils/authentication";
import { fieldContext, formContext, useFieldContext } from "../utils/form";
import { EditableTextFieldFormContainer } from "./form.style";

Icon.add({ error_filled });

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

export function EditableTextFieldForm({
  apiKey,
  label,
  queryClient,
  placeholder,
  length,
  minLength,
}: {
  apiKey: keyof UserApiKeys;
  label: string;
  queryClient: QueryClient;
  placeholder?: string;
  length?: number;
  minLength?: number;
}) {
  const [isReadonly, setIsReadonly] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const { data } = useSuspenseQuery(v1GetUserOptions());
  const { mutate, isPending } = useMutation({
    ...v1PatchApiKeyMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: v1GetUserQueryKey(),
      });
    },
    retry: (failureCount, error) => queryMutationRetry(failureCount, error),
    meta: { errorPrefix: "Error updating API key" },
  });

  let validator: ZodString | undefined;
  if (length !== undefined) {
    validator = z
      .string()
      .refine((val: string) => val === "" || val.length === length, {
        error: `Value must be exactly ${String(length)} characters long`,
      });
  } else if (minLength !== undefined) {
    validator = z
      .string()
      .refine((val) => val === "" || val.length >= minLength, {
        error: `Value must be at least ${String(minLength)} characters long`,
      });
  }

  const form = useAppFormEditableTextField({
    defaultValues: {
      [apiKey]: data.user_api_keys[apiKey] ?? "",
    },
    onSubmit: ({ formApi, value }) => {
      mutate(
        {
          body: { id: apiKey, key: value[apiKey] },
        },
        {
          onSuccess: (data) => {
            toast.info(data.message);
            formApi.reset();
            setIsReadonly(true);
          },
        },
      );
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
          name={apiKey}
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
                isPending={isPending}
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
