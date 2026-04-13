import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Dialog } from "@equinor/eds-core-react";
import {
  QueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  ErrorBoundary,
  type FallbackProps,
  getErrorMessage,
} from "react-error-boundary";

import { userGetUserOptions } from "#client/@tanstack/react-query.gen";
import { GeneralButton } from "#components/form/button";
import type { HealthCheck } from "#services/smda";
import {
  GenericDialog,
  PageCode,
  PageHeader,
  PageText,
  WarningBox,
} from "#styles/common";
import { handleSsoLogin } from "#utils/authentication";

type StatusCodeHandlingProps = {
  message?: string;
  enableRetry?: boolean;
};

type ErrorFallbackProps = {
  header?: string;
  statusCodeHandling?: Record<number, StatusCodeHandlingProps>;
};

export function Loading() {
  return <PageText>Loading...</PageText>;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
  header,
  statusCodeHandling,
}: FallbackProps & ErrorFallbackProps) {
  let message = `An error occured: ${getErrorMessage(error)}`;
  let enableRetry = true;

  if (
    statusCodeHandling &&
    isAxiosError(error) &&
    error.response &&
    error.response.status in statusCodeHandling
  ) {
    const handling = statusCodeHandling[error.response.status];
    if (handling.message !== undefined) {
      message = handling.message;
    }
    if (handling.enableRetry !== undefined) {
      enableRetry = handling.enableRetry;
    }
  }

  return (
    <>
      {header && <PageHeader>{header}</PageHeader>}

      <PageText>{message}</PageText>

      {enableRetry && (
        <>
          <PageText>Please try again.</PageText>

          <GeneralButton label="Retry" onClick={resetErrorBoundary} />
        </>
      )}
    </>
  );
}

/**
 * Defines an error boundary when using a query.
 * @param children The children around which the error boundary is defined.
 * @param header An optional header for the error message.
 * @param statusCodeHandling An object for optionally defining the handling
 *   of individual HTTP status codes. For each HTTP status code the following
 *   can be set:
 *   - message - The error message to show.
 *   - enableRetry - Whether to show a retry button. Defaults to true.
 * @returns
 */
export function QueryErrorBoundary({
  header,
  statusCodeHandling,
  children,
}: ErrorFallbackProps & {
  children: ReactNode;
}) {
  const location = useLocation();

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          resetKeys={[location.pathname]}
          onReset={reset}
          fallbackRender={(props) => (
            <ErrorFallback
              header={header}
              statusCodeHandling={statusCodeHandling}
              {...props}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export function ConfirmCloseDialog({
  isOpen,
  handleConfirmCloseDecision,
  title = "Discard changes",
  description = "There are unsaved changes in the form. If the editing is cancelled, all changes will be lost.",
  question = "Do you want to discard the changes?",
  confirmLabel = "Keep editing",
  cancelLabel = "Discard changes",
}: {
  isOpen: boolean;
  handleConfirmCloseDecision: (confirm: boolean) => void;
  title?: string;
  description?: string;
  question?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <GenericDialog open={isOpen} $width="32em">
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>

      <Dialog.CustomContent>
        <PageText>{description}</PageText>
        <PageText $marginBottom="0">{question}</PageText>
      </Dialog.CustomContent>

      <Dialog.Actions>
        <GeneralButton
          label={confirmLabel}
          onClick={() => {
            handleConfirmCloseDecision(false);
          }}
        />
        <GeneralButton
          label={cancelLabel}
          variant="outlined"
          onClick={() => {
            handleConfirmCloseDecision(true);
          }}
        />
      </Dialog.Actions>
    </GenericDialog>
  );
}

function SmdaSubscriptionKeyPresence({
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
  setRequestAcquireSsoAccessToken,
}: {
  hasSubscriptionKey: boolean;
  setRequestAcquireSsoAccessToken: Dispatch<SetStateAction<boolean>>;
}) {
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

export function SmdaHealthCheckInfo({
  feature,
  healthCheck,
  setRequestAcquireSsoAccessToken,
}: {
  feature: string;
  healthCheck: HealthCheck;
  setRequestAcquireSsoAccessToken: Dispatch<SetStateAction<boolean>>;
}) {
  const { data: userData } = useSuspenseQuery(userGetUserOptions());

  const hasSubscriptionKey =
    "smda_subscription" in userData.user_api_keys &&
    typeof userData.user_api_keys.smda_subscription === "string" &&
    userData.user_api_keys.smda_subscription !== "";

  if (healthCheck.status) {
    return null;
  }

  return (
    <WarningBox>
      <PageText>Required data for {feature} is not present:</PageText>

      <PageCode>{healthCheck.text}</PageCode>

      <SmdaSubscriptionKeyPresence hasSubscriptionKey={hasSubscriptionKey} />

      <AccessTokenPresence
        hasSubscriptionKey={hasSubscriptionKey}
        setRequestAcquireSsoAccessToken={setRequestAcquireSsoAccessToken}
      />
    </WarningBox>
  );
}
