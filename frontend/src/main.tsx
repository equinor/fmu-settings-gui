import {
  AuthenticationResult,
  EventMessage,
  EventType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
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

import { Message, Options, SessionCreateSessionData } from "./client";
import { sessionCreateSessionMutation } from "./client/@tanstack/react-query.gen";
import { client } from "./client/client.gen";
import { msalConfig } from "./config";
import { routeTree } from "./routeTree.gen";
import {
  isApiTokenNonEmpty,
  responseInterceptorFulfilled,
  responseInterceptorRejected,
  TokenStatus,
} from "./utils/authentication";

export interface RouterContext {
  queryClient: QueryClient;
  apiToken: string;
  setApiToken: Dispatch<SetStateAction<string>>;
  apiTokenStatus: TokenStatus;
  setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>;
  hasResponseInterceptor: boolean;
  projectDirNotFound: boolean;
  createSessionMutateAsync: UseMutateAsyncFunction<
    Message,
    AxiosError,
    Options<SessionCreateSessionData>
  >;
  hasSentAccessToken: boolean;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

interface QueryMutationMeta extends Record<string, unknown> {
  errorPrefix?: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: QueryMutationMeta;
    mutationMeta: QueryMutationMeta;
  }
}

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
    projectDirNotFound: false,
    createSessionMutateAsync: undefined!,
    hasSentAccessToken: false,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  notFoundMode: "root",
});

export function App() {
  const [apiToken, setApiToken] = useState<string>("");
  const [apiTokenStatus, setApiTokenStatus] = useState<TokenStatus>({});
  const [hasResponseInterceptor, setHasResponseInterceptor] =
    useState<boolean>(false);
  const { mutateAsync: createSessionMutateAsync } = useMutation({
    ...sessionCreateSessionMutation(),
    meta: { errorPrefix: "Error creating session" },
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

  useEffect(() => {
    if (hasResponseInterceptor) {
      void router.invalidate();
    }
  }, [hasResponseInterceptor]);

  return (
    <RouterProvider
      router={router}
      context={{
        apiToken,
        setApiToken,
        apiTokenStatus,
        setApiTokenStatus,
        hasResponseInterceptor,
        createSessionMutateAsync,
      }}
    />
  );
}

const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize().then(() => {
  console.log("!!!! has initialized msalInstance");
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    console.log(
      "|| msal settings active account due to accounts list, accounts =",
      accounts,
    );
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    console.log("|||| msal event type =", event.eventType);
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      console.log(
        "|| msal settings active account due to login event, event =",
        event,
      );
      const payload = event.payload as AuthenticationResult;
      const account = payload.account;
      msalInstance.setActiveAccount(account);
    }
  });

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
});
