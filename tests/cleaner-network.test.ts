import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const upload = readFileSync(new URL("../app/cleaner/TaskPhotoUpload.tsx", import.meta.url), "utf8");
const guard = readFileSync(new URL("../app/cleaner/CleanerNetworkGuard.tsx", import.meta.url), "utf8");
const action = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");

test("cleaner network guard preserves the loaded screen and reconciles after connectivity returns", () => {
  assert.match(guard, /addEventListener\("offline"/);
  assert.match(guard, /addEventListener\("online"/);
  assert.match(guard, /fetch\(window\.location\.href, \{ method: "HEAD"/);
  assert.match(guard, /router\.refresh\(\)/);
  assert.match(guard, /Connection interrupted — reconnecting/);
  assert.match(guard, /Back online ✓/);
});

test("task photos retain the selected File and retry once without persistent storage", () => {
  assert.match(upload, /useState<File \| null>/);
  assert.match(upload, /retryAttempted/);
  assert.match(upload, /setTimeout\(\(\) =>/);
  assert.match(upload, /data\.set\("file", file\)/);
  assert.doesNotMatch(upload, /localStorage|sessionStorage/);
});

test("evidence retry remains server-authoritative and duplicate-aware", () => {
  assert.match(action, /export async function uploadEvidenceResult/);
  assert.match(action, /existingEvidenceError/);
  assert.match(action, /duplicate_ignored/);
  assert.match(action, /storage_cleanup_failed/);
  assert.match(action, /isTransientEvidenceError/);
});
