import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCleanerLifecycle, selectRelevantCleanerJobs } from "../lib/cleaner/lifecycle.ts";
import { evaluateReadiness } from "../lib/turnovers/readiness.ts";

const page = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const today = readFileSync(new URL("../app/cleaner/today/page.tsx", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../app/cleaner/CleanerNavigation.tsx", import.meta.url), "utf8");
const cards = readFileSync(new URL("../app/cleaner/TurnoverCards.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const operatorPage = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const integrityMigration = readFileSync(new URL("../supabase/migrations/202608010003_completion_integrity.sql", import.meta.url), "utf8");
const idempotencyMigration = readFileSync(new URL("../supabase/migrations/202608040001_idempotent_cleaner_transitions.sql", import.meta.url), "utf8");

test("canonical cleaner lifecycle has one deterministic action", () => {
  assert.deepEqual(getCleanerLifecycle("awaiting_response").primaryAction, { label: "Accept", nextStatus: "accepted" });
  assert.equal(getCleanerLifecycle("accepted").label, "Accepted");
  assert.equal(getCleanerLifecycle("en_route").label, "En route");
  assert.equal(getCleanerLifecycle("arrived").primaryAction?.nextStatus, "in_progress");
  assert.equal(getCleanerLifecycle("arrived").primaryAction?.label, "Start cleaning");
  assert.equal(getCleanerLifecycle("in_progress").primaryAction?.label, "Mark as done");
  assert.equal(getCleanerLifecycle("action_required").checklistActive, true);
  assert.equal(getCleanerLifecycle("ready").terminal, true);
});

test("Today selection prefers current work and otherwise the next assignment", () => {
  const jobs = selectRelevantCleanerJobs([{ status: "awaiting_response", access_start_at: "2026-08-03T09:00:00Z" }, { status: "in_progress", access_start_at: "2026-08-04T09:00:00Z" }, { status: "accepted", access_start_at: "2026-08-02T09:00:00Z" }]);
  assert.equal(jobs.primary?.status, "in_progress");
  assert.equal(jobs.secondary.length, 2);
});

test("pre-start pages do not render checklist blockers or raw task IDs", () => {
  assert.doesNotMatch(page, /after you mark Arrived|Not available until arrival|Task \$\{/);
  assert.doesNotMatch(page, /Save task|Upload task photo|Final completion evidence/);
});

test("task completion is one action and photo upload auto-completes after successful evidence", () => {
  assert.match(page, /Complete task/);
  assert.match(page, /Complete with photo/);
  assert.match(page, /className=\"sr-only\"/);
  assert.match(actions, /evidenceError/);
  assert.match(actions, /\["completion_photo", "key_return"\]/);
  assert.match(actions, /completed: true/);
});

test("server remains authoritative for readiness and rejects pre-start mutations", () => {
  assert.match(actions, /\["in_progress", "action_required"\]\.includes\(item\.status\)/);
  assert.match(actions, /evaluate_work_item_readiness/);
  assert.equal(evaluateReadiness({ completionSubmitted: true, mandatoryTasks: [{ completed: false }], photoTasks: [], noteTasks: [], requiredPhotoCount: 0, completionPhotoCount: 0, keyReturnRequired: false, keyReturnConfirmed: false, unresolvedBlockingIssues: 0 }).ready, false);
});

test("completed/property-ready detail has no sticky completion action", () => {
  assert.match(page, /item\.status === \"in_progress\" && blockers\.length === 0/);
  assert.match(page, /idle=\"Mark as done\"/);
  assert.doesNotMatch(page, /sticky bottom-0/);
});

test("Today keeps acceptance on detail and active details expose the next action", () => {
  assert.doesNotMatch(cards, /Next: Accept/);
  assert.match(cards, /href=\{`\/cleaner\/turnovers\/\$\{item\.id\}`\}/);
  assert.match(page, /idle=\{currentAction\.label\}/);
  assert.match(page, /\["accepted", "en_route", "arrived"\]\.includes\(item\.status\)/);
});

test("cleaner detail uses the canonical operational linen and access fields", () => {
  assert.match(page, /linen_requirements/);
  assert.match(page, /towel_requirements/);
  assert.match(page, /bed_configuration/);
  assert.match(page, /consumables_instructions/);
  assert.match(page, /waste_instructions/);
  assert.match(page, /Linen &amp; supplies/);
  assert.match(page, /parking_notes/);
  assert.match(page, /floor_lift_notes/);
  assert.match(page, /Property notes/);
  assert.match(page, /accepted && tasks\.length > 0/);
  assert.match(page, /activeWork && !task\.completed/);
});

test("completed cleaner and operator views are read-only receipts", () => {
  assert.match(page, /Clean completed/);
  assert.match(page, /tasks completed/);
  assert.match(page, /photos submitted/);
  assert.match(operatorPage, /Cleaning progress/);
  assert.match(operatorPage, /result\.tasks\.map/);
  assert.match(operatorPage, /Property ready|Cleaning progress/);
  assert.match(operatorPage, /Guest check-in/);
});

test("readiness integrity validates required results, task evidence and stored paths", () => {
  assert.match(integrityMigration, /missing_results/);
  assert.match(integrityMigration, /required checklist result/);
  assert.match(integrityMigration, /nullif\(trim\(e\.storage_path\),''\) is not null/);
  assert.match(integrityMigration, /required_notes_missing/);
});

test("pre-acceptance query excludes sensitive access fields and accepted view restores them", () => {
  const firstQuery = page.indexOf('select(`${base},properties(nickname)`)');
  const fullQuery = page.indexOf('properties(nickname,address_line_1,city,postcode,access_notes,key_instructions');
  assert.ok(firstQuery >= 0);
  assert.ok(fullQuery > firstQuery);
  assert.match(page, /const acceptedStatuses =/);
  assert.match(page, /assignmentStatus === "accepted"/);
  assert.match(page, /if \(accepted\)/);
  assert.match(page, /<h2 className=\"text-lg font-extrabold\">Access<\/h2>/);
  assert.doesNotMatch(page, /Today \/ Upcoming \/ Completed \/ Profile/);
});

test("cleaner transitions clear stale errors and retrying an accepted request is idempotent", () => {
  assert.match(actions, /revalidatePath\(`\/cleaner\/turnovers\/\$\{id\}`\);[\s\S]*redirect\(`\/cleaner\/turnovers\/\$\{id\}`\)/);
  assert.match(idempotencyMigration, /if current_row\.status = next_status then/);
  assert.match(idempotencyMigration, /without duplicating side effects/);
  assert.match(idempotencyMigration, /return current_row;/);
});

test("cleaner detail keeps access protected and renders real travel context", () => {
  assert.match(page, /formatDisplayAddress\(\[property\?\.address_line_1, property\?\.city, property\?\.postcode\]/);
  assert.match(page, /https:\/\/www\.google\.com\/maps\/search/);
  assert.match(page, /Ready by/);
  assert.match(page, /Available after acceptance/);
  assert.match(page, /accepted && <section/);
});

test("development completion shortcut is guarded, assigned-cleaner scoped, and idempotent", () => {
  const helper = actions.slice(actions.indexOf("export async function completeTestTurnover"), actions.indexOf("async function insertPropertyChecklistTask"));
  assert.match(page, /process\.env\.NODE_ENV === "development"/);
  assert.match(page, /Complete test clean/);
  assert.match(helper, /export async function completeTestTurnover/);
  assert.match(helper, /process\.env\.NODE_ENV !== "development"/);
  assert.match(helper, /requireCleanerUser\(\)/);
  assert.match(helper, /eq\("assignments\.worker_id", workerId\)/);
  assert.match(helper, /transition_work_item/);
  assert.match(helper, /development-test:/);
  assert.match(helper, /issue_type: "missing_item"/);
  assert.match(helper, /No clean hand towel was available/);
  assert.match(helper, /if \(!existingIssue\)/);
  assert.doesNotMatch(helper, /sendOperatorTurnoverEmail|sendCleanerInvitationEmail/);
});

test("business clean test-data fill is development-only, owned, and checklist-idempotent", () => {
  assert.match(actions, /export async function fillTestCleanData/);
  const helper = actions.slice(
    actions.indexOf("export async function fillTestCleanData"),
    actions.indexOf("async function insertPropertyChecklistTask"),
  );
  assert.match(helper, /process\.env\.NODE_ENV !== "development"/);
  assert.match(helper, /requireBusinessUser\(\)/);
  assert.match(helper, /\.eq\("account_id", accountId\)/);
  assert.match(helper, /access_notes/);
  assert.match(helper, /linen_requirements/);
  assert.match(helper, /consumables_instructions/);
  assert.match(helper, /existingLabels/);
  assert.match(
    readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8"),
    /process\.env\.NODE_ENV === "development"[\s\S]*Fill test clean data/,
  );
});

test("development shortcut keeps normal completion validation intact", () => {
  assert.match(actions, /evaluate_work_item_readiness/);
  assert.match(actions, /next_status: "evidence_submitted"/);
  assert.match(integrityMigration, /required_results_missing/);
  assert.match(integrityMigration, /required_notes_missing/);
});

test("mobile cleaner cleanup removes explicit form encoding, dense Today chrome, and uses fixed nav", () => {
  assert.doesNotMatch(page, /method=|encType=/);
  assert.doesNotMatch(today, /YOUR WORK|Your current job and next assignment/);
  assert.match(navigation, /fixed inset-x-0 bottom-0/);
  assert.match(today, /<h1 className="text-2xl font-extrabold/);
});
