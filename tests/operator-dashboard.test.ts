import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getOperatorState } from "../lib/turnovers/operator-lifecycle.ts";

const detail = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../app/business/dashboard/page.tsx", import.meta.url), "utf8");
const notificationMigration = readFileSync(new URL("../supabase/migrations/202608010004_operator_notification_noise.sql", import.meta.url), "utf8");

test("operator state mapping gives unassigned a cleaner action without completion warnings", () => {
  assert.equal(getOperatorState("unassigned").message, "Cleaner needed");
  assert.equal(getOperatorState("unassigned").action, "Assign cleaner");
  assert.doesNotMatch(detail, /Completion has not been submitted/);
});

test("awaiting response exposes cleaner and invitation action", () => {
  assert.match(detail, /Cleaner invited \/ awaiting response/);
  assert.match(detail, /Resend invitation/);
});

test("active operator detail shows heartbeat and collapsible checklist sections", () => {
  assert.match(detail, /Guest check-in/);
  assert.match(detail, /Cleaning progress/);
  assert.match(detail, /View full checklist/);
  assert.match(detail, /openIssues.length > 0/);
  assert.match(detail, /Recent activity/);
});

test("dashboard uses specific attention causes and canonical ready state", () => {
  assert.match(dashboard, /Needs attention/);
  assert.match(dashboard, /Assign cleaner/);
  assert.match(dashboard, /Recently completed/);
  assert.match(dashboard, /item.status === "ready"/);
  assert.doesNotMatch(dashboard, /Requires your input/);
});

test("completed cards show one concise status", () => {
  assert.match(dashboard, /Property ready/);
  assert.match(dashboard, /TurnoverStatus status="ready"/);
});

test("low-value en-route notification noise is suppressed and important copy is specific", () => {
  assert.match(notificationMigration, /turnover_en_route/);
  assert.match(notificationMigration, /delete from public.notifications/);
  assert.match(notificationMigration, /Cleaner accepted the turnover/);
  assert.match(notificationMigration, /Cleaner arrived at the property/);
});
