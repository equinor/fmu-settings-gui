import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "../../components/common";
import { useSmdaHealthCheck } from "../../services/smda";
import { PageCode, PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/general/smda")({
  component: RouteComponent,
});

function SmdaNotOk({ text }: { text: string }) {
  return (
    <>
      <PageText>Required data for accessing SMDA is not present:</PageText>

      <PageCode>{text}</PageCode>

      <PageText>Please perform a login to get a valid access token.</PageText>
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
