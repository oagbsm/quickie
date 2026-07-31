import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateReadiness } from "../lib/turnovers/readiness.ts";

const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const turnoverPage = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const todayPage = readFileSync(new URL("../app/cleaner/today/page.tsx", import.meta.url), "utf8");
const upcomingPage = readFileSync(new URL("../app/cleaner/upcoming/page.tsx", import.meta.url), "utf8");
const inviteCopy = readFileSync(new URL("../app/business/cleaners/CopyInviteLink.tsx", import.meta.url), "utf8");
const cleanerPage = readFileSync(new URL("../app/business/cleaners/[id]/page.tsx", import.meta.url), "utf8");
const transitionMigration = readFileSync(new URL("../supabase/migrations/202607260002_str_security_notifications_and_evidence.sql", import.meta.url), "utf8");

test("invite copy can never produce a cleaner turnover URL", () => {
  assert.match(inviteCopy, /\/invite\/\$\{encodeURIComponent\(inviteToken\)\}/);
  assert.doesNotMatch(inviteCopy, /cleaner\/turnovers/);
  assert.match(cleanerPage, /CopyInviteLink inviteToken=\{manualInvite\.token\}/);
});

test("checklist and evidence are unavailable before arrival", () => {
  assert.match(turnoverPage, /const canWork = \["arrived", "in_progress", "action_required"\]/);
  assert.match(turnoverPage, /canWork \? t\.completed \?/);
  assert.match(turnoverPage, /canWork && <form action=\{uploadEvidence\}/);
});

test("direct checklist and evidence actions reject pre-arrival calls", () => {
  assert.match(actions, /error=pre_arrival/);
  assert.match(actions, /\["arrived", "in_progress", "action_required"\]\.includes\(item\.status\)/);
  assert.match(transitionMigration, /assigned_worker_required/);
});

test("task completion requires response, note and required photo", () => {
  assert.match(actions, /task_requirements/);
  assert.match(actions, /task_photo_required/);
  assert.match(actions, /evidence_submissions/);
  assert.match(turnoverPage, /defaultChecked=\{t\.completed\}/);
});

test("failed completion preserves work and exposes exact blockers", () => {
  assert.match(turnoverPage, /Outstanding requirements|Before you complete the clean/);
  assert.match(turnoverPage, /incompleteMandatory/);
  assert.match(turnoverPage, /missingNotes/);
  assert.match(turnoverPage, /missingTaskPhotos/);
  assert.match(turnoverPage, /completionPhotos/);
  assert.match(transitionMigration, /readiness_result=jsonb_build_object/);
});

test("completion remains retryable after action_required", () => {
  assert.match(turnoverPage, /action_required: \["Resolve remaining requirements", "in_progress"\]/);
  assert.match(transitionMigration, /when 'action_required' then next_status in \('in_progress','cancelled'\)/);
});

test("cleaner screens make the next action and saved evidence explicit", () => {
  const cards = readFileSync(new URL("../app/cleaner/TurnoverCards.tsx", import.meta.url), "utf8");
  assert.match(cards, /Next:/);
  assert.match(cards, /Accept or decline/);
  assert.match(turnoverPage, /Task completed/);
  assert.match(turnoverPage, /Task photo saved/);
  assert.match(turnoverPage, /Final completion evidence/);
  assert.match(turnoverPage, /Development-only: complete test turnover/);
  assert.match(todayPage, /one next step/);
  assert.match(upcomingPage, /next action shown/);
});

test("property readiness requires every server-side requirement", () => {
  const incomplete = evaluateReadiness({ completionSubmitted: true, mandatoryTasks: [{ completed: true }, { completed: false }], photoTasks: [], noteTasks: [], requiredPhotoCount: 1, completionPhotoCount: 1, keyReturnRequired: false, keyReturnConfirmed: false, unresolvedBlockingIssues: 0 });
  assert.equal(incomplete.ready, false);
  const complete = evaluateReadiness({ completionSubmitted: true, mandatoryTasks: [{ completed: true }], photoTasks: [], noteTasks: [], requiredPhotoCount: 1, completionPhotoCount: 1, keyReturnRequired: false, keyReturnConfirmed: false, unresolvedBlockingIssues: 0 });
  assert.equal(complete.ready, true);
});

test("pending and accepted assignments are discoverable in cleaner portal queries", () => {
  assert.match(todayPage, /assignments!inner\(status,worker_id\)/);
  assert.match(todayPage, /assignments\.worker_id/);
  assert.match(upcomingPage, /assignments!inner\(status,worker_id\)/);
  assert.match(upcomingPage, /assignments\.worker_id/);
});

test("cleaner access remains assignment scoped", () => {
  assert.match(turnoverPage, /from\("work_items"\)/);
  assert.match(transitionMigration, /public\.is_assigned_worker\(current_row\.id\)/);
  assert.match(transitionMigration, /not worker_actor then raise exception 'assigned_worker_required'/);
});

test("photo validation keeps supported formats and safe failure reasons", () => {
  assert.match(actions, /image\/jpeg.*image\/png.*image\/webp.*image\/heic/);
  assert.match(actions, /file\.size > 10_485_760/);
  assert.match(actions, /error=invalid_file/);
  assert.match(actions, /error=storage/);
  assert.match(actions, /error=evidence/);
});

test("valid task photos auto-complete only fully satisfied tasks", () => {
  assert.match(actions, /if \(taskId && type === "completion_photo"\)/);
  assert.match(actions, /task\.note_required/);
  assert.match(actions, /task\.response_type/);
  assert.match(actions, /completed: true/);
  assert.match(actions, /if \(evidenceError\) redirect/);
});

test("development shortcut is gated, assigned-cleaner-only, and uses normal validation", () => {
  assert.match(actions, /completeTestTurnover/);
  assert.match(actions, /NODE_ENV !== "development" \|\| process\.env\.QUICKOLA_TEST_SHORTCUTS !== "1"/);
  assert.match(actions, /invitation_status !== "accepted"/);
  assert.match(actions, /assignments!inner\(worker_id,status\)/);
  assert.match(actions, /development-test:\/\//);
  assert.match(actions, /DEVELOPMENT TEST EVIDENCE/);
  assert.match(actions, /transition_work_item/);
  assert.match(turnoverPage, /process\.env\.NODE_ENV === "development" && process\.env\.QUICKOLA_TEST_SHORTCUTS === "1"/);
});

test("development evidence is distinguishable and real uploads remain untouched", () => {
  assert.match(actions, /caption: marker/);
  assert.match(actions, /storage_path: `development-test:\/\//);
  assert.match(actions, /storage_path: path/);
  assert.match(actions, /evaluate_work_item_readiness/);
});
