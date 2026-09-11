import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        redirect: "redirect.html",
      },
    },
  },
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      routeFileIgnorePattern: ".style.ts",
      quoteStyle: "double",
      semicolons: true,
      autoCodeSplitting: true,
    }),
    react(),
  ],
});
