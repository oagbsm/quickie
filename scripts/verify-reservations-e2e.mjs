import crypto from "node:crypto";
import assert from "node:assert/strict";
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
const password = `Qr!${crypto.randomBytes(18).toString("base64url")}`;
const users = [];
const accounts = [];

async function check(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function createBusinessUser(label) {
  const email = `reservation-${label}-${nonce}@example.invalid`;
  const created = await root.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_kind: "quickola_business",
      business_name: `Reservation ${label} ${nonce}`,
      full_name: `Reservation ${label}`,
    },
  });
  if (created.error) throw created.error;
  users.push(created.data.user.id);
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  const workspace = await check(
    await client.rpc("ensure_business_workspace"),
    "workspace",
  );
  const row = Array.isArray(workspace) ? workspace[0] : workspace;
  accounts.push(row.account_id);
  return { client, accountId: row.account_id, userId: created.data.user.id };
}

async function createProperty(owner, nickname) {
  return check(
    await owner.client
      .from("properties")
      .insert({
        account_id: owner.accountId,
        nickname,
        address_line_1: "1 Reservation Test Street",
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
      .single(),
    `property ${nickname}`,
  );
}

function at(days, hour) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
}

try {
  const owner = await createBusinessUser("owner");
  const other = await createBusinessUser("other");
  const firstProperty = await createProperty(owner, "Reservation Harbour House");
  const secondProperty = await createProperty(owner, "Reservation Garden Flat");
  await createProperty(other, "Other Business Property");

  const firstPayload = {
    property_id: firstProperty.id,
    guest_name: "Alex Guest",
    guest_count: 3,
    check_in_at: at(10, 14),
    check_out_at: at(13, 10),
  };
  const firstKey = crypto.randomUUID();
  const first = await check(
    await owner.client.rpc("create_manual_reservation", {
      request_key: firstKey,
      payload: firstPayload,
    }),
    "first reservation create",
  );
  const retried = await check(
    await owner.client.rpc("create_manual_reservation", {
      request_key: firstKey,
      payload: firstPayload,
    }),
    "first reservation retry",
  );
  assert.equal(retried.reservation_id, first.reservation_id);
  assert.equal(retried.turnover_id, first.turnover_id);
  assert.equal(retried.created, false);

  const secondPayload = {
    property_id: firstProperty.id,
    guest_name: "Next Guest",
    guest_count: 2,
    check_in_at: at(13, 14),
    check_out_at: at(16, 10),
  };
  const second = await check(
    await owner.client.rpc("create_manual_reservation", {
      request_key: crypto.randomUUID(),
      payload: secondPayload,
    }),
    "second reservation create",
  );

  const firstRows = await check(
    await owner.client
      .from("reservations")
      .select("id")
      .eq("id", first.reservation_id),
    "first reservation count",
  );
  const firstTurnovers = await check(
    await owner.client
      .from("work_items")
      .select("id,account_id,property_id,reservation_id,turnover_date,next_checkin_at,status,creation_source")
      .eq("reservation_id", first.reservation_id),
    "first turnover count",
  );
  assert.equal(firstRows.length, 1);
  assert.equal(firstTurnovers.length, 1);
  assert.equal(firstTurnovers[0].id, first.turnover_id);
  assert.equal(firstTurnovers[0].account_id, owner.accountId);
  assert.equal(firstTurnovers[0].property_id, firstProperty.id);
  assert.equal(firstTurnovers[0].creation_source, "manual_reservation");
  assert.equal(firstTurnovers[0].next_checkin_at, secondPayload.check_in_at);

  const createdEvents = await check(
    await owner.client
      .from("reservation_events")
      .select("event_type")
      .eq("reservation_id", first.reservation_id),
    "creation events",
  );
  assert.deepEqual(
    createdEvents.map((event) => event.event_type).sort(),
    ["reservation.created", "turnover.created"],
  );

  assert.equal(
    (
      await other.client
        .from("reservations")
        .select("id")
        .eq("id", first.reservation_id)
    ).data?.length,
    0,
  );
  assert.equal(
    (
      await other.client
        .from("reservation_events")
        .select("id")
        .eq("reservation_id", first.reservation_id)
    ).data?.length,
    0,
  );
  assert(
    (
      await other.client.rpc("update_manual_reservation", {
        target_reservation: first.reservation_id,
        payload: firstPayload,
      })
    ).error?.message.includes("reservation_not_found"),
  );
  assert(
    (
      await other.client.rpc("cancel_manual_reservation", {
        target_reservation: first.reservation_id,
      })
    ).error?.message.includes("reservation_not_found"),
  );

  const changedCheckout = at(13, 11);
  await check(
    await owner.client.rpc("update_manual_reservation", {
      target_reservation: first.reservation_id,
      payload: { ...firstPayload, check_out_at: changedCheckout },
    }),
    "checkout update",
  );
  let updatedTurnover = await check(
    await owner.client
      .from("work_items")
      .select("id,guest_checkout_at")
      .eq("reservation_id", first.reservation_id)
      .single(),
    "updated turnover",
  );
  assert.equal(updatedTurnover.id, first.turnover_id);
  assert.equal(updatedTurnover.guest_checkout_at, changedCheckout);

  const eventsBeforeNoop = await check(
    await owner.client
      .from("reservation_events")
      .select("id", { count: "exact" })
      .eq("reservation_id", first.reservation_id),
    "events before no-op",
  );
  const noop = await check(
    await owner.client.rpc("update_manual_reservation", {
      target_reservation: first.reservation_id,
      payload: { ...firstPayload, check_out_at: changedCheckout },
    }),
    "no-op update",
  );
  assert.equal(noop.changed, false);
  const eventsAfterNoop = await owner.client
    .from("reservation_events")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", first.reservation_id);
  assert.equal(eventsAfterNoop.count, eventsBeforeNoop.length);

  const turnoverEventsBeforeGuest = await owner.client
    .from("reservation_events")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", first.reservation_id)
    .eq("event_type", "turnover.updated");
  await check(
    await owner.client.rpc("update_manual_reservation", {
      target_reservation: first.reservation_id,
      payload: {
        ...firstPayload,
        check_out_at: changedCheckout,
        guest_count: 4,
      },
    }),
    "guest-only update",
  );
  const turnoverEventsAfterGuest = await owner.client
    .from("reservation_events")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", first.reservation_id)
    .eq("event_type", "turnover.updated");
  assert.equal(turnoverEventsAfterGuest.count, turnoverEventsBeforeGuest.count);

  await check(
    await owner.client.rpc("update_manual_reservation", {
      target_reservation: first.reservation_id,
      payload: {
        ...firstPayload,
        property_id: secondProperty.id,
        check_out_at: changedCheckout,
        guest_count: 4,
      },
    }),
    "property update",
  );
  updatedTurnover = await check(
    await owner.client
      .from("work_items")
      .select("id,property_id,next_checkin_at")
      .eq("reservation_id", first.reservation_id)
      .single(),
    "moved turnover",
  );
  assert.equal(updatedTurnover.id, first.turnover_id);
  assert.equal(updatedTurnover.property_id, secondProperty.id);
  assert.equal(updatedTurnover.next_checkin_at, null);

  const cancelled = await check(
    await owner.client.rpc("cancel_manual_reservation", {
      target_reservation: first.reservation_id,
    }),
    "reservation cancellation",
  );
  const cancelledAgain = await check(
    await owner.client.rpc("cancel_manual_reservation", {
      target_reservation: first.reservation_id,
    }),
    "reservation cancellation retry",
  );
  assert.equal(cancelled.changed, true);
  assert.equal(cancelledAgain.changed, false);
  const preserved = await check(
    await owner.client
      .from("reservations")
      .select("status,cancelled_at")
      .eq("id", first.reservation_id)
      .single(),
    "preserved cancelled reservation",
  );
  const preservedTurnover = await check(
    await owner.client
      .from("work_items")
      .select("id,status,cancelled_at")
      .eq("reservation_id", first.reservation_id)
      .single(),
    "preserved cancelled turnover",
  );
  assert.equal(preserved.status, "cancelled");
  assert(preserved.cancelled_at);
  assert.equal(preservedTurnover.id, first.turnover_id);
  assert.equal(preservedTurnover.status, "cancelled");
  assert(preservedTurnover.cancelled_at);
  const cancellationEvents = await check(
    await owner.client
      .from("reservation_events")
      .select("event_type")
      .eq("reservation_id", first.reservation_id)
      .in("event_type", ["reservation.cancelled", "turnover.cancelled"]),
    "cancellation events",
  );
  assert.equal(cancellationEvents.length, 2);

  const cancelledEdit = await owner.client.rpc("update_manual_reservation", {
    target_reservation: first.reservation_id,
    payload: {
      ...firstPayload,
      property_id: secondProperty.id,
      check_out_at: changedCheckout,
      guest_count: 4,
    },
  });
  assert(cancelledEdit.error?.message.includes("reservation_cancelled"));

  const directInsert = await owner.client.from("reservations").insert({
    account_id: owner.accountId,
    property_id: firstProperty.id,
    source: "manual",
    external_reservation_id: `direct:${nonce}`,
    check_in_at: at(20, 14),
    check_out_at: at(21, 10),
    status: "confirmed",
  });
  assert(directInsert.error, "direct reservation inserts must be denied");

  console.log(
    JSON.stringify(
      {
        ok: true,
        assertions: [
          "idempotent creation",
          "one linked turnover",
          "tenant-isolated reservation and events",
          "checkout and property synchronization preserve turnover ID",
          "guest-only and no-op audit behavior",
          "idempotent cancellation preserves both records",
          "cancelled edit rejected",
          "direct writes denied",
        ],
        secondaryReservation: second.reservation_id,
      },
      null,
      2,
    ),
  );
} finally {
  for (const accountId of accounts.reverse())
    await root.from("business_accounts").delete().eq("id", accountId);
  for (const userId of users.reverse()) await root.auth.admin.deleteUser(userId);
}
