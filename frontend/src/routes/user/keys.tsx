import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { v1GetUserOptions } from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/user/keys")({
  component: RouteComponent,
});

function Content() {
  const { data } = useSuspenseQuery(v1GetUserOptions());

  const smda_key = data.user_api_keys.smda_subscription ?? "(not set)";

  return (
    <>
      <PageText $variant="ingress">
        For managing some of the settings, this application needs to know the
        keys for some external APIs. These are keys that each users needs to
        acquire, and which can then be stored through this application.
      </PageText>

      <PageHeader $variant="h3">SMDA</PageHeader>

      <PageText>Subscription key: {smda_key}</PageText>
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
