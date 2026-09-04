import { test, expect } from "@playwright/test";

test.describe("marketplace normal sandbox lifecycle", () => {
  test.skip(process.env.QUICKOLA_E2E_ENABLED !== "true", "Opt-in sandbox E2E only");

  test("sandbox app exposes the customer entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Quickola/i);
    await expect(page.getByRole("link", { name: /post a job/i }).first()).toBeVisible();
  });

  test("Complete customer/provider OAuth and Stripe Checkout lifecycle", async () => {
    test.fixme(true, "Requires isolated OAuth browser contexts and Stripe CLI forwarding; see docs/marketplace-sandbox.md");
  });
});
