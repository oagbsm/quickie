import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getOperatorState } from "../lib/turnovers/operator-lifecycle.ts";

const detail = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../app/business/dashboard/page.tsx", import.meta.url), "utf8");
const mobileNavigation = readFileSync(new URL("../app/business/components/MobilePortalShell.tsx", import.meta.url), "utf8");
const notificationMigration = readFileSync(new URL("../supabase/migrations/202608010004_operator_notification_noise.sql", import.meta.url), "utf8");

test("operator state mapping gives unassigned a cleaner action without completion warnings", () => {
  assert.equal(getOperatorState("unassigned").message, "Needs cleaner");
  assert.equal(getOperatorState("unassigned").action, "Assign cleaner");
  assert.doesNotMatch(detail, /Completion has not been submitted/);
});

test("awaiting response exposes cleaner and invitation action", () => {
  assert.match(detail, /Cleaner assigned/);
  assert.match(detail, /state\.label/);
  assert.match(detail, /Resend invitation/);
});

test("active operator detail shows heartbeat and collapsible checklist sections", () => {
  assert.match(detail, /Guest check-in/);
  assert.match(detail, /Cleaning progress/);
  assert.match(detail, /result\.tasks\.map/);
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

test("dashboard metrics prioritize upcoming cleans, ready today, and cleaners needed", () => {
  assert.match(dashboard, /Upcoming cleans/);
  assert.match(dashboard, /Ready today/);
  assert.match(dashboard, /Needs cleaner/);
  assert.doesNotMatch(dashboard, /\["Needs attention"/);
  assert.doesNotMatch(dashboard, /\["Unassigned"/);
  assert.doesNotMatch(dashboard, /Add cleaner/);
});

test("dashboard excludes attention items from the upcoming preview", () => {
  assert.match(dashboard, /const attentionIds = new Set\(attention\.map/);
  assert.match(dashboard, /!attentionIds\.has\(item\.id\)/);
  assert.match(dashboard, /upcoming\.length > 0 &&/);
  assert.match(dashboard, /before \{time\(deadline\(item\)\)\}/);
});

test("attention actions are compact buttons and upcoming rows avoid redundant status copy", () => {
  assert.match(dashboard, /inline-flex min-h-11 w-full/);
  assert.match(dashboard, /item\.status === "unassigned" \? "Assign cleaner"/);
  assert.match(dashboard, /Clean \{time\(item\.access_start_at\)\}/);
  assert.doesNotMatch(dashboard, /getOperatorState\(item\.status\)\.message/);
});

test("dashboard attention cards are chronological, concise and capped with an existing view-all route", () => {
  assert.match(dashboard, /\.sort\(\(a, b\) => deadline\(a\)\.localeCompare\(deadline\(b\)\)\)/);
  assert.match(dashboard, /attention\.slice\(0, 3\)/);
  assert.match(dashboard, /View all attention →/);
  assert.match(dashboard, /href="\/business\/turnovers\?view=attention"/);
  assert.match(dashboard, /statusLabel = item\.status === "unassigned" \? "Needs cleaner"/);
  assert.doesNotMatch(dashboard, /property_public_name\} \{state\.attention\}/);
  assert.match(dashboard, /itemUrgency === "overdue"/);
  assert.match(dashboard, /itemUrgency === "today"/);
});

test("dashboard attention rows use neutral card borders and compact postcode location", () => {
  assert.doesNotMatch(dashboard, /border-l-4 \$\{urgencyClass\}/);
  assert.doesNotMatch(dashboard, /border-l-red-500|border-l-\[#2d67b2\]/);
  assert.match(dashboard, /border-l-4 border-l-amber-400/);
  assert.match(dashboard, /const location = property\?\.postcode \|\| property\?\.city \|\| property\?\.address_line_1/);
  assert.match(dashboard, /\{location && <p/);
  assert.doesNotMatch(dashboard.split("{upcoming.length")[0], /formatDisplayAddress\(\[property\.address_line_1, property\.city, property\.postcode\]\)/);
});

test("mobile dashboard navigation preserves routes and provides touch-sized items", () => {
  assert.match(mobileNavigation, /grid-cols-5/);
  assert.match(mobileNavigation, /min-h-14/);
  for (const href of ["/business/dashboard", "/business/properties", "/business/reservations", "/business/turnovers"]) {
    assert.match(mobileNavigation, new RegExp(href.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(mobileNavigation, /Operations/);
});

test("dashboard uses the supplied semantic icon assets and state-aware supporting copy", () => {
  assert.match(dashboard, /\/icons\/dashboard\/\$\{name\}\.svg/);
  for (const name of ["calendar", "user", "alert-triangle", "home", "map-pin", "chevron-right"]) {
    assert.match(dashboard, new RegExp(`name="${name}"`));
  }
  assert.match(dashboard, /Next: \{date\(nextClean\.turnover_date\)\}/);
  assert.match(dashboard, /readyToday\.length\s*\?/);
  assert.match(dashboard, /None ready yet/);
  assert.match(dashboard, /icon: "check-square"/);
  assert.match(dashboard, /readyTone\.icon/);
  assert.match(dashboard, /const cleanerTone = unassigned\.length/);
  assert.match(dashboard, /cleanerTone\.copy/);
  assert.doesNotMatch(dashboard, /This week/);
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
