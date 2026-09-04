import { test, expect } from "@playwright/test";

test.describe("marketplace dispute sandbox lifecycle", () => {
  test.skip(process.env.QUICKOLA_E2E_ENABLED !== "true", "Opt-in sandbox E2E only");

  test("sandbox app exposes the sign-in entry point", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in to quickola/i })).toBeVisible();
  });

  test("Complete dispute, admin resolution, and Stripe refund lifecycle", async () => {
    test.fixme(true, "Requires isolated authenticated contexts and Stripe CLI forwarding; see docs/marketplace-sandbox.md");
  });
});
