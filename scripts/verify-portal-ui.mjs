import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  baseURL = process.env.PORTAL_TEST_BASE_URL || "http://127.0.0.1:3112";
if (!url || !serviceKey || !anonKey)
  throw new Error("Supabase configuration required");
const root = createClient(url, serviceKey, { auth: { persistSession: false } }),
  nonce = crypto.randomUUID().slice(0, 8),
  email = `quickola-ui-${nonce}@example.invalid`,
  password = `Portal-${crypto.randomUUID()}!`;
let userId, accountId, propertyId, providerId;
const bookingIds = [];

try {
  const { data: userData, error: userError } = await root.auth.admin.createUser(
    {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_kind: "quickola_business",
        business_name: `Disposable UI ${nonce}`,
        full_name: "Disposable UI",
        customer_type: "property_manager",
      },
    },
  );
  if (userError) throw userError;
  userId = userData.user.id;
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: account } = await root
      .from("business_accounts")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (account) {
      accountId = account.id;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!accountId) throw new Error("workspace_not_created");
  const { data: property, error: propertyError } = await root
    .from("properties")
    .insert({
      account_id: accountId,
      nickname: "Disposable House",
      address_line_1: `${nonce} Test Road`,
      city: "Slough",
      postcode: "SL1 1AA",
      property_type: "house",
      bedrooms: 3,
      bathrooms: 2,
      access_method: "contact",
      service_area_status: "eligible",
    })
    .select()
    .single();
  if (propertyError) throw propertyError;
  propertyId = property.id;
  await root
    .from("terms_acceptances")
    .insert({
      account_id: accountId,
      user_id: userId,
      terms_version: "business-pilot-2026-07-22",
    });
  const { data: provider, error: providerError } = await root
    .from("service_providers")
    .insert({
      name: `Disposable UI team ${nonce}`,
      status: "active",
      service_area: ["SL1"],
    })
    .select()
    .single();
  if (providerError) throw providerError;
  providerId = provider.id;
  const future = new Date(Date.now() + 7 * 86400000).toISOString(),
    past = new Date(Date.now() - 86400000).toISOString();
  const common = {
    account_id: accountId,
    property_id: propertyId,
    service: "regular_cleaning",
    recurrence: "one_off",
    extras: ["inside_windows"],
    pricing_version: "slough-pilot-2026-07-v1",
    pricing_mode: "instant",
    pricing_breakdown: [
      {
        key: "cleaning_time",
        label: "Estimated cleaning time (4 hr 30 min)",
        amountPence: 9900,
      },
      { key: "inside_windows", label: "Inside windows", amountPence: 0 },
    ],
    estimated_price_pence: 9900,
    duration_minutes: 270,
    requires_manual_review: false,
    customer_price_accepted: true,
    customer_price_accepted_at: new Date().toISOString(),
  };
  const { data: bookings, error: bookingError } = await root
    .from("business_bookings")
    .insert([
      {
        ...common,
        scheduled_start: future,
        status: "requested",
        assigned_provider_id: providerId,
        idempotency_key: crypto.randomUUID(),
      },
      {
        ...common,
        scheduled_start: new Date(Date.now() + 8 * 86400000).toISOString(),
        status: "awaiting_customer_confirmation",
        agreed_price_pence: 10500,
        customer_price_accepted: false,
        idempotency_key: crypto.randomUUID(),
      },
      {
        ...common,
        scheduled_start: past,
        status: "completed",
        assigned_provider_id: providerId,
        idempotency_key: crypto.randomUUID(),
        completed_at: past,
        check_in_at: new Date(
          new Date(past).getTime() - 2 * 3600000,
        ).toISOString(),
        check_out_at: past,
        completion_notes: "Disposable completion record",
      },
      {
        ...common,
        scheduled_start: new Date(Date.now() + 9 * 86400000).toISOString(),
        status: "cancelled",
        cancel_reason: "Disposable cancellation reason",
        idempotency_key: crypto.randomUUID(),
      },
    ])
    .select();
  if (bookingError) throw bookingError;
  bookingIds.push(...bookings.map((booking) => booking.id));
  const requested = bookings.find((booking) => booking.status === "requested"),
    attention = bookings.find(
      (booking) => booking.status === "awaiting_customer_confirmation",
    ),
    completed = bookings.find((booking) => booking.status === "completed"),
    cancelled = bookings.find((booking) => booking.status === "cancelled");

  const browser = await chromium.launch();
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
    { width: 1728, height: 1117 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`${baseURL}/business/sign-in`);
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/business/dashboard");
    await assertPage(page, "/business/dashboard");
    assert.equal(
      await page.getByText(/1 booking needs your approval/).count(),
      1,
    );
    assert.equal(
      await page.getByRole("heading", { name: "Recent activity" }).count(),
      1,
    );
    const propertiesCard = page
      .locator('a[href="/business/properties"]:visible')
      .first();
    await propertiesCard.focus();
    assert.equal(await propertiesCard.evaluate((node) => node === document.activeElement), true);
    await page.screenshot({
      path: `/tmp/quickola-dashboard-${viewport.width}.png`,
      fullPage: true,
    });
    await assertPage(page, "/business/properties");
    await assertPage(page, `/business/properties/${propertyId}`);
    assert.equal(
      await page.getByRole("heading", { name: "Disposable House" }).count(),
      1,
    );
    await page.screenshot({
      path: `/tmp/quickola-properties-${viewport.width}.png`,
      fullPage: true,
    });
    await assertPage(page, "/business/bookings");
    assert.equal(
      await page
        .getByText("Cleaning team: Disposable UI team", { exact: false })
        .count(),
      1,
      "provider appears only for completed lifecycle state",
    );
    await page.screenshot({
      path: `/tmp/quickola-bookings-${viewport.width}.png`,
      fullPage: true,
    });
    await assertPage(page, "/business/bookings?view=upcoming");
    assert.equal(
      await page
        .getByRole("link", { name: "Upcoming", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    await page
      .getByRole("link", { name: "Completed", exact: true })
      .click();
    await page.waitForURL("**/business/bookings?view=completed");
    await page.goBack();
    await page.waitForURL("**/business/bookings?view=upcoming");
    assert.equal(
      await page
        .getByRole("link", { name: "Upcoming", exact: true })
        .getAttribute("aria-current"),
      "page",
      "browser back restores the URL-backed booking filter",
    );
    await assertPage(page, `/business/bookings/${requested.id}`);
    assert.equal(
      await page.getByRole("heading", { name: "Booking received" }).count(),
      1,
    );
    assert.equal(
      await page.getByText("No action is required from you.").count(),
      1,
    );
    assert.equal((await page.getByText("Booking total").count()) > 0, true);
    assert.equal((await page.getByText("£99.00").count()) > 0, true);
    assert.equal(await page.getByText("Your notes").count(), 0);
    assert.equal(
      await page.getByText("Cleaning team").count(),
      0,
      "provider is hidden before provider-assigned status",
    );
    assert.equal(
      await page.locator('ol[aria-label="Booking progress"] li').count(),
      5,
    );
    await page.screenshot({
      path: `/tmp/quickola-booking-detail-${viewport.width}.png`,
      fullPage: true,
    });
    await assertPage(page, `/business/bookings/${attention.id}`);
    assert.equal(
      await page
        .getByRole("heading", { name: "Your approval is needed" })
        .count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Approve revised details" })
        .count(),
      1,
    );
    assert.equal((await page.getByText("Revised total").count()) > 0, true);
    await assertPage(page, `/business/bookings/${completed.id}`);
    assert.equal(
      await page.getByRole("heading", { name: "Cleaning completed" }).count(),
      1,
    );
    assert.equal(await page.getByText("Time on site").count(), 1);
    assert.equal(await page.getByText("2 hr").count(), 1);
    await assertPage(page, `/business/bookings/${cancelled.id}`);
    assert.equal(
      await page.getByRole("heading", { name: "Booking cancelled" }).count(),
      1,
    );
    assert.equal(
      await page.getByText("Disposable cancellation reason").count(),
      1,
    );
    assert.equal(
      await page.locator('ol[aria-label="Booking progress"]').count(),
      0,
    );
    if (viewport.width < 500) {
      await assertPage(page, "/business/dashboard");
      const nav = page.getByRole("navigation", {
        name: "Business account navigation",
      });
      assert.equal(
        await nav.getByRole("link", { name: "Dashboard" }).isVisible(),
        true,
      );
      assert.equal(
        await nav.getByRole("link", { name: "Settings" }).isVisible(),
        true,
      );
    }
    await context.close();
  }
  await browser.close();
  console.log(
    "Disposable desktop/mobile navigation, dashboard, property, booking list/detail, provider gating, progress, pricing, action-required, cancellation, optional-note and completion UI checks passed.",
  );
} finally {
  if (bookingIds.length) {
    for (const table of [
      "admin_audit_log",
      "business_issues",
      "booking_photos",
      "invoices",
      "completion_reports",
      "booking_events",
    ]) {
      const column = table === "admin_audit_log" ? "entity_id" : "booking_id";
      await root.from(table).delete().in(column, bookingIds);
    }
    await root
      .from("business_notifications")
      .delete()
      .eq("account_id", accountId);
    await root.from("business_bookings").delete().in("id", bookingIds);
  }
  if (accountId) {
    for (const table of [
      "recurring_schedules",
      "service_area_requests",
      "terms_acceptances",
      "properties",
      "business_members",
    ]) {
      await root.from(table).delete().eq("account_id", accountId);
    }
    await root.from("business_accounts").delete().eq("id", accountId);
  }
  if (providerId)
    await root.from("service_providers").delete().eq("id", providerId);
  if (userId) await root.auth.admin.deleteUser(userId);
  const { count } = await root
    .from("business_accounts")
    .select("id", { count: "exact", head: true })
    .eq("name", `Disposable UI ${nonce}`);
  assert.equal(count, 0, "portal UI test data was cleaned up");
}

async function assertPage(page, path) {
  const response = await page.goto(baseURL + path, {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200, `${path} renders`);
  const overflow = await page.evaluate(() => ({
    has:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    nodes: [...document.querySelectorAll("body *")]
      .filter(
        (element) =>
          element.getBoundingClientRect().right >
          document.documentElement.clientWidth + 1,
      )
      .slice(0, 5)
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        text: element.textContent?.trim().slice(0, 80),
      })),
  }));
  assert.equal(
    overflow.has,
    false,
    `${path} has no horizontal overflow: ${JSON.stringify(overflow)}`,
  );
}
