import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/business/properties/[id]/page.tsx", import.meta.url), "utf8");
const calendar = readFileSync(new URL("../app/business/properties/[id]/CalendarSources.tsx", import.meta.url), "utf8");
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
