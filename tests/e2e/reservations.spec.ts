import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.describe("manual reservation lifecycle", () => {
  test.skip(
    process.env.RUN_RESERVATION_E2E !== "1",
    "Run after applying the Sprint 1A migration with RUN_RESERVATION_E2E=1.",
  );

  test("list, create, detail, edit, linked turnover and cancellation work responsively", async ({
    page,
  }, testInfo) => {
    test.skip(
      !["desktop-1440", "mobile-390"].includes(testInfo.project.name),
      "Representative desktop and mobile projects cover this authenticated flow.",
    );
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service) throw new Error("Supabase environment is incomplete");
    const root = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const nonce = `${Date.now().toString(36)}-${testInfo.project.name}`;
    const email = `reservation-ui-${nonce}@example.invalid`;
    const password = `Qu!${crypto.randomBytes(18).toString("base64url")}`;
    let userId = "";
    let accountId = "";
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    try {
      const created = await root.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_kind: "quickola_business",
          business_name: `Reservation UI ${nonce}`,
          full_name: "Reservation Operator",
        },
      });
      if (created.error) throw created.error;
      userId = created.data.user.id;
      const authClient = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const signedIn = await authClient.auth.signInWithPassword({ email, password });
      if (signedIn.error) throw signedIn.error;
      const workspace = await authClient.rpc("ensure_business_workspace");
      if (workspace.error) throw workspace.error;
      const workspaceRow = Array.isArray(workspace.data)
        ? workspace.data[0]
        : workspace.data;
      accountId = workspaceRow.account_id;
      const property = await root
        .from("properties")
        .insert({
          account_id: accountId,
          nickname: "Playwright Harbour House",
          address_line_1: "1 Browser Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          property_type: "flat",
          bedrooms: 2,
          bathrooms: 1,
          access_method: "Key safe",
          status: "active",
          service_area_status: "eligible",
          is_airbnb_turnover: true,
          default_checkout_time: "11:00",
          default_checkin_time: "15:00",
          estimated_turnover_minutes: 180,
          required_completion_photos: 2,
        })
        .select("id")
        .single();
      if (property.error) throw property.error;

      await page.goto("/business/sign-in");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL((current) => !current.pathname.includes("sign-in"));

      await page.goto("/business/reservations");
      await expect(page.getByRole("heading", { level: 1, name: "Reservations" })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
      await page.goto("/business/reservations/new");
      await test.step("new reservation form renders before any action is submitted", async () => {
        await expect(
          page.getByRole("heading", { level: 1, name: "Add reservation" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Create reservation" }),
        ).toBeEnabled();
        await expect(page.locator('form [role="alert"]')).toHaveCount(0);
        expect(browserErrors).toEqual([]);
      });

      await test.step("validation failure keeps a complete visible action state", async () => {
        await page.getByRole("button", { name: "Create reservation" }).click();
        await expect(page.locator('form [role="alert"]')).toContainText(
          "Review the highlighted reservation details.",
        );
        await expect(page.getByText("Enter the check-in date.")).toBeVisible();
        await expect(page).toHaveURL(/\/business\/reservations\/new$/);
        expect(browserErrors).toEqual([]);
      });

      const future = new Date();
      future.setUTCDate(future.getUTCDate() + 10);
      const checkout = new Date(future);
      checkout.setUTCDate(checkout.getUTCDate() + 3);
      const date = (value: Date) => value.toISOString().slice(0, 10);
      await page.getByLabel("Guest name").fill("Taylor Guest");
      await page.getByLabel("Guest count").fill("3");
      await page.locator('input[name="checkInDate"]').fill(date(future));
      await page.locator('input[name="checkInTime"]').fill("15:00");
      await page.locator('input[name="checkOutDate"]').fill(date(checkout));
      await page.locator('input[name="checkOutTime"]').fill("11:00");
      await page.getByRole("button", { name: "Create reservation" }).click();
      await page.waitForURL(/\/business\/reservations\/[0-9a-f-]+\?created=1/);
      await expect(page.getByRole("status")).toContainText("one linked turnover");
      await expect(page.getByRole("heading", { name: "Linked turnover" })).toBeVisible();
      await expect(page.getByRole("link", { name: "View turnover" })).toBeVisible();
      await expect(page.getByText("Reservation created", { exact: true })).toBeVisible();
      await expect(page.getByText("Turnover created", { exact: true })).toBeVisible();

      const detailUrl = page.url().split("?")[0];
      await page.getByRole("link", { name: "Edit reservation" }).click();
      await test.step("edit reservation form renders with its initial values", async () => {
        await expect(page.getByRole("heading", { name: "Edit reservation" })).toBeVisible();
        await expect(page.getByLabel("Guest name")).toHaveValue("Taylor Guest");
        await expect(page.getByLabel("Guest count")).toHaveValue("3");
        await expect(page.locator('form [role="alert"]')).toHaveCount(0);
        expect(browserErrors).toEqual([]);
      });
      await page.getByLabel("Guest count").fill("4");
      await page.locator('input[name="checkOutTime"]').fill("12:00");
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.waitForURL(/\?updated=1/);
      await expect(page.getByRole("status")).toContainText("linked turnover updated");
      await expect(page.getByText(/Check-out changed from/)).toBeVisible();

      await page.getByRole("button", { name: "Cancel reservation" }).click();
      const dialog = page.getByRole("dialog", { name: "Cancel this reservation?" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Yes, cancel reservation" }).click();
      await page.waitForURL(/\?cancelled=1/);
      await expect(page.getByRole("status")).toContainText("linked turnover cancelled");
      await expect(page.getByRole("button", { name: "Cancel reservation" })).toHaveCount(0);
      await expect(page.getByText("Reservation cancelled", { exact: true })).toBeVisible();
      await expect(page.getByText("Turnover cancelled", { exact: true })).toBeVisible();

      await page.goto("/business/reservations?view=cancelled");
      await expect(page.getByRole("link", { name: /Playwright Harbour House/ })).toBeVisible();
      await page.goto(detailUrl);
      await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
    } finally {
      if (accountId) await root.from("business_accounts").delete().eq("id", accountId);
      if (userId) await root.auth.admin.deleteUser(userId);
    }
  });
});
