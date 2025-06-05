import {
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

import { Message, Options, V1CreateSessionData } from "./client";
import { v1CreateSessionMutation } from "./client/@tanstack/react-query.gen";
import { client } from "./client/client.gen";
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
    Options<V1CreateSessionData>
  >;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

interface QueryMeta extends Record<string, unknown> {
  errorMessage?: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: QueryMeta;
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(
        `${query.meta?.errorMessage ?? "Error getting data"}:`,
        isAxiosError(error) &&
          error.response?.data &&
          "detail" in error.response.data
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            error.response.data.detail
          : error.message,
      );
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 300000,
    },
    mutations: {
      onError: (error) => {
        console.error("Error updating data:", error);
      },
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
    ...v1CreateSessionMutation(),
    onError: (error) => {
      console.error("Error creating session:", error.message);
    },
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

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}
