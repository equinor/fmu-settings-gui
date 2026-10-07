import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    rolldownOptions: {
      input: {
        index: "index.html",
        redirect: "redirect.html",
      },
    },
  },
  plugins: [
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
