import { Button } from "@equinor/eds-core-react";
import {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  ErrorComponent,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";

import { userGetUserOptions } from "#client/@tanstack/react-query.gen";
import { Header } from "#components/Header";
import { Sidebar } from "#components/Sidebar";
import type { RouterContext } from "#main";
import { PageContainer, PageHeader, PageText } from "#styles/common";
import GlobalStyle from "#styles/global";
import { getApiToken, isApiTokenNonEmpty } from "#utils/authentication";
import { AppContainer } from "./index.style";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    let apiTokenStatus = context.apiTokenStatus;

    const apiToken = context.apiToken || getApiToken();
    if (isApiTokenNonEmpty(apiToken)) {
      apiTokenStatus = { present: true, valid: true };
      if (apiToken !== context.apiToken) {
        context.setApiToken(apiToken);
      }
    } else {
      apiTokenStatus = { present: false, valid: false };
    }
    context.setApiTokenStatus(apiTokenStatus);

    if (context.hasResponseInterceptor) {
      await context.queryClient
        .fetchQuery({
          ...userGetUserOptions(),
          meta: { errorPrefix: "Error getting initial user data" },
          retry: 3,
        })
        .catch(() => undefined);
    }

    return {
      apiToken,
      apiTokenStatus,
    };
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ({ error }) => StandardErrorComponent(error),
});

function NotFoundComponent() {
  return <div>Not found</div>;
}

function StandardErrorComponent(error: Error) {
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return <ErrorComponent error={error} />;
}

function ErrorFallbackComponent({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <>
      <PageHeader>Error</PageHeader>

      <PageText>An error occured: {error.message}</PageText>

      <PageText>Please try again, or go to another page.</PageText>

      <Button onClick={resetErrorBoundary}>Retry</Button>
    </>
  );
}

function RootComponent() {
  const location = useLocation();
  const { apiTokenStatus } = Route.useRouteContext();

  if (!apiTokenStatus.present || !apiTokenStatus.valid) {
    return (
      <>
        <div>
          {!apiTokenStatus.present ? "Missing" : "Invalid"} token, please close
          browser tab and open URL again
        </div>
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <ToastContainer theme="colored" />

      <AppContainer>
        <div className="header">
          <Header />
        </div>
        <div className="sidebar">
          <Sidebar />
        </div>
        <div className="content">
          <PageContainer>
            <QueryErrorResetBoundary>
              {({ reset }) => (
                <ErrorBoundary
                  resetKeys={[location.pathname]}
                  onReset={reset}
                  FallbackComponent={ErrorFallbackComponent}
                >
                  <Outlet />
                </ErrorBoundary>
              )}
            </QueryErrorResetBoundary>
          </PageContainer>
        </div>
      </AppContainer>

      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  );
}
