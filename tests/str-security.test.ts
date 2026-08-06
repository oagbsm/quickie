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
const cleanerEvidence = readFileSync(new URL("../supabase/migrations/202608060001_cleaner_evidence_select.sql", import.meta.url), "utf8");
const cleanerEvidenceInsert = readFileSync(new URL("../supabase/migrations/202608060002_cleaner_evidence_insert_policy.sql", import.meta.url), "utf8");
const cleanerCompletedChecklist = readFileSync(new URL("../supabase/migrations/202608060003_cleaner_completed_checklist_select.sql", import.meta.url), "utf8");
const assignmentProtection = readFileSync(new URL("../supabase/migrations/202608060004_protect_accepted_assignments.sql", import.meta.url), "utf8");
const invitationEmailGuard = readFileSync(new URL("../supabase/migrations/202607260008_invitation_email_guard.sql", import.meta.url), "utf8");
const sprint2aSecurity = readFileSync(new URL("../supabase/migrations/202607310001_sprint_2a_cleaner_security.sql", import.meta.url), "utf8");
const invitationActions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const cleanerPage = readFileSync(new URL("../app/business/cleaners/[id]/page.tsx", import.meta.url), "utf8");
const sql = `${core}\n${hardening}\n${atomic}\n${ownerChecklist}\n${accessExpiry}\n${cleanerEvidence}\n${cleanerEvidenceInsert}\n${cleanerCompletedChecklist}\n${assignmentProtection}\n${invitationEmailGuard}\n${sprint2aSecurity}`;

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

test("assigned cleaners can read evidence for their current clean without weakening insert security", () => {
  assert.match(cleanerEvidence, /workers view assigned evidence/);
  assert.match(cleanerEvidence, /for select to authenticated/);
  assert.match(cleanerEvidence, /public\.is_assigned_worker\(work_item_id\)/);
  assert.match(hardening, /workers add accepted evidence[\s\S]*uploader_id=auth\.uid\(\)/);
});

test("cleaner evidence INSERT is account, assignment, uploader and task scoped", () => {
  assert.match(cleanerEvidenceInsert, /uploader_id = auth\.uid\(\)/);
  assert.match(cleanerEvidenceInsert, /item\.account_id = evidence_submissions\.account_id/);
  assert.match(cleanerEvidenceInsert, /worker\.user_id = auth\.uid\(\)/);
  assert.match(cleanerEvidenceInsert, /assignment\.status in \('pending', 'accepted'\)/);
  assert.match(cleanerEvidenceInsert, /task\.work_item_id = evidence_submissions\.work_item_id/);
  assert.match(cleanerEvidenceInsert, /task\.account_id = evidence_submissions\.account_id/);
  assert.match(
    cleanerEvidenceInsert,
    /checklist_task_id is null and evidence_submissions\.evidence_type = 'completion_photo'/,
  );
});

test("cleaners can read only their own completed checklist history", () => {
  assert.match(cleanerCompletedChecklist, /workers view completed assigned checklist tasks/);
  assert.match(cleanerCompletedChecklist, /for select to authenticated/);
  assert.match(cleanerCompletedChecklist, /public\.is_assigned_worker\(work_item_id\)/);
  assert.match(cleanerCompletedChecklist, /item\.status = 'ready'/);
  assert.match(cleanerCompletedChecklist, /assignment\.status = 'accepted'/);
  assert.match(cleanerCompletedChecklist, /worker\.user_id = auth\.uid\(\)/);
  assert.doesNotMatch(cleanerCompletedChecklist, /for all/);
});

test("business assignment removal and replacement stop after cleaner acceptance", () => {
  assert.match(assignmentProtection, /item\.status not in \('unassigned', 'awaiting_response'\)/);
  assert.match(assignmentProtection, /item\.status <> 'awaiting_response'/);
  assert.match(assignmentProtection, /status = 'cancelled'/);
  assert.match(assignmentProtection, /assignment_cancelled/);
  assert.match(assignmentProtection, /create or replace function public\.assign_work_item_worker/);
});

test("invitation acceptance enforces expiry, revocation and one worker identity", () => {
  assert.match(hardening, /expires_at>now\(\)/);
  assert.match(hardening, /revoked_at is null/);
  assert.match(hardening, /user_already_linked_to_worker/);
  assert.match(hardening, /confirmed_name text/);
  assert.match(hardening, /display_name=trim\(confirmed_name\)/);
});
test("invitation acceptance is single-use and bound to the invited email", () => {
  assert.match(invitationEmailGuard, /lower\(worker\.email\)<>signed_in_email/);
  assert.match(invitationEmailGuard, /invitation_already_accepted/);
  assert.match(invitationEmailGuard, /for update/);
  assert.match(invitationEmailGuard, /worker_already_linked/);
  assert.match(sprint2aSecurity, /worker\.account_id<>invitation\.account_id/);
  assert.match(sprint2aSecurity, /worker\.account_id=worker_invitations\.account_id/);
});
test("manual invite links rotate hashed tokens and stay out of redirect URLs", () => {
  assert.match(invitationActions, /generateWorkerInviteLink/);
  assert.match(invitationActions, /invitation_status !== "pending"/);
  assert.match(invitationActions, /token_hash: tokenHash, expires_at: expiresAt/);
  assert.match(invitationActions, /httpOnly: true/);
  assert.match(invitationActions, /sameSite: "strict"/);
  assert.doesNotMatch(invitationActions, /\?[^`]*token=/);
  assert.match(cleanerPage, /role === "owner"/);
  assert.match(cleanerPage, /CopyInviteLink/);
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

test("Sprint 2A cleaner creation requires email and assignment can prepare an invitation", () => {
  assert.match(invitationActions, /const preferred = "email"/);
  assert.match(invitationActions, /worker_email_required/);
  assert.match(invitationActions, /worker_invitations/);
  assert.match(invitationActions, /sendCleanerInvitationEmail/);
  assert.match(invitationActions, /assign_work_item_worker/);
  assert.match(cleanerPage, /worker\.invitation_status === "pending"/);
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
