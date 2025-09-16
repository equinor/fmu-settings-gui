import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, DotProgress } from "@equinor/eds-core-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

import {
  sessionPatchAccessTokenMutation,
  smdaGetHealthQueryKey,
  userGetUserOptions,
} from "#client/@tanstack/react-query.gen";
import { Loading } from "#components/common";
import { Overview } from "#components/project/masterdata/Overview";
import { ssoScopes } from "#config";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageCode, PageHeader, PageText } from "#styles/common";
import { handleAddSsoAccessToken, handleSsoLogin } from "#utils/authentication";

export const Route = createFileRoute("/project/masterdata")({
  component: RouteComponent,
});

function SubscriptionKeyPresence() {
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const hasSubscriptionKey =
    "smda_subscription" in userData.user_api_keys &&
    typeof userData.user_api_keys.smda_subscription === "string" &&
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
          <Link to="/user/keys" hash="smda_subscription">
            add this key
          </Link>
        </>
      )}
    </PageText>
  );
}

function AccessTokenPresence() {
  const { queryClient, accessToken } = Route.useRouteContext();
  const { instance: msalInstance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const { mutate: patchAccessTokenMutate, isPending } = useMutation({
    ...sessionPatchAccessTokenMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: smdaGetHealthQueryKey(),
      });
    },
    meta: { errorPrefix: "Error adding access token to session" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      msalInstance
        .acquireTokenSilent({ scopes: ssoScopes })
        .catch((error: unknown) => {
          if (error instanceof InteractionRequiredAuthError) {
            return msalInstance.acquireTokenRedirect({ scopes: ssoScopes });
          }
        });
    }
  }, [isAuthenticated, msalInstance]);

  return (
    <>
      <PageText>
        {isAuthenticated ? (
          <>
            ✅ You are logged in with SSO and an <strong>access token</strong>{" "}
            is present. Try adding it to the session:{" "}
            <Button
              onClick={() => {
                handleAddSsoAccessToken(patchAccessTokenMutate, accessToken);
              }}
            >
              {isPending ? <DotProgress /> : "Add to session"}
            </Button>
          </>
        ) : (
          <>
            ⛔ An SSO <strong>access token</strong> is not present, please log
            in:{" "}
            <Button
              onClick={() => {
                handleSsoLogin(msalInstance);
              }}
            >
              Log in
            </Button>
          </>
        )}
      </PageText>
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

function Content() {
  const { data: project } = useProject();
  const { data: healthOk } = useSmdaHealthCheck();

  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  return (
    <>
      {healthOk.status ? (
        <Overview
          masterdata={project.data?.config.masterdata.smda ?? undefined}
        />
      ) : (
        <SmdaNotOk text={healthOk.text} />
      )}
    </>
  );
}

function RouteComponent() {
  return (
    <>
      <PageHeader>Masterdata</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
