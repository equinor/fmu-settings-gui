import { Typography } from "@equinor/eds-core-react";
import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { UserApiKeys } from "../../client";
import {
  v1GetUserOptions,
  v1GetUserQueryKey,
  v1PatchApiKeyMutation,
} from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import {
  CommonTextFieldFormProps,
  EditableTextFieldForm,
  MutationCallbackProps,
  StringObject,
} from "../../components/form";
import { PageHeader, PageSectionSpacer, PageText } from "../../styles/common";
import { queryMutationRetry } from "../../utils/authentication";
import { KeysFormContainer } from "./keys.style";

export const Route = createFileRoute("/user/keys")({
  component: RouteComponent,
});

type KeysTextFieldFormProps = Omit<
  CommonTextFieldFormProps,
  "name" | "value"
> & {
  apiKey: keyof UserApiKeys;
  queryClient: QueryClient;
};

function KeysTextFieldForm({
  apiKey,
  label,
  queryClient,
  placeholder,
  length,
  minLength,
}: KeysTextFieldFormProps) {
  const { data } = useSuspenseQuery(v1GetUserOptions());
  const { mutate, isPending } = useMutation({
    ...v1PatchApiKeyMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: v1GetUserQueryKey(),
      });
    },
    retry: (failureCount: number, error: Error) =>
      queryMutationRetry(failureCount, error),
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
  const { queryClient } = Route.useRouteContext();

  return (
    <>
      <PageText $variant="ingress">
        For managing some of the settings, this application needs to know the
        keys for some external APIs. These are keys that each user needs to
        acquire, and which can then be stored through this application.
      </PageText>

      <PageHeader $variant="h3">SMDA</PageHeader>

      <PageText>
        An SMDA subscription key is needed for querying the{" "}
        <a href="https://smda.equinor.com/" target="_blank" rel="noreferrer">
          SMDA
        </a>{" "}
        API. This key can be created as follows:
      </PageText>

      <Typography as="ol">
        <li>
          Go to the{" "}
          <a href="https://api.equinor.com/" target="_blank" rel="noreferrer">
            Equinor API portal
          </a>{" "}
          and sign in
        </li>
        <li>
          Find the SMDA page by searching for &quot;SMDA&quot; on the Products
          page, and go to this page
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
          queryClient={queryClient}
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
