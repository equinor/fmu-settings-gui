import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRoute,
  ErrorComponent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => {
    return <div>Not found</div>;
  },
  errorComponent: ({ error }) => {
    return <ErrorComponent error={error} />;
  },
});

function Root() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  );
}
