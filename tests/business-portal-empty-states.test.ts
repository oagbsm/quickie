import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("dashboard uses contextual property/calendar setup CTAs without promoting manual cleans or cleaners", () => {
  const page = read("app/business/dashboard/page.tsx");
  assert.match(page, /Add property/);
  assert.match(page, /Connect your first calendar/);
  assert.doesNotMatch(page, /Add cleaner/);
  assert.doesNotMatch(page, /＋ Add clean/);
});

test("empty properties and bookings states avoid duplicate primary actions", () => {
  const properties = read("app/business/properties/page.tsx");
  const bookings = read("app/business/reservations/page.tsx");
  assert.match(properties, /data\?\.length \? <Link href="\/business\/properties\/new"/);
  assert.match(properties, /Add your first property/);
  assert.match(properties, /Connect its booking calendar and Quickola will automatically organise cleans after checkout\./);
  assert.match(properties, /className=\{`\$\{data\?\.length \? "grid" : "hidden"\}/);
  assert.match(bookings, /rows\.length \? <Link href="\/business\/reservations\/new"/);
  assert.match(bookings, /Bookings from your connected calendars will appear here automatically\./);
  assert.match(bookings, /You can also add a booking manually\./);
});

test("clean empty states retain tabs and manual creation while hiding filters without rows", () => {
  const page = read("app/business/turnovers/page.tsx");
  assert.match(page, /\[\s*\["Upcoming", "upcoming"\],\s*\["Attention", "attention"\],\s*\["Completed", "completed"\]/);
  assert.match(page, /rows\.length \? "mt-4 hidden sm:grid" : "hidden"/);
  assert.match(page, /No upcoming cleans/);
  assert.match(page, /No cleans need attention/);
  assert.match(page, /No completed cleans/);
  assert.match(page, /href="\/business\/turnovers\/new"/);
});

test("settings is simplified without removing defaults or save behavior", () => {
  const page = read("app/business/settings/page.tsx");
  assert.match(page, /<h1 className="portal-title">Settings<\/h1>/);
  assert.match(page, /Manage your account and cleaning defaults\./);
  assert.doesNotMatch(page, /<h2 className="text-xl font-extrabold">Workspace<\/h2>/);
  assert.match(page, /name="timezone"/);
  assert.match(page, /Property defaults/);
  assert.match(page, /Typical guest checkout/);
  assert.match(page, /Typical guest check-in/);
  assert.match(page, /Typical cleaning time/);
  assert.match(page, /Cleaning checklist/);
  assert.match(page, /Set the standard tasks cleaners should complete at your properties\./);
  assert.match(page, /Manage checklist/);
  assert.doesNotMatch(page, /Open checklist manager/);
  assert.match(page, /Save settings/);
  assert.match(page, /name="workspaceName"/);
  assert.match(page, /Sign out/);
});
