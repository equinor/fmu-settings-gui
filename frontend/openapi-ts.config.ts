import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8001/api/v1/openapi.json",
  output: {
    path: "src/client",
    format: "biome",
    lint: "biome",
  },
  plugins: [
    ...defaultPlugins,
    {
      name: "@hey-api/client-axios",
      runtimeConfigPath: "./openapi-ts-axios.config.ts",
    },
    "@hey-api/schemas",
    "@tanstack/react-query",
  ],
});
