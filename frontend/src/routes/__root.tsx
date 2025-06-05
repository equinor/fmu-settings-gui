import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  ErrorComponent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { isAxiosError } from "axios";
import { useEffect } from "react";

import { v1GetUserOptions } from "../client/@tanstack/react-query.gen";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { RouterContext } from "../main";
import GlobalStyle from "../styles/global";
import {
  getApiToken,
  isApiTokenNonEmpty,
  isApiUrlSession,
} from "../utils/authentication";
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
          ...v1GetUserOptions(),
          retry: (failureCount, error) => {
            if (
              isAxiosError(error) &&
              isApiUrlSession(error.response?.config.url) &&
              error.status === 401
            ) {
              // Don't retry query if it resulted in a failed session creation
              return false;
            }
            // Specify at most 2 retries
            return failureCount < 2;
          },
          meta: {
            errorMessage: "Error getting initial user data",
          },
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

      <AppContainer>
        <div className="header">
          <Header />
        </div>
        <div className="sidebar">
          <Sidebar />
        </div>
        <div className="content">
          <Outlet />
        </div>
      </AppContainer>

      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  );
}
