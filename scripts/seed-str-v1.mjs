import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "production") {
  throw new Error("The STR development seed is disabled in production.");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = process.env.DEV_SEED_OWNER_EMAIL;
if (!url || !serviceKey || !ownerEmail) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEV_SEED_OWNER_EMAIL.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (usersError) throw usersError;
const owner = users.users.find((user) => user.email?.toLowerCase() === ownerEmail.toLowerCase());
if (!owner) throw new Error("DEV_SEED_OWNER_EMAIL must identify an existing development auth user.");

const { data: membership, error: membershipError } = await supabase
  .from("business_members").select("account_id").eq("user_id", owner.id).maybeSingle();
if (membershipError || !membership) throw membershipError || new Error("The development owner has no workspace.");
const accountId = membership.account_id;

const propertyFixtures = [
  ["Harbour View", "18 Harbour Street", "Brighton", "BN1 2AA", "flat", 2, 2],
  ["Wren House", "42 Wren Road", "Bath", "BA1 4DX", "house", 3, 2],
  ["Park Studio", "7 Park Lane", "York", "YO1 7HL", "flat", 1, 1],
  ["Meadow Cottage", "3 Meadow Close", "Oxford", "OX2 8QP", "cottage", 2, 1],
];
const properties = [];
for (const [nickname, address, city, postcode, type, bedrooms, bathrooms] of propertyFixtures) {
  const payload = {
    account_id: accountId,
    nickname,
    address_line_1: address,
    city,
    postcode,
    property_type: type,
    bedrooms,
    bathrooms,
    access_method: "Key safe or owner-arranged access",
    access_notes: "Development seed access instructions",
    key_instructions: "Development seed key-safe instructions",
    cleaning_notes: "Follow the saved checklist and leave every room guest-ready.",
    linen_requirements: "Replace all used linen and prepare every required bed.",
    parking_notes: "Use legal visitor parking where available.",
    status: "active",
    service_area_status: "eligible",
    is_airbnb_turnover: true,
    default_checkout_time: "11:00",
    default_checkin_time: "15:00",
    estimated_turnover_minutes: 180,
    required_completion_photos: 4,
  };
  const { data: existing } = await supabase.from("properties").select("id,nickname")
    .eq("account_id", accountId).eq("nickname", nickname).maybeSingle();
  const result = existing
    ? await supabase.from("properties").update(payload).eq("id", existing.id).select("id,nickname").single()
    : await supabase.from("properties").insert(payload).select("id,nickname").single();
  if (result.error) throw result.error;
  properties.push(result.data);
}

const workerFixtures = [
  { display_name: "Amara Lewis", company_name: "Lewis Turnovers", email: "amara.dev@example.invalid", preferred_contact_method: "email" },
  { display_name: "Daniel Okoro", company_name: null, mobile: "+440000000002", preferred_contact_method: "mobile" },
];
const workers = [];
for (const fixture of workerFixtures) {
  const match = fixture.email ? { column: "email", value: fixture.email } : { column: "mobile", value: fixture.mobile };
  let { data } = await supabase.from("workers").select("id,display_name").eq("account_id", accountId).eq(match.column, match.value).maybeSingle();
  if (!data) {
    const result = await supabase.from("workers").insert({
      account_id: accountId, ...fixture, invitation_status: "pending", status: "active",
    }).select("id,display_name").single();
    if (result.error) throw result.error;
    data = result.data;
  }
  workers.push(data);
}

const at = (days, time) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.toISOString().slice(0, 10)}T${time}:00.000Z`;
};
const turnoverFixtures = [
  { property: 0, worker: 0, days: 0, status: "in_progress", time: "11:00" },
  { property: 1, worker: 1, days: 0, status: "awaiting_response", time: "11:30" },
  { property: 2, worker: null, days: 1, status: "unassigned", time: "12:00" },
  { property: 3, worker: 0, days: -1, status: "ready", time: "10:30" },
];
const turnovers = [];
for (const fixture of turnoverFixtures) {
  const property = properties[fixture.property];
  const date = at(fixture.days, fixture.time).slice(0, 10);
  let { data } = await supabase.from("work_items").select("id,status").eq("account_id", accountId)
    .eq("property_id", property.id).eq("turnover_date", date).maybeSingle();
  if (!data) {
    const result = await supabase.from("work_items").insert({
      account_id: accountId,
      property_id: property.id,
      property_public_name: property.nickname,
      property_general_area: propertyFixtures[fixture.property][3].split(" ")[0],
      service_code: "str_turnover",
      status: fixture.worker == null ? "unassigned" : fixture.status,
      cleaning_type: "standard_turnover",
      turnover_date: date,
      guest_checkout_at: at(fixture.days, "11:00"),
      access_start_at: at(fixture.days, fixture.time),
      next_checkin_at: at(fixture.days, "15:00"),
      estimated_duration_minutes: 180,
      required_evidence_count: 4,
      risk_acknowledged: false,
      created_by: owner.id,
      completion_submitted_at: fixture.status === "ready" ? at(fixture.days, "13:30") : null,
      readiness_decision: fixture.status === "ready",
      ready_at: fixture.status === "ready" ? at(fixture.days, "13:35") : null,
      readiness_result: fixture.status === "ready" ? { ready: true, blocking_reasons: [] } : { ready: false, blocking_reasons: ["Development fixture is incomplete"] },
    }).select("id,status").single();
    if (result.error) throw result.error;
    data = result.data;
  }
  turnovers.push(data);
  if (fixture.worker != null) {
    const { data: currentAssignment } = await supabase.from("assignments").select("id")
      .eq("work_item_id", data.id).in("status", ["pending","accepted"]).maybeSingle();
    if (!currentAssignment) await supabase.from("assignments").insert({
      account_id: accountId, work_item_id: data.id, worker_id: workers[fixture.worker].id,
      status: fixture.status === "awaiting_response" ? "pending" : "accepted", assigned_by: owner.id,
    });
  }
}

const blockingTurnover = turnovers[0];
const { data: existingIssue } = await supabase.from("operational_issues").select("id")
  .eq("work_item_id", blockingTurnover.id).eq("issue_type", "Missing linen").maybeSingle();
if (!existingIssue) {
  await supabase.from("operational_issues").insert({
    account_id: accountId,
    work_item_id: blockingTurnover.id,
    issue_type: "Missing linen",
    severity: "high",
    description: "Development fixture: replacement king-size linen is unavailable.",
    status: "waiting_for_owner",
    blocking: true,
    created_by: owner.id,
  });
}

console.log(JSON.stringify({
  event: "str_v1_development_seed_complete",
  accountId,
  properties: properties.length,
  workers: workers.length,
  turnovers: turnovers.length,
  credentialsCreated: false,
}));
