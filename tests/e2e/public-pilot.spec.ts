import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage presents the STR product truthfully and accessibly", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Stop a missed clean becoming your next bad review");
  await expect(page.getByText(/use your existing cleaner/i).first()).toBeVisible();
  await expect(page.getByText("Bring your own cleaner", { exact: true }).first()).toBeVisible();
  for (const contradiction of [
    /Quickola handles the cleaning/i,
    /Quickola arranges the service/i,
    /managed cleaning currently available/i,
    /serving Slough/i,
    /MATO GROUP/i,
  ]) await expect(page.getByText(contradiction)).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ["critical", "serious"].includes(v.impact || ""))).toEqual([]);
});

test("public navigation matches the STR information architecture", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByText("Menu", { exact: true });
  if (await menu.isVisible()) await menu.click();
  const navigation = page.getByRole("navigation", { name: "Primary navigation" }).filter({ visible: true });
  await expect(navigation.getByRole("link", { name: "Product" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "How it works" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "For STR operators" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account" }).first()).toBeVisible();
});

test("product page answers the non-marketplace questions directly", async ({ page }) => {
  await page.goto("/product");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("guest checkout to property ready");
  for (const text of [
    "Does Quickola provide cleaners?",
    "Can I invite my existing cleaner?",
    "How is a property marked ready?",
    "Does Quickola take payment for cleaning?",
    "Will calendar integrations be added later?",
  ]) await expect(page.getByRole("heading", { name: text })).toBeVisible();
});

test("signup collects only the V1 account fields", async ({ page }) => {
  await page.goto("/business/sign-up");
  await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByLabel(/business or portfolio/i)).toHaveCount(0);
  await expect(page.getByLabel(/phone/i)).toHaveCount(0);
  await expect(page.getByLabel(/customer type/i)).toHaveCount(0);
});

test("legacy managed-service URLs permanently redirect to the STR product", async ({ request }) => {
  for (const path of ["/book", "/regular-cleaner-slough", "/slough/langley/cleaner", "/commercial-cleaning", "/solutions/offices"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    expect(response.headers().location, path).toBe("/product");
  }
});

test("obsolete protected booking and finance routes redirect to V1 equivalents", async ({ request }) => {
  const booking = await request.get("/business/bookings", { maxRedirects: 0 });
  const billing = await request.get("/business/billing", { maxRedirects: 0 });
  expect(booking.headers().location).toBe("/business/turnovers");
  expect(billing.headers().location).toBe("/business/settings");
});

test("protected owner and cleaner routes require authentication", async ({ page }) => {
  for (const path of ["/business/dashboard", "/business/turnovers", "/business/cleaners", "/cleaner/today"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/business\/sign-in/);
  }
});

test("public routes have no horizontal overflow", async ({ page }) => {
  for (const path of ["/", "/product", "/business/sign-in", "/business/sign-up", "/terms"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} overflows`).toBe(false);
  }
});

test("llms.txt reflects the current product boundary", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("STR turnover coordination");
  expect(body).toContain("does not supply, source, vet or employ cleaners");
  expect(body).not.toContain("Slough");
});

test("unknown routes render a useful 404", async ({ page }) => {
  const response = await page.goto("/not-a-real-quickola-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That page is not here.");
});
