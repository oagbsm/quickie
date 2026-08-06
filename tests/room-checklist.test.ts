import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202608070001_room_instance_checklists.sql", import.meta.url), "utf8");
const reservationMigration = readFileSync(new URL("../supabase/migrations/202608070002_room_instance_reservation_snapshots.sql", import.meta.url), "utf8");
const createAction = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const cleanerPage = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const businessPage = readFileSync(new URL("../app/business/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const propertyPage = readFileSync(new URL("../app/business/properties/[id]/page.tsx", import.meta.url), "utf8");

test("one-bedroom and one-bathroom properties use numbered room instances", () => {
  assert.match(migration, /when 'bedroom' then greatest\(coalesce\(property_row\.bedrooms, 0\), 0\)/);
  assert.match(migration, /when 'bathroom' then greatest\(floor\(coalesce\(property_row\.bathrooms, 0\)\), 0\)::integer/);
  assert.match(migration, /initcap\(replace\(section_row\.room_type, '_', ' '\)\) \|\| ' ' \|\| room_index/);
});

test("future clean creation uses the room-aware snapshot function", () => {
  assert.match(createAction, /snapshot_work_item_checklist/);
  assert.doesNotMatch(createAction, /checklist_template_sections\(id,title,position,checklist_template_tasks/);
});

test("reservation-created cleans use the same snapshot function", () => {
  assert.match(reservationMigration, /perform public\.snapshot_work_item_checklist\(item\.id\)/g);
  assert.doesNotMatch(reservationMigration, /insert into public\.checklist_tasks/);
});

test("cleaner and business views preserve room/task grouping", () => {
  assert.match(cleanerPage, /section_title/);
  assert.match(cleanerPage, /activeGrouped/);
  assert.match(businessPage, /section_title/);
  assert.match(propertyPage, /room_type/);
  assert.match(propertyPage, /Applies to each/);
});

test("room evidence remains attached to the exact generated checklist task", () => {
  assert.match(migration, /checklist_tasks\(/);
  assert.match(migration, /source_task_id/);
  assert.match(migration, /room_instance_id/);
  assert.match(createAction, /snapshot_work_item_checklist/);
});
