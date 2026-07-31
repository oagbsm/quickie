import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service)
  throw new Error("Supabase environment is incomplete");

const root = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const nonce = Date.now().toString(36);
const password = `Qi!${crypto.randomBytes(18).toString("base64url")}`;
const users = [];
const accounts = [];

async function checked(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function businessUser(label) {
  const email = `calendar-${label}-${nonce}@example.invalid`;
  const created = await root.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_kind: "quickola_business",
      business_name: `Calendar ${label} ${nonce}`,
      full_name: `Calendar ${label}`,
    },
  });
  if (created.error) throw created.error;
  users.push(created.data.user.id);
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  const workspace = await checked(
    await client.rpc("ensure_business_workspace"),
    "create workspace",
  );
  const row = Array.isArray(workspace) ? workspace[0] : workspace;
  accounts.push(row.account_id);
  return { client, accountId: row.account_id };
}

async function property(owner, name) {
  return checked(
    await owner.client
      .from("properties")
      .insert({
        account_id: owner.accountId,
        nickname: name,
        address_line_1: `${name} ${nonce} Test Street`,
        city: "London",
        postcode: "SW1A 1AA",
        property_type: "airbnb",
        access_method: "Key safe",
        status: "active",
        service_area_status: "eligible",
        is_airbnb_turnover: true,
        default_checkout_time: "11:00",
        default_checkin_time: "15:00",
        estimated_turnover_minutes: 180,
      })
      .select("id")
      .single(),
    `create ${name}`,
  );
}

const payload = (uid, checkInAt, checkOutAt, status = "confirmed") => ({
  external_uid: uid,
  check_in_at: checkInAt,
  check_out_at: checkOutAt,
  status,
  fingerprint: crypto
    .createHash("sha256")
    .update(`${uid}:${checkInAt}:${checkOutAt}:${status}`)
    .digest("hex"),
  sequence: 1,
  external_last_modified_at: new Date().toISOString(),
});

async function connection(owner, propertyId, suffix) {
  return checked(
    await owner.client.rpc("create_property_calendar_connection", {
      target_property: propertyId,
      selected_provider: "airbnb",
      selected_display_name: `Fixture ${suffix}`,
      encrypted_url: `v1:fixture-encrypted-${suffix}-${nonce}`,
      url_fingerprint: crypto
        .createHash("sha256")
        .update(`${propertyId}:${suffix}:${nonce}`)
        .digest("hex"),
      masked_url: "example.invalid/calendar/••••••••",
    }),
    `create calendar ${suffix}`,
  );
}

