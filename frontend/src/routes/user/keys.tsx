import { createFormHook } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import z from "zod/v4";

import { UserApiKeys } from "../../client";
import {
  v1GetUserOptions,
  v1GetUserQueryKey,
  v1PatchApiKeyMutation,
} from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { SubmitButton, TextField } from "../../components/form";
import { PageHeader, PageText } from "../../styles/common";
import { fieldContext, formContext } from "../../utils/form";

export const Route = createFileRoute("/user/keys")({
  component: RouteComponent,
});

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
});

function EditableTextField({
  apiKey,
  minLength,
}: {
  apiKey: keyof UserApiKeys;
  minLength?: number;
}) {
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(true);
  const { queryClient } = Route.useRouteContext();
  const { data } = useSuspenseQuery(v1GetUserOptions());
  const { mutate } = useMutation({
    ...v1PatchApiKeyMutation(),
    meta: { errorMessage: "Error updating API key" },
  });

  const form = useAppForm({
    defaultValues: {
      [apiKey]: data.user_api_keys[apiKey] ?? "",
    },
    onSubmit: ({ formApi, value }) => {
      mutate(
        {
          body: { id: apiKey, key: value[apiKey] },
        },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: v1GetUserQueryKey(),
            });
            toast.info("API key updated");
          },
        },
      );
      formApi.reset();
      setSubmitDisabled(true);
    },
  });

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField
          name={apiKey}
          {...(minLength && {
            validators: {
              onBlur: z
                .string()
                .refine((val) => val === "" || val.length >= minLength, {
                  error: `Value must be at least ${String(minLength)} characters long`,
                }),
            },
          })}
        >
          {(field) => <field.TextField setSubmitDisabled={setSubmitDisabled} />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton disabled={submitDisabled} />
        </form.AppForm>
      </form>
    </>
  );
}

function Content() {
  return (
    <>
      <PageText $variant="ingress">
        For managing some of the settings, this application needs to know the
        keys for some external APIs. These are keys that each users needs to
        acquire, and which can then be stored through this application.
      </PageText>

      <PageHeader $variant="h3">SMDA</PageHeader>

      <EditableTextField apiKey="smda_subscription" minLength={16} />
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>API keys</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
