import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const status = readFileSync(new URL("../app/business/components/TurnoverStatus.tsx", import.meta.url), "utf8");

test("clean detail builds addresses from present components only", () => {
  assert.match(page, /\[property\?\.address_line_1, property\?\.city, property\?\.postcode\]/);
  assert.match(page, /typeof part === "string" && part\.trim\(\)\.length > 0/);
  assert.match(page, /join\(", "\) \|\| item\.property_general_area/);
});

test("clean detail uses a single needs-cleaner action card", () => {
  assert.match(status, /status === "unassigned" \? "Needs cleaner"/);
  assert.match(page, /<h2 className="text-xl font-extrabold text-amber-950">Assign a cleaner<\/h2>/);
  assert.match(page, /Choose who will complete this clean\./);
  assert.doesNotMatch(page, /<h2 className="text-xl font-extrabold text-amber-950">Cleaner needed<\/h2>/);
  assert.doesNotMatch(page, /state\.message &&/);
});

test("assignment actions and checklist sections use existing data and actions", () => {
  assert.match(page, /action=\{assignWorker\}/);
  assert.match(page, /<ReassignCleanerForm/);
  assert.match(page, /result\.tasks\.map/);
  assert.match(page, /<summary className="flex min-h-11 cursor-pointer/);
  assert.doesNotMatch(page, /View full checklist/);
  assert.match(page, /active && assignment && <details/);
});
