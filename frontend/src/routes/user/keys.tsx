import { Typography } from "@equinor/eds-core-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { Loading } from "../../components/common";
import { EditableTextFieldForm } from "../../components/form";
import { PageHeader, PageSectionSpacer, PageText } from "../../styles/common";
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

      <KeysForm>
        <EditableTextFieldForm
          apiKey="smda_subscription"
          label="SMDA subscription primary key"
          queryClient={queryClient}
          placeholder="(not set)"
          length={32}
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
