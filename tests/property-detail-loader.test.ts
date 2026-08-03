import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/business/properties/[id]/page.tsx", import.meta.url), "utf8");
const error = readFileSync(new URL("../app/business/properties/[id]/error.tsx", import.meta.url), "utf8");

test("property detail embeds operational issues through work items", () => {
  assert.match(page, /work_items\(id,turnover_date,status,ready_at,assignments\(workers\(display_name\)\),operational_issues\(status\)\)/);
  assert.doesNotMatch(page, /property_workers\([^)]*\),operational_issues\(status\)/);
  assert.match(page, /property_query_failed/);
  assert.match(page, /queryError\.details/);
  assert.match(page, /queryError\.hint/);
});

test("property detail derives optional property status from optional work-item issues", () => {
  assert.match(page, /flatMap\(\(item: \{ operational_issues\?: Array/);
  assert.match(page, /item\.operational_issues \|\| \[\]/);
});

test("property detail formats nullable display values with a fallback", () => {
  assert.match(page, /const display = \(value\?: string \| null\) => \{/);
  assert.match(page, /if \(!value\) return "—"/);
  assert.match(page, /value: display\(p\.property_type\)/);
  assert.match(page, /\)\?\.display_name/);
});

test("property detail failure state is accurate and returns safely to properties", () => {
  assert.match(error, /We couldn’t load this property\. Try again, or return to Properties\./);
  assert.match(error, /href="\/business\/properties"/);
  assert.match(error, /Your saved records have not been changed/);
  assert.doesNotMatch(error, /Check your connection/);
});
