import type { CreateClientConfig } from "./src/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  ...(import.meta.env.PROD && { baseURL: window.location.origin }),
  withCredentials: true,
});
