import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const createTurnover = actions.slice(actions.indexOf("export async function createTurnover"), actions.indexOf("export async function transitionTurnover"));

test("manual clean creation logs each safe stage without changing redirects", () => {
  assert.match(actions, /console\.info\("clean_turnover_create"/);
  for (const stage of ["start", "validation_failed", "validated", "db_create_attempt", "db_create_success", "db_create_failed"]) {
    assert.match(createTurnover, new RegExp(`turnoverCreateLog\\("${stage}"`));
  }
  assert.match(createTurnover, /rawDate: date/);
  assert.match(createTurnover, /rawCheckoutTime/);
  assert.match(createTurnover, /parsedStartAt/);
  assert.match(createTurnover, /parsedReadyBy/);
  assert.match(createTurnover, /timezone/);
  assert.match(createTurnover, /errorCode/);
  assert.match(actions, /safeErrorMessage/);
  assert.match(createTurnover, /error=date/);
  assert.match(createTurnover, /error=schedule/);
  assert.match(createTurnover, /isImplausibleTurnoverDate\(date\)/);
  assert.match(createTurnover, /\.from\("work_items"\)/);
  assert.match(createTurnover, /turnoverAssignmentEmailLog\("attempt"/);
  assert.ok(createTurnover.indexOf('turnoverCreateLog("validated"') < createTurnover.indexOf('turnoverCreateLog("db_create_attempt"'));
  assert.ok(createTurnover.indexOf('turnoverCreateLog("db_create_success"') < createTurnover.indexOf('turnoverAssignmentLog("assignment_attempt"'));
  assert.ok(createTurnover.indexOf('turnoverAssignmentLog("assignment_success"') < createTurnover.indexOf('turnoverAssignmentEmailLog("attempt"'));
});

test("manual clean assignment and notification logs distinguish skipped email from delivery result", () => {
  assert.match(actions, /console\.info\("clean_turnover_assignment"/);
  assert.match(createTurnover, /turnoverAssignmentLog\("assignment_attempt"/);
  assert.match(createTurnover, /turnoverAssignmentLog\("assignment_success"/);
  assert.match(createTurnover, /turnoverAssignmentLog\("assignment_failed"/);
  assert.match(actions, /console\.info\("clean_turnover_assignment_email"/);
  assert.match(createTurnover, /turnoverAssignmentEmailLog\("attempt"/);
  assert.match(createTurnover, /turnoverAssignmentEmailLog\("result"/);
  assert.match(createTurnover, /status: delivery\.status/);
  assert.match(createTurnover, /deliveryId: delivery\.deliveryId/);
  assert.match(createTurnover, /reason: assigned \? "worker_email_missing" : "assignment_not_found"/);
});
