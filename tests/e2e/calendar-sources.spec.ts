import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.describe("property reservation sources", () => {
  test.skip(
    process.env.RUN_CALENDAR_E2E !== "1",
    "Run after applying the Sprint 1B migration with RUN_CALENDAR_E2E=1.",
  );

  test("connect form, validation and a secret-safe source card render responsively", async ({
    page,
  }, testInfo) => {
    test.skip(
      !["desktop-1440", "mobile-390"].includes(testInfo.project.name),
      "Representative desktop and 390px mobile projects cover this flow.",
    );
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service)
      throw new Error("Supabase environment is incomplete");
    const root = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const nonce = `${Date.now().toString(36)}-${testInfo.project.name}`;
    const email = `calendar-ui-${nonce}@example.invalid`;
    const password = `Qc!${crypto.randomBytes(18).toString("base64url")}`;
    const rawUrl = `https://calendar.example.invalid/private/${nonce}/secret.ics`;
    let userId = "";
    let accountId = "";
    try {
      const created = await root.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_kind: "quickola_business",
          business_name: `Calendar UI ${nonce}`,
          full_name: "Calendar Operator",
        },
      });
      if (created.error) throw created.error;
      userId = created.data.user.id;
      const client = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error) throw signIn.error;
      const workspace = await client.rpc("ensure_business_workspace");
      if (workspace.error) throw workspace.error;
      const workspaceRow = Array.isArray(workspace.data)
        ? workspace.data[0]
        : workspace.data;
      accountId = workspaceRow.account_id;
      const property = await root
        .from("properties")
        .insert({
          account_id: accountId,
          nickname: "Calendar Harbour House",
          address_line_1: "1 Browser Test Street",
          city: "London",
          postcode: "SW1A 1AA",
          property_type: "airbnb",
          access_method: "Key safe",
          status: "active",
          service_area_status: "eligible",
          is_airbnb_turnover: true,
        })
        .select("id")
        .single();
      if (property.error) throw property.error;

      await page.goto("/business/sign-in");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL((current) => !current.pathname.includes("sign-in"));
      await page.goto(`/business/properties/${property.data.id}?tab=reservations`);
      await expect(
        page.getByRole("heading", { name: "Reservation sources" }),
      ).toBeVisible();
      await expect(page.locator('select[name="provider"]')).toBeVisible();
      await expect(page.locator('input[name="calendarUrl"]').first()).toBeVisible();
      await page.locator('input[name="calendarUrl"]').first().fill("https://localhost/private.ics");
      await page.getByRole("button", { name: "Connect and sync" }).click();
      await expect(page.getByRole("region", { name: "Reservation sources" }).getByRole("alert")).toContainText(
        "This calendar address cannot be connected.",
      );

      const inserted = await root.from("property_calendar_connections").insert({
        account_id: accountId,
        property_id: property.data.id,
        provider: "airbnb",
        display_name: "Airbnb fixture",
        calendar_url_encrypted: `v1:${crypto.randomBytes(32).toString("hex")}`,
        calendar_url_fingerprint: crypto
          .createHash("sha256")
          .update(rawUrl)
          .digest("hex"),
        masked_calendar_url: "calendar.example.invalid/private/••••••••",
        sync_status: "healthy",
        last_successful_sync_at: new Date().toISOString(),
        last_sync_completed_at: new Date().toISOString(),
        created_by: userId,
      });
      if (inserted.error) throw inserted.error;
      await page.reload();
      await expect(page.getByText("Airbnb fixture")).toBeVisible();
      await expect(page.getByText("Healthy", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Sync now" })).toBeEnabled();
      await expect(page.getByText("Pending scheduler")).toBeVisible();
      await expect(page.getByText("calendar.example.invalid/private/••••••••")).toBeVisible();
      expect(await page.locator("body").innerText()).not.toContain(rawUrl);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
    } finally {
      if (accountId)
        await root.from("business_accounts").delete().eq("id", accountId);
      if (userId) await root.auth.admin.deleteUser(userId);
    }
  });
});
