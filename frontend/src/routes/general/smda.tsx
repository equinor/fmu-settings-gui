import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";

import { userGetUserOptions } from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { useSmdaHealthCheck } from "../../services/smda";
import { PageCode, PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/general/smda")({
  component: RouteComponent,
});

function SmdaNotOk({ text }: { text: string }) {
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const hasSubscriptionKey =
    "smda_subscription" in userData.user_api_keys &&
    userData.user_api_keys.smda_subscription !== "";

  return (
    <>
      <PageText>Required data for accessing SMDA is not present:</PageText>

      <PageCode>{text}</PageCode>

      {hasSubscriptionKey ? (
        <PageText>
          ✅ SMDA <strong>subscription key</strong> is present
        </PageText>
      ) : (
        <PageText>
          ⛔ An SMDA <strong>subscription key</strong> is not present, please{" "}
          <Link to="/user/keys">add this key</Link>
        </PageText>
      )}
    </>
  );
}

function SmdaOk() {
  return (
    <>
      <PageText>SMDA can be accessed.</PageText>
    </>
  );
}

function Content() {
  const { data: healthOk } = useSmdaHealthCheck();

  return (
    <>{healthOk.status ? <SmdaOk /> : <SmdaNotOk text={healthOk.text} />}</>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>SMDA</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
