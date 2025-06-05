import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  UseMutateAsyncFunction,
  useMutation,
} from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AxiosError, AxiosResponse, isAxiosError } from "axios";
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
  createSessionAsync,
  isApiTokenNonEmpty,
  isApiUrlSession,
  removeTokenFromStorage,
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

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(
        "Error getting data:",
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

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
        (response: AxiosResponse) => {
          if (isApiUrlSession(response.config.url) && !apiTokenStatus.valid) {
            setApiTokenStatus((apiTokenStatus) => ({
              ...apiTokenStatus,
              valid: true,
            }));
          }
          return response;
        },
        async (error: AxiosError) => {
          if (error.status === 401) {
            if (isApiUrlSession(error.response?.config.url)) {
              if (isApiTokenNonEmpty(apiToken)) {
                setApiToken(() => "");
                removeTokenFromStorage();
              }
              if (apiTokenStatus.valid) {
                setApiTokenStatus(() => ({}));
              }
            } else {
              await createSessionAsync(createSessionMutateAsync, apiToken);
            }
          }
          return Promise.reject(error);
        },
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
