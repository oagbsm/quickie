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
  assert.match(properties, /Calendar connected/);
  assert.match(properties, /Calendar connected/);
  assert.doesNotMatch(properties, /No completed turnovers yet/);
  assert.doesNotMatch(properties, /className="portal-pill border border-slate-200 bg-slate-50 text-slate-700">\{p\.status/);
  assert.match(address, /filter\(\(part\): part is string/);
  assert.match(address, /fallback = "—"/);
});

test("properties listing adds accessible scanning icons without replacing actions", () => {
  for (const icon of ["building", "calendar", "search", "filter", "eye", "calendar-plus"]) {
    assert.match(properties, new RegExp(`name=\"${icon}\"`));
  }
  assert.match(properties, /Property actions for/);
  assert.match(properties, /href=\{`\/business\/properties\/\$\{p\.id\}`\}/);
  assert.match(properties, /href=\{`\/business\/turnovers\/new\?property=\$\{p\.id\}`\}/);
  assert.match(properties, /name=\"q\"/);
  assert.match(properties, /name=\"status\"/);
});

test("mobile cleans and bookings prioritize real featured records and compact rows", () => {
  assert.match(cleans, /Next clean/);
  assert.match(cleans, /const featured = view === \"upcoming\" \? rows\[0\] : null/);
  assert.match(cleans, /const listRows = featured \? rows\.slice\(1\) : rows/);
  assert.match(cleans, /CleanIcon name=\"chevron\"/);
  assert.doesNotMatch(bookings, /Calendar connected/);
  assert.match(bookings, /const syncIssue = rows\.find/);
  assert.match(bookings, /Calendar sync issue/);
  assert.match(bookings, /SourceMark connection=\{row\.sourceConnection\} label=\{label\}/);
  assert.match(bookings, /const listRows = featured \? rows\.slice\(1\) : rows/);
  assert.match(bookings, /BookingIcon name=\"chevron\"/);
  assert.doesNotMatch(bookings, /guest_count.*\bGuests\b/);
});

test("featured booking uses the Airbnb wordmark and sparkles cleaning icon", () => {
  assert.match(bookings, /role="img" aria-label=\{label\}/);
  assert.match(bookings, /sourceImages/);
  assert.match(bookings, /Guest stay/);
  assert.match(bookings, /Checkout · \{stayDateTime\(featured\.check_out_at\)\}/);
  assert.match(bookings, /BookingIcon name="sparkles"/);
  assert.doesNotMatch(bookings, /BookingIcon name="cleaning"/);
  assert.doesNotMatch(bookings, /SourceMark[\s\S]*\{source\}/);
});

test("booking conflicts use a restrained red treatment without changing healthy stay styling", () => {
  assert.match(bookings, /border-l-red-500 bg-red-50\/50/);
  assert.match(bookings, /Booking conflict/);
  assert.match(bookings, /const conflictRowIds = new Set<string>\(\)/);
  assert.match(bookings, /const key = first\.property_id/);
  assert.doesNotMatch(bookings, /TurnoverStatus/);
});

test("rejected import conflicts stay distinct from persisted global bookings", () => {
  assert.match(bookings, /open_rejected_conflicts/);
  assert.match(bookings, /Not imported/);
  assert.match(bookings, /Booking conflict/);
});

test("properties mobile cards scale as a portfolio list with compact status rows", () => {
  assert.match(properties, /aria-label="Property portfolio summary"/);
  assert.match(properties, /Total properties/);
  assert.match(properties, /Need attention/);
  assert.match(properties, /href=\{`\/business\/properties\/\$\{p\.id\}`\} className=\"group block/);
  assert.match(properties, /Calendar not connected/);
  assert.match(properties, /Calendar sync failed/);
  assert.match(properties, /Calendar connection disabled/);
  assert.match(properties, /Calendar connected/);
  assert.match(properties, /className=\"flex gap-2 border-t/);
});

test("properties listing adapts portfolio summary and keeps actionable card hierarchy", () => {
  assert.match(properties, /const compactSummary = \(data \|\| \[\]\)\.length <= 3/);
  assert.match(properties, /data\.length === 1 \? "property" : "properties"/);
  assert.match(properties, /calendar\?\.conflicts/);
  assert.match(properties, /Booking conflict · Review/);
  assert.match(properties, /Calendar issue · Review/);
  assert.match(properties, /Calendar sync failed/);
  assert.match(properties, /Calendar not synced yet/);
  assert.match(properties, /Calendar connection disabled/);
  assert.match(properties, /Calendar connected/);
  assert.match(properties, /Property actions for/);
  assert.match(properties, /title="Property actions"/);
  assert.match(properties, /className="flex gap-2 border-t/);
  assert.match(properties, /min-h-11 min-w-0 flex-1/);
  assert.match(properties, /const hasSearchOrFilter = Boolean\(q \|\| status\)/);
  assert.match(properties, /No properties found/);
  assert.match(properties, /href="\/business\/properties"/);
});

test("cross-page clean vocabulary and booking information architecture stay distinct", () => {
  assert.doesNotMatch(properties, /Cleaner needed/);
  assert.doesNotMatch(cleans, /Cleaner needed/);
  assert.doesNotMatch(bookings, /Needs cleaner/);
  assert.match(cleans, />Upcoming<\/p>/);
  assert.doesNotMatch(bookings, /TurnoverStatus/);
});
