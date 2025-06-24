import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "../../components/common";
import { EditableTextFieldForm } from "../../components/form";
import { PageHeader, PageText } from "../../styles/common";
import { KeysForm } from "./keys.style";

export const Route = createFileRoute("/user/keys")({
  component: RouteComponent,
});

function Content() {
  const { queryClient } = Route.useRouteContext();

  return (
    <>
      <PageText $variant="ingress">
        For managing some of the settings, this application needs to know the
        keys for some external APIs. These are keys that each users needs to
        acquire, and which can then be stored through this application.
      </PageText>

      <PageHeader $variant="h3">SMDA</PageHeader>

      <KeysForm>
        <EditableTextFieldForm
          apiKey="smda_subscription"
          label="SMDA subscription key"
          queryClient={queryClient}
          placeholder="(not set)"
          minLength={5}
        />
      </KeysForm>
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
