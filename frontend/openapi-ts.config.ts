import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8000/api/v1/openapi.json",
  output: {
    path: "src/client",
    // The bundled client runtime does not support exactOptionalPropertyTypes.
    header: ({ defaultValue, file }) =>
      file === undefined ||
      file.logicalFilePath.startsWith("client/") ||
      file.logicalFilePath.startsWith("core/")
        ? [...defaultValue, "// @ts-nocheck"]
        : defaultValue,
    postProcess: [
      {
        command: "tools/biome",
        args: ["format", "--config-path=../biome.json", ".."],
      },
      {
        command: "tools/biome",
        args: ["lint", "--config-path=../biome.json", ".."],
      },
    ],
    source: {
      fileName: "openapi",
      path: "./source",
    },
  },
  parser: {
    hooks: {
      operations: {
        isQuery: (op) => {
          if (
            op.method === "post" &&
            [
              "/api/v1/match",
              "/api/v1/smda/field",
              "/api/v1/smda/masterdata",
              "/api/v1/smda/strat_units",
              "/api/v1/smda/well_headers",
            ].includes(op.path)
          ) {
            return true;
          }
        },
      },
    },
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
