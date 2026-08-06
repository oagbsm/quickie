import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCleanerLifecycle, selectRelevantCleanerJobs } from "../lib/cleaner/lifecycle.ts";
import { hasRequiredTaskPhoto, isTaskEffectivelyComplete } from "../lib/cleaner/task-completion.ts";
import { evaluateReadiness } from "../lib/turnovers/readiness.ts";

const page = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const taskPhoto = readFileSync(new URL("../app/cleaner/TaskPhotoUpload.tsx", import.meta.url), "utf8");
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
  assert.equal(getCleanerLifecycle("in_progress").primaryAction?.label, "Complete clean");
  assert.equal(getCleanerLifecycle("action_required").checklistActive, true);
  assert.equal(getCleanerLifecycle("ready").terminal, true);
});

test("Today selection prefers current work and otherwise the next assignment", () => {
  const jobs = selectRelevantCleanerJobs([{ status: "awaiting_response", access_start_at: "2026-08-03T09:00:00Z" }, { status: "in_progress", access_start_at: "2026-08-04T09:00:00Z" }, { status: "accepted", access_start_at: "2026-08-02T09:00:00Z" }]);
  assert.equal(jobs.primary?.status, "in_progress");
  assert.equal(jobs.secondary.length, 2);
});

test("one task photo only completes the exact task", () => {
  const tasks = [
    { id: "task-a", completed: true, photo_required: true },
    { id: "task-b", completed: true, photo_required: true },
    { id: "task-c", completed: false, photo_required: true },
  ];
  const evidence = [{ work_item_id: "clean-1", checklist_task_id: "task-a", evidence_type: "completion_photo", storage_path: "account/clean-1/a.jpg" }];
  assert.equal(isTaskEffectivelyComplete(tasks[0], "clean-1", evidence), true);
  assert.equal(isTaskEffectivelyComplete(tasks[1], "clean-1", evidence), false);
  assert.equal(isTaskEffectivelyComplete(tasks[2], "clean-1", evidence), false);
  assert.equal(tasks.filter((task) => isTaskEffectivelyComplete(task, "clean-1", evidence)).length, 1);
});

test("task evidence is isolated by task and turnover", () => {
  const evidence = [{ work_item_id: "clean-old", checklist_task_id: "task-a", evidence_type: "completion_photo", storage_path: "old/a.jpg" }];
  assert.equal(hasRequiredTaskPhoto("task-a", "clean-old", evidence), true);
  assert.equal(hasRequiredTaskPhoto("task-b", "clean-old", evidence), false);
  assert.equal(hasRequiredTaskPhoto("task-a", "clean-new", evidence), false);
  assert.equal(hasRequiredTaskPhoto("task-a", "clean-old", [{ work_item_id: "clean-old", checklist_task_id: "task-a", evidence_type: "completion_photo", storage_path: " " }]), false);
});

