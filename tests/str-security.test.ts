import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const core = readFileSync(
  new URL(
    "../supabase/migrations/202607260001_str_turnover_coordination.sql",
    import.meta.url,
  ),
  "utf8",
);
const hardening = readFileSync(
  new URL(
    "../supabase/migrations/202607260002_str_security_notifications_and_evidence.sql",
    import.meta.url,
  ),
  "utf8",
);
const atomic = readFileSync(
  new URL(
    "../supabase/migrations/202607260003_str_atomic_creation_and_preferences.sql",
    import.meta.url,
  ),
  "utf8",
);
const ownerChecklist = readFileSync(
  new URL(
    "../supabase/migrations/202607260004_checklist_owner_mutation_policy.sql",
    import.meta.url,
  ),
  "utf8",
);
const accessExpiry = readFileSync(
  new URL(
    "../supabase/migrations/202607260005_completed_access_expiry.sql",
    import.meta.url,
  ),
  "utf8",
);
const sql = `${core}\n${hardening}\n${atomic}\n${ownerChecklist}\n${accessExpiry}`;

test("neutral reusable core objects avoid Airbnb-specific table names", () => {
  for (const table of [
    "workers",
    "work_items",
    "assignments",
    "checklist_templates",
    "checklist_tasks",
    "evidence_submissions",
    "operational_issues",
    "activity_events",
  ]) {
    assert.match(
      sql,
      new RegExp(`create table if not exists public\\.${table}\\b`),
    );
  }
  assert.doesNotMatch(
    sql,
    /create table[^;]*(airbnb_cleaner|airbnb_job|airbnb_customer)/i,
  );
});

test("every STR operational table enables row-level security", () => {
  for (const table of [
    "workers",
    "worker_invitations",
    "work_items",
    "assignments",
    "checklist_tasks",
    "evidence_submissions",
    "operational_issues",
    "activity_events",
    "notifications",
  ]) {
    assert.match(
      sql,
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        "i",
      ),
    );
  }
});

test("pending assignment access and accepted property access are distinct", () => {
  assert.match(
    sql,
    /is_assigned_worker[\s\S]*a\.status in \('pending','accepted'\)/,
  );
  assert.match(sql, /is_accepted_worker[\s\S]*a\.status='accepted'/);
  assert.match(sql, /accepted workers view assigned properties/);
  assert.match(sql, /public\.is_accepted_worker\(wi\.id\)/);
});

test("cleaners cannot create or delete checklist definitions through RLS", () => {
  assert.match(sql, /workers view assigned checklist tasks[\s\S]*for select/);
  assert.match(sql, /workers update assigned checklist tasks[\s\S]*for update/);
  const createdPolicies = [
    ...hardening.matchAll(/create policy "([^"]+)"/gi),
  ].map((match) => match[1]);
  assert.equal(
    createdPolicies.some((name) =>
      /workers (manage|insert|delete) assigned checklist tasks/i.test(name),
    ),
    false,
  );
});

test("evidence storage is private and uploads require an accepted assignment", () => {
  assert.match(sql, /values\('turnover-evidence','turnover-evidence',false/);
  assert.match(hardening, /accepted workers upload turnover evidence/);
  assert.match(hardening, /public\.is_accepted_worker\(wi\.id\)/);
});

test("invitation acceptance enforces expiry, revocation and one worker identity", () => {
  assert.match(hardening, /expires_at>now\(\)/);
  assert.match(hardening, /revoked_at is null/);
  assert.match(hardening, /user_already_linked_to_worker/);
  assert.match(hardening, /confirmed_name text/);
  assert.match(hardening, /display_name=trim\(confirmed_name\)/);
});

test("property images stay private and account-scoped", () => {
  assert.match(hardening, /values\('property-images','property-images',false/);
  assert.match(hardening, /owners read property images/);
  assert.match(
    hardening,
    /public\.is_business_member\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)/,
  );
});

test("checklist ordering is changed only by an account-authorised server transaction", () => {
  assert.match(hardening, /function public\.move_checklist_template_task/);
  assert.match(hardening, /public\.is_business_member\(template\.account_id\)/);
  assert.match(hardening, /for update of task/);
});

test("cleaner and invitation creation is atomic and duplicate contacts are constrained", () => {
  assert.match(atomic, /function public\.create_worker_with_invitation/);
  assert.match(atomic, /insert into public\.workers/);
  assert.match(atomic, /insert into public\.worker_invitations/);
  assert.match(atomic, /workers_account_email_unique/);
  assert.match(atomic, /workers_account_mobile_unique/);
  assert.match(atomic, /duplicate_worker_contact/);
});

test("owners can instantiate checklist snapshots only inside their own account", () => {
  assert.match(ownerChecklist, /members manage checklist tasks/);
  assert.match(ownerChecklist, /public\.is_business_member\(account_id\)/);
  assert.match(ownerChecklist, /with check/);
});

test("cleaner access to property secrets expires at terminal turnover states", () => {
  assert.match(accessExpiry, /item\.status not in \('ready','cancelled'\)/);
  assert.match(accessExpiry, /assignment\.status='accepted'/);
});

test("assignment and transition mutations are server-side transactions", () => {
  assert.match(hardening, /function public\.assign_work_item_worker/);
  assert.match(hardening, /for update/);
  assert.match(hardening, /invalid_status_transition/);
  assert.match(hardening, /assigned_worker_required/);
  assert.match(hardening, /set status=next_status,responded_at=now\(\)/);
});

test("readiness persists decisions, reasons and audit events", () => {
  assert.match(hardening, /readiness_result=jsonb_build_object/);
  assert.match(hardening, /failed_blocking_tasks/);
  assert.match(hardening, /blocking_issues/);
  assert.match(hardening, /'readiness_evaluated'/);
  assert.match(hardening, /ready_at=case when decision/);
});

test("issue downgrades and resolutions are represented as structured audit events", () => {
  const actions = readFileSync(
    new URL("../app/business/str-actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actions, /event_type: "issue_downgraded"/);
  assert.match(actions, /event_type: "issue_resolved"/);
  assert.match(actions, /reason/);
});
