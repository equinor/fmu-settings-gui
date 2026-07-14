import {
  type AccountInfo,
  type AuthenticationResult,
  type EventMessage,
  EventType,
  InteractionRequiredAuthError,
  InteractionType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type UseMutateAsyncFunction,
  useMutation,
} from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { type AxiosError, isAxiosError } from "axios";
import {
  type Dispatch,
  type SetStateAction,
  StrictMode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom/client";

import type { Options, SessionPostSessionData, SessionResponse } from "#client";
import {
  projectGetProjectQueryKey,
  sessionPatchAccessTokenMutation,
  sessionPostSessionMutation,
  smdaGetHealthQueryKey,
  userGetUserQueryKey,
} from "#client/@tanstack/react-query.gen";
import { client } from "#client/client.gen";
import { msalConfig, ssoScopes } from "#config";
import {
  createSessionAsync,
  handleAddSsoAccessToken,
  isApiTokenNonEmpty,
  responseInterceptorFulfilled,
  responseInterceptorRejected,
  type TokenStatus,
} from "#utils/authentication";
import { defaultErrorHandling, mutationRetry } from "#utils/query";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: QueryClient;
  apiToken: string;
  setApiToken: Dispatch<SetStateAction<string>>;
  apiTokenStatus: TokenStatus;
  setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>;
  selectProjectInvalidAttempt: number;
  setSelectProjectInvalidAttempt: Dispatch<SetStateAction<number>>;
  hasResponseInterceptor: boolean;
  sessionReady: boolean;
  sessionCreationFailed: boolean;
  accessToken: string;
  createSessionMutateAsync: UseMutateAsyncFunction<
    SessionResponse,
    AxiosError,
    Options<SessionPostSessionData>
  >;
  setRequestAcquireSsoAccessToken: Dispatch<SetStateAction<boolean>>;
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
  resetQueryOnError?: Array<number>;
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
        resetQueryOnError = [],
      } = query.meta ?? {};

      const responseStatus =
        isAxiosError(error) && error.response
          ? error.response.status
          : undefined;

      if (
        responseStatus &&
        resetQueryOnError.includes(responseStatus) &&
        query.state.data !== undefined
      ) {
        query.reset();
      }

      const preventDefault =
        responseStatus !== undefined &&
        preventDefaultErrorHandling.includes(responseStatus);

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
    apiToken: undefined as unknown as string,
    setApiToken: undefined as unknown as Dispatch<SetStateAction<string>>,
    apiTokenStatus: undefined as unknown as TokenStatus,
    setApiTokenStatus: undefined as unknown as Dispatch<
      SetStateAction<TokenStatus>
    >,
    selectProjectInvalidAttempt: 0,
    setSelectProjectInvalidAttempt: undefined as unknown as Dispatch<
      SetStateAction<number>
    >,
    hasResponseInterceptor: false,
    sessionReady: false,
    sessionCreationFailed: false,
    accessToken: undefined as unknown as string,
    createSessionMutateAsync: undefined as unknown as UseMutateAsyncFunction<
      SessionResponse,
      AxiosError,
      Options<SessionPostSessionData>
    >,
    setRequestAcquireSsoAccessToken: undefined as unknown as Dispatch<
      SetStateAction<boolean>
    >,
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
  const [selectProjectInvalidAttempt, setSelectProjectInvalidAttempt] =
    useState(0);
  const [hasResponseInterceptor, setHasResponseInterceptor] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [requestSessionCreation, setRequestSessionCreation] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionCreationFailed, setSessionCreationFailed] = useState(false);
  const [requestAcquireSsoAccessToken, setRequestAcquireSsoAccessToken] =
    useState(false);
  const acquireAndPatchSsoAccessTokenPromise = useRef<
    Promise<void> | undefined
  >(undefined);

  const { mutateAsync: createSessionMutateAsync } = useMutation({
    ...sessionPostSessionMutation(),
    meta: { errorPrefix: "Error creating session" },
  });
  const {
    mutate: patchAccessTokenMutate,
    mutateAsync: patchAccessTokenMutateAsync,
  } = useMutation({
    ...sessionPatchAccessTokenMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: smdaGetHealthQueryKey(),
      });
    },
    meta: { errorPrefix: "Error adding access token to session" },
  });

  const acquireAndPatchSsoAccessToken = useCallback(async () => {
    acquireAndPatchSsoAccessTokenPromise.current ??= (async () => {
      const account = msalInstance.getActiveAccount();
      const accounts = msalInstance.getAllAccounts();
      const tokenAccount = account ?? accounts.at(0);

      if (tokenAccount === undefined) {
        await msalInstance.acquireTokenRedirect({ scopes: ssoScopes });

        return;
      }

      const result = await msalInstance
        .acquireTokenSilent({
          scopes: ssoScopes,
          account: tokenAccount,
        })
        .catch((error: unknown) => {
          if (error instanceof InteractionRequiredAuthError) {
            return msalInstance.acquireTokenRedirect({ scopes: ssoScopes });
          }

          console.error("Error acquiring SSO token: ", error);
        });

      if (result) {
        setAccessToken(result.accessToken);
        await patchAccessTokenMutateAsync({
          body: { id: "smda_api", key: result.accessToken },
        });
      }
    })().finally(() => {
      acquireAndPatchSsoAccessTokenPromise.current = undefined;
    });

    await acquireAndPatchSsoAccessTokenPromise.current;
  }, [msalInstance, patchAccessTokenMutateAsync]);

  useEffect(() => {
    let id: number | undefined;
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
          acquireAndPatchSsoAccessToken,
        ),
      );
      void Promise.resolve().then(() => {
        setHasResponseInterceptor(true);
      });
    }

    return () => {
      if (id !== undefined) {
        client.instance.interceptors.response.eject(id);
        void Promise.resolve().then(() => {
          setHasResponseInterceptor(false);
        });
      }
    };
  }, [acquireAndPatchSsoAccessToken, apiToken, apiTokenStatus.valid]);

  useEffect(() => {
    if (!isApiTokenNonEmpty(apiToken)) {
      void Promise.resolve().then(() => {
        setSessionReady(false);
        setSessionCreationFailed(false);
      });

      return;
    }

    if (
      hasResponseInterceptor &&
      !sessionReady &&
      !sessionCreationFailed &&
      !isCreatingSession &&
      !requestSessionCreation
    ) {
      void Promise.resolve().then(() => {
        setRequestSessionCreation(true);
      });
    }
  }, [
    apiToken,
    hasResponseInterceptor,
    isCreatingSession,
    requestSessionCreation,
    sessionCreationFailed,
    sessionReady,
  ]);

  useEffect(() => {
    async function callCreateSessionAsync() {
      await createSessionAsync(createSessionMutateAsync, apiToken);
    }

    if (requestSessionCreation && !isCreatingSession) {
      void Promise.resolve().then(() => {
        setIsCreatingSession(true);
        setSessionCreationFailed(false);
      });
      void callCreateSessionAsync()
        .then(() => {
          setSessionReady(true);
          void queryClient.invalidateQueries({
            queryKey: userGetUserQueryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: projectGetProjectQueryKey(),
          });
          if (accessToken !== "") {
            handleAddSsoAccessToken(patchAccessTokenMutate, accessToken);
          }
        })
        .catch(() => {
          setSessionReady(false);
          setSessionCreationFailed(true);
        })
        .finally(() => {
          setIsCreatingSession(false);
        });
      void Promise.resolve().then(() => {
        setRequestSessionCreation(false);
      });
    }
  }, [
    accessToken,
    apiToken,
    createSessionMutateAsync,
    isCreatingSession,
    patchAccessTokenMutate,
    requestSessionCreation,
  ]);

  useEffect(() => {
    if (requestAcquireSsoAccessToken) {
      void acquireAndPatchSsoAccessToken();
      void Promise.resolve().then(() => {
        setRequestAcquireSsoAccessToken(false);
      });
    }
  }, [acquireAndPatchSsoAccessToken, requestAcquireSsoAccessToken]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Invalidate router context when some of the content changes
  useEffect(() => {
    void router.invalidate();
  }, [
    hasResponseInterceptor,
    sessionReady,
    sessionCreationFailed,
    accessToken,
    selectProjectInvalidAttempt,
  ]);

  useEffect(() => {
    const id = msalInstance.addEventCallback(
      (event: EventMessage) => {
        if (event.payload) {
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            const account = event.payload as AccountInfo;
            msalInstance.setActiveAccount(account);
          } else if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
            const payload = event.payload as AuthenticationResult;
            setAccessToken(payload.accessToken);
            if (event.interactionType === InteractionType.Redirect) {
              handleAddSsoAccessToken(
                patchAccessTokenMutate,
                payload.accessToken,
              );
            }
          }
        }
      },
      [EventType.LOGIN_SUCCESS, EventType.ACQUIRE_TOKEN_SUCCESS],
    );

    return () => {
      if (id !== null) {
        msalInstance.removeEventCallback(id);
      }
    };
  }, [msalInstance, patchAccessTokenMutate]);

  return (
    <RouterProvider
      router={router}
      context={{
        apiToken,
        setApiToken,
        apiTokenStatus,
        setApiTokenStatus,
        selectProjectInvalidAttempt,
        setSelectProjectInvalidAttempt,
        hasResponseInterceptor,
        sessionReady,
        sessionCreationFailed,
        accessToken,
        createSessionMutateAsync,
        setRequestAcquireSsoAccessToken,
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
