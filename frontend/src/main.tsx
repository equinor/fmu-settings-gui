import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { client } from "./client/client.gen";
import { routeTree } from "./routeTree.gen";
import { getApiToken } from "./utils/authentication";

const queryClient = new QueryClient();

const apiToken = getApiToken();
if (apiToken !== "") {
  client.setConfig({
    headers: {
      "x-fmu-settings-api": apiToken,
    },
  });
  history.pushState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  // eslint-disable-next-line no-unused-vars
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
