import {
  InteractionRequiredAuthError,
  IPublicClientApplication,
} from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, DotProgress } from "@equinor/eds-core-react";
import {
  UseMutateFunction,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Suspense, useEffect } from "react";
import { toast } from "react-toastify";

import { Message, Options, SessionPatchAccessTokenData } from "../../client";
import {
  sessionPatchAccessTokenMutation,
  smdaGetHealthQueryKey,
  userGetUserOptions,
} from "../../client/@tanstack/react-query.gen";
import { Loading } from "../../components/common";
import { ssoScopes } from "../../config";
import { useSmdaHealthCheck } from "../../services/smda";
import { PageCode, PageHeader, PageText } from "../../styles/common";
import { queryAndMutationRetry } from "../../utils/authentication";

export const Route = createFileRoute("/project/masterdata")({
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
          <Link to="/user/keys" hash="smda_subscription">
            add this key
          </Link>
        </>
      )}
    </PageText>
  );
}

function handleLogin(msalInstance: IPublicClientApplication) {
  try {
    void msalInstance.loginRedirect({ scopes: ssoScopes });
  } catch (error) {
    console.error("Error when logging in to SSO: ", error);
    toast.error(String(error));
  }
}

function handleAddAccessToken(
  accessToken: string,
  patchAccessTokenMutate: UseMutateFunction<
    Message,
    AxiosError,
    Options<SessionPatchAccessTokenData>
  >,
) {
  patchAccessTokenMutate({ body: { id: "smda_api", key: accessToken } });
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
    retry: (failureCount: number, error: Error) =>
      queryAndMutationRetry(failureCount, error),
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
                handleAddAccessToken(accessToken, patchAccessTokenMutate);
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
                handleLogin(msalInstance);
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
      <PageHeader>Masterdata</PageHeader>

      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}
