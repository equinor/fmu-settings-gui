import type { CreateClientConfig } from "./src/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  withCredentials: true,
});
