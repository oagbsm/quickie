import assert from "node:assert/strict";
import test from "node:test";
import { ScenarioManifest } from "../scripts/scenario-manifest.ts";

test("scenario manifest records unique exact IDs", () => {
  const manifest = new ScenarioManifest("scenario-test");
  manifest.add("marketplace_jobs", "job-1");
  manifest.add("marketplace_jobs", "job-1");
  manifest.add("marketplace_quotes", "quote-1");
  assert.deepEqual(manifest.all(), [
    { table: "marketplace_jobs", id: "job-1" },
    { table: "marketplace_quotes", id: "quote-1" },
  ]);
  assert.equal(manifest.scenarioRunId, "scenario-test");
});

test("scenario cleanup is exact-ID based and child-first", async () => {
  const calls: Array<{ table: string; ids: string[] }> = [];
  const admin = {
    from(table: string) {
      const query = {
        delete() { return query; },
        in(_column: string, ids: string[]) { calls.push({ table, ids }); return query; },
        select() { return Promise.resolve({ data: calls.at(-1)?.ids.map((id) => ({ id })), error: null }); },
      };
      return query;
    },
  } as never;
  const manifest = new ScenarioManifest("scenario-test");
  manifest.add("marketplace_jobs", "job-1");
  manifest.add("marketplace_quotes", "quote-1");
  manifest.add("marketplace_bookings", "booking-1");
  const result = await manifest.cleanup(admin);
  assert.deepEqual(calls, [
    { table: "marketplace_bookings", ids: ["booking-1"] },
    { table: "marketplace_quotes", ids: ["quote-1"] },
    { table: "marketplace_jobs", ids: ["job-1"] },
  ]);
  assert.equal(result.retained.length, 0);
});