try {
  const owner = await businessUser("owner");
  const outsider = await businessUser("outsider");
  const firstProperty = await property(owner, "Calendar Harbour House");
  const secondProperty = await property(owner, "Calendar Garden Flat");
  const outsiderProperty = await property(outsider, "Other Calendar House");
  const firstConnection = await connection(owner, firstProperty.id, "one");
  const secondConnection = await connection(owner, secondProperty.id, "two");

  assert(
    (
      await owner.client.rpc("create_property_calendar_connection", {
        target_property: outsiderProperty.id,
        selected_provider: "other",
        selected_display_name: "Forbidden",
        encrypted_url: "v1:forbidden-encrypted-calendar",
        url_fingerprint: "f".repeat(64),
        masked_url: "example.invalid/••••••••",
      })
    ).error?.message.includes("property_not_found"),
  );
  assert.equal(
    (
      await outsider.client
        .from("property_calendar_connections_safe")
        .select("id")
        .eq("id", firstConnection)
    ).data?.length,
    0,
  );
  assert(
    (
      await outsider.client.rpc("claim_property_calendar_sync", {
        target_connection: firstConnection,
      })
    ).error?.message.includes("calendar_connection_not_found"),
  );

  const [firstClaim, competingClaim] = await Promise.all([
    owner.client.rpc("claim_property_calendar_sync", {
      target_connection: firstConnection,
    }),
    owner.client.rpc("claim_property_calendar_sync", {
      target_connection: firstConnection,
    }),
  ]);
  assert.equal([firstClaim, competingClaim].filter((item) => !item.error).length, 1);
  assert.equal(
    [firstClaim, competingClaim].filter((item) =>
      item.error?.message.includes("calendar_sync_in_progress"),
    ).length,
    1,
  );

  const initial = payload(
    "fixture-booking",
    "2027-01-10T15:00:00.000Z",
    "2027-01-13T11:00:00.000Z",
  );
  const imported = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: firstConnection,
      event_payload: initial,
    }),
    "initial reconcile",
  );
  const repeated = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: firstConnection,
      event_payload: initial,
    }),
    "repeat reconcile",
  );
  assert.equal(repeated.action, "unchanged");
  assert.equal(repeated.reservation_id, imported.reservation_id);

  const changedCheckout = payload(
    "fixture-booking",
    "2027-01-10T15:00:00.000Z",
    "2027-01-14T11:00:00.000Z",
  );
  const checkoutUpdate = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: firstConnection,
      event_payload: changedCheckout,
    }),
    "checkout update",
  );
  assert.equal(checkoutUpdate.reservation_id, imported.reservation_id);
  assert.equal(checkoutUpdate.turnover_id, imported.turnover_id);
  const changedCheckIn = payload(
    "fixture-booking",
    "2027-01-11T15:00:00.000Z",
    "2027-01-14T11:00:00.000Z",
  );
  const checkInUpdate = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: firstConnection,
      event_payload: changedCheckIn,
    }),
    "check-in update",
  );
  assert.equal(checkInUpdate.reservation_id, imported.reservation_id);
  assert.equal(checkInUpdate.turnover_id, imported.turnover_id);

  const secondSource = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: secondConnection,
      event_payload: initial,
    }),
    "independent source identity",
  );
  assert.notEqual(secondSource.reservation_id, imported.reservation_id);
  const explicitCancellation = await checked(
    await owner.client.rpc("reconcile_ical_reservation", {
      target_connection: secondConnection,
      event_payload: payload(
        "fixture-booking",
        "2027-01-10T15:00:00.000Z",
        "2027-01-13T11:00:00.000Z",
        "cancelled",
      ),
    }),
    "explicit cancellation",
  );
  assert.equal(explicitCancellation.reservation_id, secondSource.reservation_id);
  assert.equal(explicitCancellation.turnover_id, secondSource.turnover_id);
  assert.equal(
    (
      await checked(
        await root
          .from("work_items")
          .select("status")
          .eq("id", secondSource.turnover_id)
          .single(),
        "explicitly cancelled turnover",
      )
    ).status,
    "cancelled",
  );

  const missingOnce = await checked(
    await owner.client.rpc("finalize_ical_missing_reservations", {
      target_connection: firstConnection,
      seen_uids: [],
    }),
    "missing once",
  );
  assert.equal(missingOnce, 0);
  const missingTwice = await checked(
    await owner.client.rpc("finalize_ical_missing_reservations", {
      target_connection: firstConnection,
      seen_uids: [],
    }),
    "missing twice",
  );
  assert.equal(missingTwice, 1);
  const cancelled = await checked(
    await root
      .from("reservations")
      .select("status")
      .eq("id", imported.reservation_id)
      .single(),
    "cancelled imported reservation",
  );
  const cancelledTurnover = await checked(
    await root
      .from("work_items")
      .select("id,status")
      .eq("reservation_id", imported.reservation_id)
      .single(),
    "cancelled imported turnover",
  );
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelledTurnover.id, imported.turnover_id);
  assert.equal(cancelledTurnover.status, "cancelled");

  const safeRead = await owner.client
    .from("property_calendar_connections_safe")
    .select("calendar_url_encrypted")
    .eq("id", firstConnection);
  assert(safeRead.error, "safe client view must not expose the encrypted URL column");

  console.log(
    JSON.stringify({
      ok: true,
      assertions: [
        "tenant-safe connection access",
        "connection lock serialises simultaneous syncs",
        "repeat reconciliation is idempotent",
        "date updates preserve reservation and turnover IDs",
        "explicit cancellation preserves and cancels linked records",
        "source identities are connection-scoped",
        "missing twice cancels reservation and turnover",
        "normal client reads exclude calendar secrets",
      ],
    }),
  );
} finally {
  for (const accountId of accounts)
    await root.from("business_accounts").delete().eq("id", accountId);
  for (const userId of users) await root.auth.admin.deleteUser(userId);
}
