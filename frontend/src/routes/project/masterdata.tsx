import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Typography } from "@equinor/eds-core-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";

import { userGetUserOptions } from "#client/@tanstack/react-query.gen";
import { Loading } from "#components/common";
import { GeneralButton } from "#components/form/button";
import { Overview } from "#components/project/masterdata/Overview";
import { useProject } from "#services/project";
import { useSmdaHealthCheck } from "#services/smda";
import { PageCode, PageHeader, PageText, WarningBox } from "#styles/common";
import { handleSsoLogin } from "#utils/authentication";
import {
  getStorageItem,
  STORAGENAME_MASTERDATA_EDIT_MODE,
  setStorageItem,
} from "#utils/storage";

export const Route = createFileRoute("/project/masterdata")({
  component: RouteComponent,
});

function SubscriptionKeyPresence({
  hasSubscriptionKey,
}: {
  hasSubscriptionKey: boolean;
}) {
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

function AccessTokenPresence({
  hasSubscriptionKey,
}: {
  hasSubscriptionKey: boolean;
}) {
  const { setRequestAcquireSsoAccessToken } = Route.useRouteContext();
  const { instance: msalInstance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  return (
    <PageText>
      {isAuthenticated ? (
        <>
          ✅ You are logged in with SSO and an <strong>access token</strong> is
          present
          {hasSubscriptionKey && (
            <>
              . Try adding it to the session:{" "}
              <GeneralButton
                label="Add to session"
                onClick={() => {
                  setRequestAcquireSsoAccessToken(true);
                }}
              />
            </>
          )}
        </>
      ) : (
        <>
          ⛔ An SSO <strong>access token</strong> is not present, please log in:{" "}
          <GeneralButton
            label="Log in"
            onClick={() => {
              handleSsoLogin(msalInstance);
            }}
          />
        </>
      )}
    </PageText>
  );
}

function SmdaNotOk({ text }: { text: string }) {
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const hasSubscriptionKey =
    "smda_subscription" in userData.user_api_keys &&
    typeof userData.user_api_keys.smda_subscription === "string" &&
    userData.user_api_keys.smda_subscription !== "";

  return (
    <WarningBox>
      <PageText>Required data for editing masterdata is not present:</PageText>

      <PageCode>{text}</PageCode>

      <SubscriptionKeyPresence hasSubscriptionKey={hasSubscriptionKey} />

      <AccessTokenPresence hasSubscriptionKey={hasSubscriptionKey} />
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
