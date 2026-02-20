import {
  AuthenticationResult,
  EventMessage,
  EventType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  UseMutateAsyncFunction,
  useMutation,
} from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AxiosError, isAxiosError } from "axios";
import {
  Dispatch,
  SetStateAction,
  StrictMode,
  useEffect,
  useState,
} from "react";
import ReactDOM from "react-dom/client";

import { Options, SessionPostSessionData, SessionResponse } from "#client";
import {
  sessionPatchAccessTokenMutation,
  sessionPostSessionMutation,
  smdaGetHealthQueryKey,
} from "#client/@tanstack/react-query.gen";
import { client } from "#client/client.gen";
import { msalConfig } from "#config";
import {
  createSessionAsync,
  handleAddSsoAccessToken,
  isApiTokenNonEmpty,
  responseInterceptorFulfilled,
  responseInterceptorRejected,
  TokenStatus,
} from "#utils/authentication";
import { defaultErrorHandling, mutationRetry } from "#utils/query";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: QueryClient;
  apiToken: string;
  setApiToken: Dispatch<SetStateAction<string>>;
  apiTokenStatus: TokenStatus;
  setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>;
  hasResponseInterceptor: boolean;
  accessToken: string;
  createSessionMutateAsync: UseMutateAsyncFunction<
    SessionResponse,
    AxiosError,
    Options<SessionPostSessionData>
  >;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

interface QueryAndMutationMeta extends Record<string, unknown> {
  errorPrefix?: string;
  preventDefaultErrorHandling?: Array<number>;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: QueryAndMutationMeta;
    mutationMeta: QueryAndMutationMeta;
  }
}

const msalInstance = new PublicClientApplication(msalConfig);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const {
        errorPrefix = "Error getting data",
        preventDefaultErrorHandling = [],
      } = query.meta ?? {};

      const preventDefault =
        isAxiosError(error) &&
        error.response?.status &&
        preventDefaultErrorHandling.includes(error.response.status);

      if (!preventDefault) {
        defaultErrorHandling(error, errorPrefix);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const {
        errorPrefix = "Error updating data",
        preventDefaultErrorHandling = [],
      } = mutation.meta ?? {};

      const preventDefault =
        isAxiosError(error) &&
        error.response?.status &&
        preventDefaultErrorHandling.includes(error.response.status);

      if (!preventDefault) {
        defaultErrorHandling(error, errorPrefix);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 300000,
    },
    mutations: {
      retry: (failureCount: number, error: Error) =>
        mutationRetry(failureCount, error),
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    apiToken: undefined!,
    setApiToken: undefined!,
    apiTokenStatus: undefined!,
    setApiTokenStatus: undefined!,
    hasResponseInterceptor: false,
    accessToken: undefined!,
    createSessionMutateAsync: undefined!,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  notFoundMode: "root",
});

export function App() {
  const { instance: msalInstance } = useMsal();
  const [apiToken, setApiToken] = useState("");
  const [apiTokenStatus, setApiTokenStatus] = useState<TokenStatus>({});
  const [hasResponseInterceptor, setHasResponseInterceptor] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [requestSessionCreation, setRequestSessionCreation] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<
    number | undefined
  >();

  const { mutateAsync: createSessionMutateAsync } = useMutation({
    ...sessionPostSessionMutation(),
    meta: { errorPrefix: "Error creating session" },
  });
  const { mutate: patchAccessTokenMutate } = useMutation({
    ...sessionPatchAccessTokenMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: smdaGetHealthQueryKey(),
      });
    },
    meta: { errorPrefix: "Error adding access token to session" },
  });

  useEffect(() => {
    let id: number | undefined = undefined;
    if (isApiTokenNonEmpty(apiToken)) {
      id = client.instance.interceptors.response.use(
        responseInterceptorFulfilled(
          apiTokenStatus.valid ?? false,
          setApiTokenStatus,
        ),
        responseInterceptorRejected(
          apiToken,
          setApiToken,
          apiTokenStatus.valid ?? false,
          setApiTokenStatus,
          setRequestSessionCreation,
          msalInstance,
          setAccessToken,
        ),
      );
      setHasResponseInterceptor(true);
    }

    return () => {
      if (id !== undefined) {
        client.instance.interceptors.response.eject(id);
        setHasResponseInterceptor(false);
      }
    };
  }, [
    createSessionMutateAsync,
    apiToken,
    apiTokenStatus.valid,
    msalInstance,
    setAccessToken,
  ]);

  useEffect(() => {
    async function callCreateSessionAsync() {
      await createSessionAsync(createSessionMutateAsync, apiToken);
    }

    if (requestSessionCreation) {
      if (
        sessionCreatedAt === undefined ||
        Date.now() - sessionCreatedAt > 10_000
      ) {
        setSessionCreatedAt(Date.now());
        void callCreateSessionAsync();
        if (accessToken !== "") {
          handleAddSsoAccessToken(patchAccessTokenMutate, accessToken);
        }
      }
      setRequestSessionCreation(false);
    }
  }, [
    accessToken,
    apiToken,
    createSessionMutateAsync,
    patchAccessTokenMutate,
    requestSessionCreation,
    sessionCreatedAt,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Invalidate router context when some of the content changes
  useEffect(() => {
    void router.invalidate();
  }, [hasResponseInterceptor, accessToken]);

  useEffect(() => {
    const id = msalInstance.addEventCallback(
      (event: EventMessage) => {
        if (event.payload) {
          const payload = event.payload as AuthenticationResult;
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            const account = payload.account;
            msalInstance.setActiveAccount(account);
          } else if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
            setAccessToken(payload.accessToken);
            handleAddSsoAccessToken(
              patchAccessTokenMutate,
              payload.accessToken,
            );
          }
        }

        return () => {
          if (id !== null) {
            msalInstance.removeEventCallback(id);
          }
        };
      },
      [EventType.LOGIN_SUCCESS, EventType.ACQUIRE_TOKEN_SUCCESS],
    );
  }, [msalInstance, patchAccessTokenMutate]);

  return (
    <RouterProvider
      router={router}
      context={{
        apiToken,
        setApiToken,
        apiTokenStatus,
        setApiTokenStatus,
        hasResponseInterceptor,
        accessToken,
        createSessionMutateAsync,
      }}
    />
  );
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>,
  );
}
