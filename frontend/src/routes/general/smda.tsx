import {
  InteractionRequiredAuthError,
  IPublicClientApplication,
} from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@equinor/eds-core-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

import { userGetUserOptions } from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { scopeSmda } from "../../config";
import { useSmdaHealthCheck } from "../../services/smda";
import { PageCode, PageHeader, PageText } from "../../styles/common";

export const Route = createFileRoute("/general/smda")({
  component: RouteComponent,
});

function SubscriptionKeyPresence() {
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const hasSubscriptionKey =
    "smda_subscription" in userData.user_api_keys &&
    userData.user_api_keys.smda_subscription !== "";

  return (
    <PageText>
      {hasSubscriptionKey ? (
        <>
          ✅ SMDA <strong>subscription key</strong> is present
        </>
      ) : (
        <>
          ⛔ An SMDA <strong>subscription key</strong> is not present, please{" "}
          <Link to="/user/keys">add this key</Link>
        </>
      )}
    </PageText>
  );
}

function handleLogin(msalInstance: IPublicClientApplication) {
  try {
    const loginResponse = msalInstance.loginRedirect();
    console.log("   ... loginResponse =", loginResponse);
  } catch (error) {
    console.log("    .... error =", error);
  }
}

function AccessTokenPresence() {
  const { instance: msalInstance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { hasSentAccessToken } = Route.useRouteContext();
  const [hasScope, setHasScope] = useState<boolean | undefined>(undefined);
  console.log("|||| AccessTokenPresence isAuthenticated =", isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      msalInstance
        .acquireTokenSilent({
          scopes: [],
        })
        .then((tokenResponse) => {
          console.log("|||| acquireTokenSilent tokenResponse =", tokenResponse);
          if (tokenResponse.scopes.includes(scopeSmda)) {
            setHasScope(true);
          } else {
            setHasScope(false);
          }
        })
        .catch((error: unknown) => {
          console.log("|||| acquireTokenSilent error =", error);
          if (error instanceof InteractionRequiredAuthError) {
            return msalInstance.acquireTokenRedirect({
              scopes: [],
            });
          }
        });
    }
  }, [isAuthenticated, msalInstance]);

  if (!isAuthenticated) {
    return (
      <PageText>
        ⛔ An SSO <strong>access token</strong> is not present, please log in:{" "}
        <Button
          onClick={() => {
            handleLogin(msalInstance);
          }}
        >
          Log in
        </Button>
      </PageText>
    );
  }

  return (
    <>
      <PageText>
        ✅ You are logged in with SSO and an <strong>access token</strong> is
        present
      </PageText>

      {hasScope !== undefined && (
        <>
          <PageText>
            {hasScope ? (
              <>
                ✅ Access token contains required <strong>scope</strong>
              </>
            ) : (
              <>
                ⛔ Access token is missing required <strong>scope</strong>,
                access to SMDA is not granted
              </>
            )}
          </PageText>

          <PageText>
            {hasSentAccessToken
              ? "✅ Access token has been added to session"
              : "⛔ Access token has not been added to session"}
          </PageText>
        </>
      )}
    </>
  );
}

function SmdaNotOk({ text }: { text: string }) {
  return (
    <>
      <PageText>Required data for accessing SMDA is not present:</PageText>

      <PageCode>{text}</PageCode>

      <SubscriptionKeyPresence />

      <AccessTokenPresence />
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
