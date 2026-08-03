import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/business/properties/[id]/page.tsx", import.meta.url), "utf8");
const calendar = readFileSync(new URL("../app/business/properties/[id]/CalendarSources.tsx", import.meta.url), "utf8");
const propertyReservations = readFileSync(new URL("../app/business/properties/[id]/PropertyReservations.tsx", import.meta.url), "utf8");
const oldCleaners = readFileSync(new URL("../app/business/properties/[id]/cleaners/page.tsx", import.meta.url), "utf8");

test("property workspace exposes exactly four tabs and redirects removed routes", () => {
  assert.match(page, /\["overview", "Overview"\]/);
  assert.match(page, /\["reservations", "Bookings"\]/);
  assert.match(page, /\["checklist", "Checklist"\]/);
  assert.match(page, /\["access", "Access"\]/);
  assert.match(page, /requested === "standard"/);
  assert.match(page, /requested === "cleaners"/);
  assert.match(page, /requested === "history" \|\| requested === "activity"/);
  assert.match(oldCleaners, /redirect\(`\/business\/properties\/\$\{id\}\?tab=overview`\)/);
  assert.doesNotMatch(page, /\["standard", "Standard"\]/);
});

test("overview includes next clean, default cleaner, calendar and recent clean areas", () => {
  assert.match(page, /NEXT CLEAN/);
  assert.match(page, /CLEANER/);
  assert.match(page, /Default cleaner/);
  assert.match(page, /Recent cleans/);
  assert.match(page, /property_workers/);
});

test("calendar setup is host-facing and does not request connection names", () => {
  assert.match(calendar, /Booking calendar/);
  assert.match(calendar, /Calendar URL/);
  assert.doesNotMatch(calendar, /Connection name/);
});

test("property bookings prioritise reservations and linked cleaning windows", () => {
  assert.match(page, /listReservations\("upcoming", id\)/);
  assert.match(page, /PropertyReservations propertyId=\{id\} reservations=\{propertyReservations\}/);
  assert.match(page, /Connected calendars/);
  assert.match(propertyReservations, /Calendar/);
  assert.match(propertyReservations, /List/);
  assert.match(propertyReservations, /Cleaning window/);
  assert.match(propertyReservations, /Booking conflict/);
  assert.match(propertyReservations, /rejectedConflicts/);
  assert.match(propertyReservations, /Not imported/);
  assert.match(propertyReservations, /Booking conflict.*Not imported/);
  assert.match(propertyReservations, /RejectedConflictRow/);
  assert.match(propertyReservations, /Some imported stays overlap existing bookings/);
  assert.match(propertyReservations, /Review conflicts ↓/);
  assert.match(propertyReservations, /focusConflictTarget/);
  assert.match(propertyReservations, /setView\("list"\)/);
  assert.match(propertyReservations, /setShowAllUpcoming\(true\)/);
  assert.match(propertyReservations, /Ignore conflict/);
  assert.match(propertyReservations, /Ignore all/);
  assert.match(propertyReservations, /Ignore all \{count\} conflicts\?/);
  assert.match(propertyReservations, /ignoreAllCalendarConflictsAction/);
  assert.match(propertyReservations, /This \{providerLabel\(conflict\.provider\)\} stay was not imported because it overlaps an existing booking/);
  assert.match(propertyReservations, /Booking dates unavailable for this earlier conflict/);
  assert.doesNotMatch(propertyReservations, /This \{providerLabel\(conflict\.provider\)\} stay was not imported\. Check the source booking/);
  assert.match(propertyReservations, /ignoreCalendarConflictAction/);
  assert.match(page, /anchorId: `booking-conflict-\$\{issue\.id\.slice\(0, 8\)\}`/);
  assert.match(propertyReservations, /tabIndex=\{-1\}/);
  assert.doesNotMatch(propertyReservations, /rejectedConflicts\.map\(\(conflict\) => <div/);
  assert.doesNotMatch(propertyReservations, /View booking →.*Not imported/);
  assert.match(propertyReservations, /border-red-500 bg-red-50/);
  assert.match(propertyReservations, /border-red-200 bg-red-50/);
  assert.match(propertyReservations, /booking conflict with another stay/);
  assert.match(propertyReservations, /bg-red-200.*Booking conflict/);
  assert.match(propertyReservations, /conflictingIds/);
  assert.match(propertyReservations, /View booking →/);
  assert.match(propertyReservations, /reservationSourceLabel/);
  assert.match(propertyReservations, /operationalEventsForDay/);
  assert.match(propertyReservations, /View all upcoming bookings/);
  assert.match(propertyReservations, /Guest stay/);
  assert.doesNotMatch(propertyReservations, /Needs cleaner|Assign cleaner|Cleaner assigned/);
  assert.doesNotMatch(propertyReservations, /: "Stay"/);
});

test("property overview keeps the single-source label and counts multiple calendars", () => {
  assert.match(page, /calendarConnections\.length > 1/);
  assert.match(page, /\$\{calendarConnections\.length\} calendars connected/);
  assert.match(page, /: "Calendar connected"/);
});

test("checklist editing controls are edit-mode only and access omits empty values", () => {
  assert.match(page, /edit \?/);
  assert.match(page, /Edit checklist/);
  assert.match(page, /value \?\n/);
  assert.doesNotMatch(page, /Not set/);
});

test("checklist editing uses compact accessible controls and grouped sections", () => {
  assert.match(page, /Reorder checklist item:/);
  assert.match(page, /Move .* up/);
  assert.match(page, /Move .* down/);
  assert.match(page, /aria-label="Remove checklist item"/);
  assert.match(page, /<TrashIcon \/>/);
  assert.match(page, /tasks\.length === 1 \? "item" : "items"/);
  assert.doesNotMatch(page, />↑<\/button>|>↓<\/button>|>Remove<\/button>/);
});

test("header prioritises Add booking and moves manual clean under More", () => {
  assert.match(page, /Add booking/);
  assert.match(page, />More<\/summary>/);
  assert.match(page, /Create manual clean/);
});
