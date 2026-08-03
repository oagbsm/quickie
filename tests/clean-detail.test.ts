import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const status = readFileSync(new URL("../app/business/components/TurnoverStatus.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const cleanerDialog = readFileSync(new URL("../app/business/turnovers/[id]/CleanerCreationDialog.tsx", import.meta.url), "utf8");
const taskDialog = readFileSync(new URL("../app/business/turnovers/[id]/ChecklistTaskDialog.tsx", import.meta.url), "utf8");
const address = readFileSync(new URL("../lib/display-address.ts", import.meta.url), "utf8");

test("clean detail builds addresses from present components only", () => {
  assert.match(page, /formatDisplayAddress\(\[property\?\.address_line_1, property\?\.city, property\?\.postcode\]/);
  assert.match(address, /typeof part === "string" && part\.trim\(\)\.length > 0/);
  assert.match(address, /usable\.join\(", "\)/);
});

test("clean detail uses a single needs-cleaner action card", () => {
  assert.match(status, /status === "unassigned" \? "Needs cleaner"/);
  assert.match(page, /<h2 className="text-xl font-extrabold text-\[#071f49\]">Assign a cleaner<\/h2>/);
  assert.match(page, /Choose who will complete this clean\./);
  assert.match(page, /item\.status === "unassigned" \? "Not assigned"/);
  assert.match(page, /item\.status !== "unassigned" && <div><p className="text-xs font-bold text-\[#748096\]">STATUS<\/p>/);
  assert.doesNotMatch(page, /bg-amber-50 p-5/);
  assert.doesNotMatch(page, /<h2 className="text-xl font-extrabold text-amber-950">Cleaner needed<\/h2>/);
  assert.doesNotMatch(page, /state\.message &&/);
});

test("assignment actions and checklist sections use existing data and actions", () => {
  assert.match(page, /action=\{assignWorker\}/);
  assert.match(page, /<ReassignCleanerForm/);
  assert.match(page, /result\.tasks\.map/);
  assert.match(page, /<summary className="flex min-h-11 cursor-pointer/);
  assert.match(page, /role="progressbar"/);
  assert.match(page, /const progressPercent = tasks\.length \? Math\.round/);
  assert.match(page, /: 0;/);
  assert.match(page, /group-open:rotate-90/);
  assert.doesNotMatch(page, /View full checklist/);
  assert.match(page, /active && assignment && <details/);
});

test("zero-cleaner state offers the existing add-cleaner flow without an empty selector", () => {
  assert.match(page, /availableWorkers\?\.length/);
  assert.match(page, /No cleaners added yet/);
  assert.match(page, /Add your first cleaner to assign this clean\./);
  assert.match(page, /<CleanerCreationDialog turnoverId=\{id\}\/\>/);
  assert.match(page, /<CleanerCreationDialog turnoverId=\{id\} compact\/>/);
  assert.match(cleanerDialog, /action=\{addWorkerForTurnover\}/);
  assert.match(actions, /export async function addWorkerForTurnover/);
  assert.match(actions, /createWorkerAndInvite/);
});

test("clean detail supports scoped checklist additions", () => {
  assert.match(page, /<ChecklistTaskDialog turnoverId=\{id\}/);
  assert.match(taskDialog, /\+ Add task/);
  assert.match(taskDialog, /This clean only/);
  assert.match(taskDialog, /Future cleans at this property/);
  assert.match(actions, /export async function addTurnoverChecklistTask/);
  assert.match(actions, /from\("checklist_tasks"\)\.insert/);
  assert.match(actions, /insertPropertyChecklistTask\(supabase, accountId, turnover\.property_id/);
});
