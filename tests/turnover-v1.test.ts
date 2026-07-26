import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReadiness } from "../lib/turnovers/readiness.ts";
import { canTransitionTurnover, hasTurnoverWindowRisk } from "../lib/turnovers/status.ts";

const complete = {
  completionSubmitted: true,
  mandatoryTasks: [{ completed: true }],
  photoTasks: [{ hasPhoto: true }],
  noteTasks: [{ note: "Checked" }],
  blockingTaskResults: [{ response: "pass" }],
  requiredPhotoCount: 2,
  completionPhotoCount: 2,
  keyReturnRequired: true,
  keyReturnConfirmed: true,
  unresolvedBlockingIssues: 0,
};

test("canonical lifecycle allows only sequential cleaner progression", () => {
  assert.equal(canTransitionTurnover("awaiting_response", "accepted"), true);
  assert.equal(canTransitionTurnover("accepted", "en_route"), true);
  assert.equal(canTransitionTurnover("accepted", "arrived"), false);
  assert.equal(canTransitionTurnover("in_progress", "ready"), false);
  assert.equal(canTransitionTurnover("ready", "in_progress"), false);
});

test("insufficient turnaround window is detected", () => {
  assert.equal(hasTurnoverWindowRisk(new Date("2026-08-01T11:00:00"), new Date("2026-08-01T14:00:00"), 210), true);
  assert.equal(hasTurnoverWindowRisk(new Date("2026-08-01T11:00:00"), new Date("2026-08-01T15:00:00"), 210), false);
});

test("complete proof produces property ready", () => {
  assert.deepEqual(evaluateReadiness(complete), { ready: true, blockingReasons: [] });
});

test("mandatory tasks, task photos and notes are enforced", () => {
  const result = evaluateReadiness({
    ...complete,
    mandatoryTasks: [{ completed: false }],
    photoTasks: [{ hasPhoto: false }],
    noteTasks: [{ note: " " }],
  });
  assert.equal(result.ready, false);
  assert.equal(result.blockingReasons.length, 3);
});

test("missing completion photos prevent property ready", () => {
  const result = evaluateReadiness({ ...complete, completionPhotoCount: 0 });
  assert.equal(result.ready, false);
  assert.match(result.blockingReasons[0], /2 completion photos are missing/);
});

test("unresolved blocking issue prevents property ready until resolved", () => {
  const blocked = evaluateReadiness({ ...complete, unresolvedBlockingIssues: 1 });
  const resolved = evaluateReadiness({ ...complete, unresolvedBlockingIssues: 0 });
  assert.equal(blocked.ready, false);
  assert.match(blocked.blockingReasons[0], /blocking issue remains open/);
  assert.equal(resolved.ready, true);
});

test("completion submission and key return are independently required", () => {
  const result = evaluateReadiness({ ...complete, completionSubmitted: false, keyReturnConfirmed: false });
  assert.equal(result.ready, false);
  assert.deepEqual(result.blockingReasons, ["Completion has not been submitted", "Key-return confirmation is missing"]);
});

test("a failed blocking checklist result prevents property ready", () => {
  const result = evaluateReadiness({ ...complete, blockingTaskResults: [{ response: "fail" }] });
  assert.equal(result.ready, false);
  assert.match(result.blockingReasons[0], /blocking checklist result requires attention/);
});
