import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage is explicitly business-only and has no critical accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Managed cleaning for properties and businesses",
  );
  await expect(
    page.getByRole("link", { name: /request business cleaning/i }).first(),
  ).toBeVisible();
  await expect(page.getByText(/book a cleaner for your home/i)).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});

test("business enquiry is usable and clearly non-confirming", async ({
  page,
}) => {
  await page.goto("/business/enquire");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tell us what you manage.",
  );
  await expect(page.getByLabel("Business or organisation")).toBeVisible();
  await expect(page.getByText(/submission does not confirm/i)).toBeVisible();
});

test("consumer booking URLs retire to the business enquiry", async ({
  page,
}) => {
  for (const path of [
    "/book",
    "/regular-cleaner-slough",
    "/slough/langley/cleaner",
    "/commercial-cleaning",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/business\/enquire$/);
  }
});

test("protected portals redirect unauthenticated visitors", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/business/dashboard");
  await expect(page).toHaveURL(/\/business\/sign-in$/);
});

test("primary public pages do not overflow the viewport", async ({ page }) => {
  for (const path of ["/", "/business/enquire", "/about", "/contact"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow, `${path} has horizontal overflow`).toBe(false);
  }
});