test("pre-start pages do not render checklist blockers or raw task IDs", () => {
  assert.doesNotMatch(page, /after you mark Arrived|Not available until arrival|Task \$\{/);
  assert.doesNotMatch(page, /Complete test clean|Fill test clean data|testData=1|Development test completion/);
});

test("task completion is one action and photo upload auto-completes after successful evidence", () => {
  assert.match(page, /Complete task/);
  assert.doesNotMatch(page, /Save task photo/);
  assert.match(page, /Upload photo/);
  assert.match(page, /removeEvidence/);
  assert.match(page, /#completion-photos/);
  assert.match(page, /#task-\$\{task\.id\}/);
  assert.match(page, /className=\"sr-only\"/);
  assert.match(actions, /evidenceError/);
  assert.match(actions, /\["completion_photo", "key_return"\]/);
  assert.match(actions, /\.eq\("assignments\.worker_id", workerId\)/);
  assert.match(actions, /checklist_task_id: taskId/);
  assert.match(actions, /savedEvidence/);
  assert.match(actions, /savedEvidence\.work_item_id !== turnoverId/);
  assert.match(actions, /savedEvidence\.checklist_task_id !== taskId/);
  assert.match(actions, /\.eq\("id", task\.id\)\.eq\("work_item_id", turnoverId\)/);
  assert.match(actions, /cleanerEvidenceLog/);
  assert.match(actions, /errorCode: evidenceError\?\.code/);
  assert.match(actions, /errorMessage: evidenceError\?\.message/);
  assert.match(actions, /errorDetails: evidenceError\?\.details/);
  assert.match(actions, /errorHint: evidenceError\?\.hint/);
  assert.match(actions, /storage\.from\("turnover-evidence"\)\.remove\(\[path\]\)/);
  assert.match(actions, /redirect\(`\/cleaner\/turnovers\/\$\{turnoverId\}`\)/);
  assert.match(page, /storage_path/);
  assert.match(page, /Required photo saved/);
  assert.match(taskPhoto, /requestSubmit\(\)/);
  assert.match(taskPhoto, /Uploading…/);
  assert.match(taskPhoto, /PhotoPicker/);
  assert.doesNotMatch(taskPhoto, /Save task photo/);
  assert.match(actions, /export async function removeEvidence/);
  assert.match(actions, /evidence\.evidence_type !== "completion_photo"/);
  assert.match(actions, /\.eq\("uploader_id", user\.id\)/);
  assert.match(actions, /completed: true/);
});

test("server remains authoritative for readiness and rejects pre-start mutations", () => {
  assert.match(actions, /\["in_progress", "action_required"\]\.includes\(item\.status\)/);
  assert.match(actions, /evaluate_work_item_readiness/);
  assert.equal(evaluateReadiness({ completionSubmitted: true, mandatoryTasks: [{ completed: false }], photoTasks: [], noteTasks: [], requiredPhotoCount: 0, completionPhotoCount: 0, keyReturnRequired: false, keyReturnConfirmed: false, unresolvedBlockingIssues: 0 }).ready, false);
});

test("completed/property-ready detail has no sticky completion action", () => {
  assert.match(page, /item\.status === \"in_progress\"/);
  assert.match(page, /idle=\"Complete clean\"/);
  assert.match(page, /disabled=\{!canComplete\}/);
  assert.match(page, /blockers\.length > 0/);
  assert.doesNotMatch(page, /sticky bottom-0/);
});

test("active cleaner tasks are separated from collapsed completed history", () => {
  assert.match(page, /const activeTasks = tasks\.filter\(taskIsActionable\)/);
  assert.match(page, /const completedTasks = tasks\.filter\(\(task\) => !taskIsActionable\(task\)\)/);
  assert.match(page, />Active<\/p>/);
  assert.match(page, /<span>Completed<\/span>/);
  assert.match(page, /completedGrouped, false/);
  assert.match(page, /Checklist: \{completedCount\} of \{tasks\.length\} tasks complete/);
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
  assert.match(page, /activeWork && needsEvidenceAction/);
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
  assert.doesNotMatch(page, /process\.env\.NODE_ENV/);
  assert.doesNotMatch(page, /Complete test clean|Fill test clean data|testData/);
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

test("cleaner test-data fill is development-only, assigned-clean scoped, and checklist-safe", () => {
  assert.match(actions, /export async function fillTestCleanData/);
  const helper = actions.slice(
    actions.indexOf("export async function fillTestCleanData"),
    actions.indexOf("export async function sendTestCleanerEmail"),
  );
  assert.match(helper, /process\.env\.NODE_ENV !== "development"/);
  assert.match(helper, /requireCleanerUser\(\)/);
  assert.match(helper, /assignments\.worker_id/);
  assert.match(helper, /assignment\.worker_id !== workerId/);
  assert.match(helper, /\["arrived", "in_progress"\]/);
  assert.match(helper, /checklist_tasks/);
  assert.match(helper, /\.update\(patch\)/);
  assert.doesNotMatch(helper, /requireBusinessUser\(\)/);
  const operatorPage = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
  const cleanerPage = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(operatorPage, /Fill test clean data/);
  assert.doesNotMatch(cleanerPage, /showTestDataHelper|Fill test clean data|process\.env\.NODE_ENV|testData=1/);
});

test("development cleaner email diagnostic is not exposed in production", () => {
  assert.match(operatorPage, /process\.env\.NODE_ENV === "development"[\s\S]*Send test cleaner email/);
  assert.match(actions, /sendTestCleanerEmail/);
  assert.match(actions, /testEmail=unavailable/);
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
