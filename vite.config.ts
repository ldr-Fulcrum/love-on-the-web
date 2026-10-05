import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    pool: "threads",
    maxWorkers: 1,
    testTimeout: 15000,
    execArgv: ["--no-experimental-webstorage"],
  },
});
