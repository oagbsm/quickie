import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCleanerLifecycle, selectRelevantCleanerJobs } from "../lib/cleaner/lifecycle.ts";
import { evaluateReadiness } from "../lib/turnovers/readiness.ts";

const page = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const today = readFileSync(new URL("../app/cleaner/today/page.tsx", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../app/cleaner/CleanerNavigation.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const operatorPage = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const integrityMigration = readFileSync(new URL("../supabase/migrations/202608010003_completion_integrity.sql", import.meta.url), "utf8");

test("canonical cleaner lifecycle has one deterministic action", () => {
  assert.deepEqual(getCleanerLifecycle("awaiting_response").primaryAction, { label: "Accept", nextStatus: "accepted" });
  assert.equal(getCleanerLifecycle("accepted").label, "Accepted");
  assert.equal(getCleanerLifecycle("en_route").label, "En route");
  assert.equal(getCleanerLifecycle("arrived").primaryAction?.nextStatus, "in_progress");
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
  assert.doesNotMatch(page, /Save task|Upload task photo|Final completion evidence|Development-only/);
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
  assert.match(page, /i\.status !== \"action_required\"/);
  assert.match(page, /state\.primaryAction/);
});

test("completed cleaner and operator views are read-only receipts", () => {
  assert.match(page, /Clean completed/);
  assert.match(page, /tasks completed/);
  assert.match(page, /photos submitted/);
  assert.match(operatorPage, /View full checklist/);
  assert.match(operatorPage, /Property ready|View full checklist/);
  assert.match(operatorPage, /Guest check-in/);
});

test("readiness integrity validates required results, task evidence and stored paths", () => {
  assert.match(integrityMigration, /missing_results/);
  assert.match(integrityMigration, /required checklist result/);
  assert.match(integrityMigration, /nullif\(trim\(e\.storage_path\),''\) is not null/);
  assert.match(integrityMigration, /required_notes_missing/);
});

test("pre-acceptance query excludes sensitive access fields and accepted view restores them", () => {
  const firstQuery = page.indexOf('select(`${base},properties(nickname,address_line_1,city,postcode)`)');
  const fullQuery = page.indexOf('properties(nickname,address_line_1,city,postcode,access_notes,key_instructions');
  assert.ok(firstQuery >= 0);
  assert.ok(fullQuery > firstQuery);
  assert.match(page, /const accepted = !\["awaiting_response", "declined"\]/);
  assert.match(page, /if \(accepted\)/);
  assert.match(page, /Access and property notes/);
  assert.doesNotMatch(page, /Today \/ Upcoming \/ Completed \/ Profile/);
});

test("mobile cleaner cleanup removes explicit form encoding, dense Today chrome, and uses fixed nav", () => {
  assert.doesNotMatch(page, /method=|encType=/);
  assert.doesNotMatch(today, /YOUR WORK|Your current job and next assignment/);
  assert.match(navigation, /fixed inset-x-0 bottom-0/);
  assert.match(today, /<h1 className="text-2xl font-extrabold/);
});
