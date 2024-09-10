import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@dorilama/instantdb-byos": path.resolve(__dirname, "../../src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
