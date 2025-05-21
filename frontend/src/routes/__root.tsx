import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  ErrorComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import axios from "axios";
import { useEffect } from "react";

import {
  v1GetProjectOptions,
  v1GetProjectQueryKey,
} from "../client/@tanstack/react-query.gen";
import { client } from "../client/client.gen";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { TokenStatus } from "../enums";
import { RouterContext } from "../main";
import GlobalStyle from "../styles/global";
import { getApiToken, isApiToken } from "../utils/authentication";
import { AppContainer } from "./index.style";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location, matches }) => {
    let apiTokenStatus: TokenStatus;
    let projectDirNotFound = false;

    const apiToken = context.apiToken || getApiToken();
    if (isApiToken(apiToken)) {
      apiTokenStatus = TokenStatus.OK;
      if (apiToken !== context.apiToken) {
        client.setConfig({
          headers: {
            "x-fmu-settings-api": apiToken,
          },
        });
        context.setApiToken(apiToken);
      }

      const projectDirQueryState = context.queryClient.getQueryState(
        v1GetProjectQueryKey(),
      );
      if (
        projectDirQueryState !== undefined &&
        projectDirQueryState.status === "error" &&
        axios.isAxiosError(projectDirQueryState.error) &&
        projectDirQueryState.error.status === 404
      ) {
        projectDirNotFound = true;
      }
      if (projectDirQueryState === undefined || !projectDirNotFound) {
        await context.queryClient
          .fetchQuery(v1GetProjectOptions())
          .catch((error: unknown) => {
            if (axios.isAxiosError(error)) {
              if (error.status === 404) {
                projectDirNotFound = true;
              } else if (error.status === 401) {
                apiTokenStatus = TokenStatus.INVALID;
              } else {
                console.error("      GET /fmu error =", error);
              }
            } else {
              console.error("Unknown error getting FMU directory: ", error);
            }
          });
      }
      if (
        projectDirNotFound &&
        matches.length > 1 && // don't redirect when route not found (when matching only root route)
        location.pathname !== "/directory"
      ) {
        redirect({ to: "/directory", throw: true });
      }
    } else {
      apiTokenStatus = TokenStatus.MISSING;
    }

    return {
      apiTokenStatus,
      projectDirNotFound,
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

  if ([TokenStatus.MISSING, TokenStatus.INVALID].includes(apiTokenStatus)) {
    return (
      <div>
        {apiTokenStatus === TokenStatus.MISSING ? "Missing" : "Invalid"} token,
        please close browser tab and open URL again
      </div>
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
