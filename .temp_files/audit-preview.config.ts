import { defineConfig } from "@playwright/test";
import config from "../playwright.config";

const baseURL = process.env.UI_AUDIT_PREVIEW_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+\/$/.test(baseURL))
  throw new Error(
    "Supply the dedicated, freshly built local audit preview URL.",
  );

export default defineConfig({
  ...config,
  testDir: "../tests",
  outputDir: "../test-results",
  use: { ...config.use, baseURL },
  webServer: undefined,
  reporter: [["list"]],
});
