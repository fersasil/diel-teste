import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/ui",
  use: { baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3001" },
});
