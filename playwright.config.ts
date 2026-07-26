import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3108",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-1440",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "desktop-1280",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "tablet-1024",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 1024, height: 900 },
      },
    },
    {
      name: "tablet-768",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        viewport: { width: 768, height: 900 },
      },
    },
    {
      name: "mobile-430",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 430, height: 850 },
      },
    },
    {
      name: "mobile-375",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 375, height: 800 },
      },
    },
    {
      name: "mobile-412",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 412, height: 850 },
      },
    },
    {
      name: "mobile-390",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "mobile-360",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: "mobile-320",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 320, height: 700 },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --port 3108",
    url: "http://127.0.0.1:3108",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
