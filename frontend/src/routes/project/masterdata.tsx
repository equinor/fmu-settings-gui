import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button, DotProgress, Typography } from "@equinor/eds-core-react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

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
import { PageCode, PageHeader, PageText, WarningBox } from "#styles/common";
import { handleAddSsoAccessToken, handleSsoLogin } from "#utils/authentication";
import {
  getStorageItem,
  STORAGENAME_MASTERDATA_EDIT_MODE,
  setStorageItem,
} from "#utils/storage";

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
  const queryClient = useQueryClient();
  const { accessToken } = Route.useRouteContext();
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
    <PageText>
      {isAuthenticated ? (
        <>
          ✅ You are logged in with SSO and an <strong>access token</strong> is
          present. Try adding it to the session:{" "}
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
          ⛔ An SSO <strong>access token</strong> is not present, please log in:{" "}
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
  );
}

function SmdaNotOk({ text }: { text: string }) {
  return (
    <WarningBox>
      <PageText>Required data for editing masterdata is not present:</PageText>

      <PageCode>{text}</PageCode>

      <SubscriptionKeyPresence />
      <AccessTokenPresence />
    </WarningBox>
  );
}

function Content() {
  const project = useProject();
  const { data: healthOk } = useSmdaHealthCheck();
  const [masterdataEditMode, setMasterdataEditMode] = useState(
    getStorageItem(sessionStorage, STORAGENAME_MASTERDATA_EDIT_MODE, "boolean"),
  );

  useEffect(() => {
    setStorageItem(
      sessionStorage,
      STORAGENAME_MASTERDATA_EDIT_MODE,
      masterdataEditMode,
    );
  }, [masterdataEditMode]);

  function toggleMasterdataEditMode() {
    setMasterdataEditMode((prevMode) => !prevMode);
  }
  if (!project.status) {
    return <PageText>Project not set.</PageText>;
  }

  return (
    <>
      <Overview
        projectMasterdata={project.data?.config.masterdata?.smda ?? undefined}
        smdaHealthStatus={healthOk.status}
        projectReadOnly={!(project.lockStatus?.is_lock_acquired ?? false)}
        masterdataEditMode={masterdataEditMode}
      />

      {masterdataEditMode ? (
        !healthOk.status && <SmdaNotOk text={healthOk.text} />
      ) : (
        <PageText>
          💡 To manage masterdata,{" "}
          <Typography onClick={toggleMasterdataEditMode} link>
            enable editing mode.
          </Typography>
        </PageText>
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
