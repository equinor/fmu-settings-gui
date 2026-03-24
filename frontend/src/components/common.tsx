import { Dialog } from "@equinor/eds-core-react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import type { ReactNode } from "react";
import {
  ErrorBoundary,
  type FallbackProps,
  getErrorMessage,
} from "react-error-boundary";

import { GeneralButton } from "#components/form/button";
import { GenericDialog, PageHeader, PageText } from "#styles/common";

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
