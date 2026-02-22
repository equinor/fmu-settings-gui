import { Typography } from "@equinor/eds-core-react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import type { UserApiKeys } from "#client";
import {
  smdaGetHealthQueryKey,
  userGetUserOptions,
  userGetUserQueryKey,
  userPatchApiKeyMutation,
} from "#client/@tanstack/react-query.gen";
import { Loading } from "#components/common";
import type { CommonTextFieldProps } from "#components/form/field";
import {
  EditableTextFieldForm,
  type MutationCallbackProps,
  type StringObject,
} from "#components/form/form";
import { PageHeader, PageSectionSpacer, PageText } from "#styles/common";
import { KeysFormContainer } from "./keys.style";

export const Route = createFileRoute("/user/keys")({
  component: RouteComponent,
});

type KeysTextFieldFormProps = Omit<CommonTextFieldProps, "name" | "value"> & {
  apiKey: keyof UserApiKeys;
};

function KeysTextFieldForm({
  apiKey,
  label,
  placeholder,
  length,
  minLength,
}: KeysTextFieldFormProps) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(userGetUserOptions());
  const { mutate, isPending } = useMutation({
    ...userPatchApiKeyMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: userGetUserQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: smdaGetHealthQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating API key" },
  });

  const name = String(apiKey);

  const mutationCallback = ({
    formValue,
    formSubmitCallback,
    formReset,
  }: MutationCallbackProps<StringObject>) => {
    mutate(
      { body: { id: name, key: formValue[name] } },
      {
        onSuccess: (data) => {
          formSubmitCallback({
            message: data.message,
            formReset,
          });
        },
      },
    );
  };

  return (
    <EditableTextFieldForm
      name={name}
      label={label}
      value={data.user_api_keys[apiKey] ?? ""}
      placeholder={placeholder}
      length={length}
      minLength={minLength}
      mutationCallback={mutationCallback}
      mutationIsPending={isPending}
    />
  );
}

function Content() {
  return (
    <>
      <PageText $variant="ingress">
        For managing some of the settings, this application needs to know the
        keys for some external APIs. These are keys that each user needs to
        acquire, and which can then be stored through this application.
      </PageText>

      <PageHeader $variant="h3">
        <span id="smda_subscription">SMDA</span>
      </PageHeader>

      <PageText>
        An SMDA subscription key is needed for querying the{" "}
        <Typography
          link
          href="https://smda.equinor.com/"
          target="_blank"
          rel="noreferrer"
        >
          SMDA
        </Typography>{" "}
        API. This key can be created as follows:
      </PageText>

      <Typography as="ol">
        <li>
          Go to the{" "}
          <Typography
            link
            href="https://api.equinor.com/"
            target="_blank"
            rel="noreferrer"
          >
            Equinor API portal
          </Typography>{" "}
          and sign in
        </li>
        <li>
          Go to the{" "}
          <Typography
            link
            href="https://api.equinor.com/product#product=smda"
            target="_blank"
            rel="noreferrer"
          >
            SMDA product page
          </Typography>
        </li>
        <li>
          Subscribe to the API. The subscription name can be given as
          &quot;SMDA&quot;
        </li>
        <li>
          The subscription will be listed on the Profile page, with a primary
          and a secondary key, masked with &quot;XXX...&quot;. Show the actual
          value of the primary key, and copy the value
        </li>
        <li>
          Add the copied key value to the edit field here. After saving the
          value will be shown masked with &quot;***...&quot;
        </li>
      </Typography>

      <PageSectionSpacer />

      <KeysFormContainer>
        <KeysTextFieldForm
          apiKey="smda_subscription"
          label="SMDA subscription primary key"
          placeholder="(not set)"
          length={32}
        />
      </KeysFormContainer>
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
