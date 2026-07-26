import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service)
  throw new Error("Supabase environment is incomplete");
const root = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const nonce = Date.now().toString(36),
  password = `Qk!${crypto.randomBytes(18).toString("base64url")}`;
const users = [],
  accounts = [];
async function createUser(kind) {
  const email = `str-e2e-${kind}-${nonce}@example.invalid`;
  const { data, error } = await root.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_kind: "quickola_business",
      business_name: `E2E ${kind} ${nonce}`,
      full_name: `E2E ${kind}`,
    },
  });
  if (error) throw error;
  users.push(data.user.id);
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  const ensured = await client.rpc("ensure_business_workspace");
  if (ensured.error) throw ensured.error;
  const accountId = (
    Array.isArray(ensured.data) ? ensured.data[0] : ensured.data
  ).account_id;
  accounts.push(accountId);
  return { client, user: data.user, accountId, email };
}
async function check(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
try {
  const owner = await createUser("owner"),
    otherOwner = await createUser("other-owner");
  const property = await check(
    await owner.client
      .from("properties")
      .insert({
        account_id: owner.accountId,
        nickname: "E2E Harbour House",
        address_line_1: "1 Test Street",
        city: "Brighton",
        postcode: "BN1 1AA",
        property_type: "house",
        bedrooms: 2,
        bathrooms: 1,
        access_method: "Key safe",
        status: "active",
        service_area_status: "eligible",
        is_airbnb_turnover: true,
        required_completion_photos: 2,
      })
      .select("id,nickname")
      .single(),
    "property create",
  );
  const count = await owner.client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("account_id", owner.accountId)
    .eq("status", "active");
  const list = await owner.client
    .from("properties")
    .select("id,work_items(id)")
    .eq("account_id", owner.accountId)
    .eq("status", "active");
  assert.equal(count.count, 1);
  assert.equal(list.data?.length, 1);
  assert.equal(list.data?.[0].id, property.id);
  assert.equal(
    (
      await otherOwner.client
        .from("properties")
        .select("id")
        .eq("id", property.id)
    ).data?.length,
    0,
    "cross-account property leaked",
  );

  const inviteToken = crypto.randomBytes(32).toString("base64url"),
    inviteHash = crypto.createHash("sha256").update(inviteToken).digest("hex");
  const workerId = await check(
    await owner.client.rpc("create_worker_with_invitation", {
      target_account: owner.accountId,
      target_name: "E2E Cleaner",
      target_company: null,
      target_email: `str-e2e-cleaner-${nonce}@example.invalid`,
      target_mobile: null,
      target_preferred_contact: "email",
      target_token_hash: inviteHash,
      target_expiry: new Date(Date.now() + 3600000).toISOString(),
    }),
    "worker create",
  );
  const duplicate = await owner.client.rpc("create_worker_with_invitation", {
    target_account: owner.accountId,
    target_name: "Duplicate",
    target_company: null,
    target_email: `str-e2e-cleaner-${nonce}@example.invalid`,
    target_mobile: null,
    target_preferred_contact: "email",
    target_token_hash: crypto.randomBytes(32).toString("hex"),
    target_expiry: new Date(Date.now() + 3600000).toISOString(),
  });
  assert(duplicate.error?.message.includes("duplicate_worker_contact"));
  const cleaner = await createUser("cleaner");
  await check(
    await cleaner.client.rpc("accept_worker_invitation", {
      raw_token: inviteToken,
      confirmed_name: "E2E Cleaner",
    }),
    "invite accept",
  );

  const now = new Date(),
    date = now.toISOString().slice(0, 10),
    checkout = new Date(now.getTime() + 3600000),
    access = new Date(now.getTime() + 5400000),
    checkin = new Date(now.getTime() + 6 * 3600000);
  const item = await check(
    await owner.client
      .from("work_items")
      .insert({
        account_id: owner.accountId,
        property_id: property.id,
        property_public_name: "E2E Harbour House",
        property_general_area: "BN1",
        turnover_date: date,
        guest_checkout_at: checkout.toISOString(),
        access_start_at: access.toISOString(),
        next_checkin_at: checkin.toISOString(),
        estimated_duration_minutes: 180,
        cleaning_type: "standard_turnover",
        required_evidence_count: 2,
        status: "unassigned",
        created_by: owner.user.id,
      })
      .select("id")
      .single(),
    "turnover create",
  );
  const template = await check(
    await owner.client
      .from("checklist_templates")
      .select(
        "checklist_template_sections(title,position,checklist_template_tasks(id,label,position,response_type,mandatory,photo_required,note_required,blocking))",
      )
      .eq("property_id", property.id)
      .eq("active", true)
      .single(),
    "template read",
  );
  const tasks = template.checklist_template_sections.flatMap((section) =>
    section.checklist_template_tasks.map((task) => ({
      account_id: owner.accountId,
      work_item_id: item.id,
      source_task_id: task.id,
      section_title: section.title,
      label: task.label,
      position: section.position * 100 + task.position,
      response_type: task.response_type,
      mandatory: task.mandatory,
      photo_required: task.photo_required,
      note_required: task.note_required,
      blocking: task.blocking,
    })),
  );
  await check(
    await owner.client.from("checklist_tasks").insert(tasks),
    "task clone",
  );
  await check(
    await owner.client.rpc("assign_work_item_worker", {
      target_work_item: item.id,
      target_worker: workerId,
    }),
    "assignment",
  );
  assert.equal(
    (await cleaner.client.from("properties").select("id").eq("id", property.id))
      .data?.length,
    0,
    "sensitive property visible before acceptance",
  );
  assert.equal(
    (await cleaner.client.from("work_items").select("id").eq("id", item.id))
      .data?.length,
    1,
  );
  for (const status of ["accepted", "en_route", "arrived", "in_progress"])
    await check(
      await cleaner.client.rpc("transition_work_item", {
        target_work_item: item.id,
        next_status: status,
      }),
      `transition ${status}`,
    );
  assert.equal(
    (await cleaner.client.from("properties").select("id").eq("id", property.id))
      .data?.length,
    1,
  );
  const cloned = await check(
    await cleaner.client
      .from("checklist_tasks")
      .select("id,label,response_type,photo_required,note_required")
      .eq("work_item_id", item.id),
    "assigned tasks",
  );
  for (const task of cloned)
    await check(
      await cleaner.client
        .from("checklist_tasks")
        .update({
          completed: true,
          response:
            task.response_type === "checkbox"
              ? null
              : task.response_type === "yes_no"
                ? "yes"
                : "pass",
          note: task.note_required ? "Completed during E2E verification" : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id),
      "task complete",
    );
  const issue = await check(
    await cleaner.client
      .from("operational_issues")
      .insert({
        account_id: owner.accountId,
        work_item_id: item.id,
        issue_type: "Damage found",
        severity: "high",
        description: "Disposable E2E blocking issue",
        blocking: true,
        created_by: cleaner.user.id,
      })
      .select("id")
      .single(),
    "blocking issue",
  );
  const png = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  async function evidence(type, taskId = null, index = 0) {
    const path = `${owner.accountId}/${item.id}/${crypto.randomUUID()}.png`;
    await check(
      await cleaner.client.storage
        .from("turnover-evidence")
        .upload(path, png, { contentType: "image/png" }),
      `upload ${type}`,
    );
    await check(
      await cleaner.client
        .from("evidence_submissions")
        .insert({
          account_id: owner.accountId,
          work_item_id: item.id,
          checklist_task_id: taskId,
          uploader_id: cleaner.user.id,
          storage_path: path,
          evidence_type: type,
          caption: `E2E ${index}`,
        }),
      `evidence ${type}`,
    );
  }
  for (const task of cloned.filter((task) => task.photo_required))
    await evidence("completion_photo", task.id);
  await evidence("completion_photo", null, 1);
  await evidence("completion_photo", null, 2);
  const keyTask = cloned.find((task) => /key.*return/i.test(task.label));
  if (keyTask) await evidence("key_return", keyTask.id);
  await check(
    await cleaner.client.rpc("transition_work_item", {
      target_work_item: item.id,
      next_status: "evidence_submitted",
    }),
    "completion submit",
  );
  let state = await check(
    await owner.client
      .from("work_items")
      .select("status,readiness_decision,readiness_result")
      .eq("id", item.id)
      .single(),
    "blocked readiness",
  );
  assert.equal(state.readiness_decision, false);
  assert.equal(state.status, "action_required");
  await check(
    await owner.client
      .from("operational_issues")
      .update({
        status: "resolved",
        resolution: "Resolved in E2E",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issue.id),
    "issue resolve",
  );
  await check(
    await owner.client.rpc("evaluate_work_item_readiness", {
      target_work_item: item.id,
    }),
    "final readiness",
  );
  state = await check(
    await owner.client
      .from("work_items")
      .select("status,readiness_decision,ready_at")
      .eq("id", item.id)
      .single(),
    "ready state",
  );
  assert.equal(state.status, "ready");
  assert.equal(state.readiness_decision, true);
  assert(state.ready_at);
  assert.equal(
    (await otherOwner.client.from("work_items").select("id").eq("id", item.id))
      .data?.length,
    0,
  );
  const events = await check(
    await owner.client
      .from("activity_events")
      .select("event_type")
      .eq("work_item_id", item.id),
    "activity",
  );
  assert(events.some((event) => event.event_type === "readiness_evaluated"));
  console.log(
    JSON.stringify(
      {
        ok: true,
        assertions: [
          "canonical property count/list",
          "account isolation",
          "atomic cleaner and duplicate prevention",
          "invitation acceptance",
          "pre-acceptance secrecy",
          "lifecycle",
          "checklist",
          "private evidence",
          "blocking issue",
          "Property Ready",
          "activity audit",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  for (const accountId of accounts.reverse())
    await root.from("business_accounts").delete().eq("id", accountId);
  for (const userId of users.reverse())
    await root.auth.admin.deleteUser(userId);
}
