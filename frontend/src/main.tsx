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
import { toast } from "react-toastify";

import { Message, Options, SessionCreateSessionData } from "#client";
import {
  sessionCreateSessionMutation,
  sessionPatchAccessTokenMutation,
  smdaGetHealthQueryKey,
} from "#client/@tanstack/react-query.gen";
import { client } from "#client/client.gen";
import { msalConfig } from "#config";
import {
  isApiTokenNonEmpty,
  queryAndMutationRetry,
  responseInterceptorFulfilled,
  responseInterceptorRejected,
  TokenStatus,
} from "#utils/authentication";
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
    Message,
    AxiosError,
    Options<SessionCreateSessionData>
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
      const message =
        `${
          query.meta && "errorPrefix" in query.meta
            ? String(query.meta.errorPrefix)
            : "Error getting data"
        }: ` +
        (isAxiosError(error) &&
        error.response?.data &&
        "detail" in error.response.data
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            String(error.response.data.detail)
          : error.message);
      console.error(message);
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const message =
        `${
          mutation.meta && "errorPrefix" in mutation.meta
            ? String(mutation.meta.errorPrefix)
            : "Error updating data"
        }: ` +
        (isAxiosError(error) &&
        error.response?.data &&
        "detail" in error.response.data
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            String(error.response.data.detail)
          : error.message);
      console.error(message);
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 300000,
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
  const [apiToken, setApiToken] = useState<string>("");
  const [apiTokenStatus, setApiTokenStatus] = useState<TokenStatus>({});
  const [hasResponseInterceptor, setHasResponseInterceptor] =
    useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>("");

  const { mutateAsync: createSessionMutateAsync } = useMutation({
    ...sessionCreateSessionMutation(),
    meta: { errorPrefix: "Error creating session" },
  });
  const { mutate: patchAccessTokenMutate } = useMutation({
    ...sessionPatchAccessTokenMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: smdaGetHealthQueryKey(),
      });
    },
    retry: (failureCount: number, error: Error) =>
      queryAndMutationRetry(failureCount, error),
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
          createSessionMutateAsync,
        ),
      );
      setHasResponseInterceptor(true);
    }
    return () => {
      if (id !== undefined) {
        client.instance.interceptors.response.eject(id);
      }
    };
  }, [createSessionMutateAsync, apiToken, apiTokenStatus.valid]);

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
            patchAccessTokenMutate({
              body: { id: "smda_api", key: payload.accessToken },
            });
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
