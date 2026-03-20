import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  ErrorComponent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import { userGetUserOptions } from "#client/@tanstack/react-query.gen";
import { QueryErrorBoundary } from "#components/common";
import { Header } from "#components/Header";
import { LockExpireNotification } from "#components/LockExpireNotification";
import { ProjectRecoveryNotification } from "#components/ProjectRecoveryNotification";
import { Sidebar } from "#components/Sidebar";
import type { RouterContext } from "#main";
import { PageContainer } from "#styles/common";
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

function RootComponent() {
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
      <ProjectRecoveryNotification />
      <LockExpireNotification />

      <AppContainer>
        <div className="header">
          <Header />
        </div>
        <div className="sidebar">
          <Sidebar />
        </div>
        <div className="content">
          <PageContainer>
            <QueryErrorBoundary header="Error">
              <Outlet />
            </QueryErrorBoundary>
          </PageContainer>
        </div>
      </AppContainer>

      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  );
}
