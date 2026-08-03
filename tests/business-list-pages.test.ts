import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bookings = read("app/business/reservations/page.tsx");
const cleans = read("app/business/turnovers/page.tsx");
const dashboard = read("app/business/dashboard/page.tsx");
const properties = read("app/business/properties/page.tsx");
const address = read("lib/display-address.ts");

test("bookings list prioritises the stay and keeps abnormal status visible", () => {
  for (const label of ["Upcoming", "Past", "Cancelled"]) assert.match(bookings, new RegExp(label));
  assert.match(bookings, /<span>Stay<\/span>/);
  assert.match(bookings, /<span>Cleaning<\/span>/);
  assert.match(bookings, /stayDateTime\(row\.check_in_at\)/);
  assert.match(bookings, /source === "manual"/);
  assert.match(bookings, /booking_com: "Booking\.com"/);
  assert.doesNotMatch(bookings, /<span>Linked clean<\/span>/);
  assert.doesNotMatch(bookings, /Updated \{formatBusinessDateTime/);
  assert.doesNotMatch(bookings, /<span className="sm:hidden">\+ Add<\/span>/);
  assert.match(bookings, /href=\{`\/business\/reservations\/\$\{row\.id\}`\}/);
  assert.match(bookings, /row\.status !== "confirmed"/);
});

test("cleans list prioritises the operational window and status", () => {
  for (const label of ["Upcoming", "Attention", "Completed"]) assert.match(cleans, new RegExp(label));
  assert.match(cleans, /<span>Cleaning window<\/span>/);
  assert.match(cleans, /<span>Status<\/span>/);
  assert.match(cleans, /time\(row\.access_start_at\)/);
  assert.match(cleans, /Guest check-in/);
  assert.doesNotMatch(cleans, /What’s happening/);
  assert.doesNotMatch(cleans, /Checkout \/ Check-in/);
  assert.doesNotMatch(cleans, /bed\`/);
  assert.doesNotMatch(cleans, /standard_turnover/);
  assert.doesNotMatch(cleans, /Cleaner not assigned/);
  assert.match(cleans, /reason === "Turnover overdue" \? "Clean overdue"/);
  assert.doesNotMatch(cleans, /<span className="sm:hidden">\+ Add<\/span>/);
  assert.match(cleans, /href=\{`\/business\/turnovers\/\$\{row\.id\}`\}/);
  assert.match(cleans, /rows\.length \? "mt-4 hidden sm:grid" : "hidden"/);
});

test("dashboard and properties use compact operational summaries", () => {
  assert.match(dashboard, /grid-cols-3/);
  assert.match(dashboard, /Needs attention/);
  assert.match(dashboard, /border-l-amber-400 bg-white/);
  assert.match(dashboard, /formatDisplayAddress/);
  assert.match(properties, /<summary className=.*>Filter<\/summary>/);
  assert.match(properties, /No upcoming clean/);
  assert.match(properties, /Booking calendar/);
  assert.match(properties, /Connected →/);
  assert.doesNotMatch(properties, /No completed turnovers yet/);
  assert.doesNotMatch(properties, /className="portal-pill border border-slate-200 bg-slate-50 text-slate-700">\{p\.status/);
  assert.match(address, /filter\(\(part\): part is string/);
  assert.match(address, /fallback = "—"/);
});
