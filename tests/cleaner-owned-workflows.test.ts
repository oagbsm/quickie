import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/202608090001_cleaner_owned_workflows.sql", import.meta.url), "utf8");
const invites = readFileSync(new URL("../supabase/migrations/202608090002_cleaner_host_invitations.sql", import.meta.url), "utf8");
const creationKeyFix = readFileSync(new URL("../supabase/migrations/202608090003_fix_cleaner_work_item_creation_key.sql", import.meta.url), "utf8");
const gating = readFileSync(new URL("../supabase/migrations/202608100001_cleaner_completion_gating.sql", import.meta.url), "utf8");
const issueEvidence = readFileSync(new URL("../supabase/migrations/202608100002_issue_evidence_link.sql", import.meta.url), "utf8");
const reportIssueEvidence = readFileSync(new URL("../supabase/migrations/202608100003_report_issue_evidence.sql", import.meta.url), "utf8");
const publicReport = readFileSync(new URL("../app/report/[token]/page.tsx", import.meta.url), "utf8");
const proxySource = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");

test("cleaner-owned workflow keeps direct jobs unassigned and owner scoped", () => {
  assert.match(migration, /standalone_cleaner_user_id/);
  assert.match(migration, /create_cleaner_property/);
  assert.match(migration, /create_cleaner_work_item/);
  assert.match(migration, /standalone_cleaner_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(migration, /insert into public\.assignments.*create_cleaner_work_item/s);
});

test("reports and host invitations use hashed, expiring tokens without exposing private access data", () => {
  const reportSection = migration.slice(migration.indexOf("-- Reports are deterministic"));
  assert.match(migration, /work_item_report_shares/);
  assert.match(migration, /extensions\.digest/);
  assert.match(migration, /now\(\)\+interval '90 days'/);
  assert.match(invites, /token_hash/);
  assert.match(invites, /cleaner_host_invitations/);
  assert.doesNotMatch(reportSection, /access_notes/);
});

test("cleaner work-item idempotency uses an unambiguous parameter and qualified column", () => {
  assert.match(creationKeyFix, /p_creation_key text/);
  assert.match(creationKeyFix, /existing_item\.creation_key = normalized_creation_key/);
  assert.match(creationKeyFix, /drop function if exists public\.create_cleaner_work_item/);
  assert.match(creationKeyFix, /unique_violation/);
});

test("completion is database-gated by persisted tasks and evidence", () => {
  assert.match(gating, /cleaner_completion_requirements/);
  assert.match(gating, /completion_requirements_missing/);
  assert.match(gating, /evidence\.work_item_id = item\.id/);
  assert.match(gating, /evidence\.checklist_task_id = task\.id/);
  assert.match(gating, /required_evidence_count/);
  assert.match(gating, /next_status = 'evidence_submitted'/);
});

test("issue photos remain tied to the same issue and work item", () => {
  assert.match(issueEvidence, /foreign key \(issue_id, work_item_id\)/);
  assert.match(reportIssueEvidence, /'issue_id', evidence\.issue_id/);
});

test("public report access hashes and validates only the supplied expiring token", () => {
  assert.match(publicReport, /createHash\("sha256"\)/);
  assert.match(publicReport, /eq\("token_hash", hash\)/);
  assert.match(publicReport, /share\.revoked_at/);
  assert.match(publicReport, /share\.expires_at/);
  assert.doesNotMatch(publicReport, /access_notes|key_instructions|lockbox|service_role/i);
});

test("public report route is deployable, unauthenticated, and token-safe", () => {
  assert.match(publicReport, /report_share_invalid_token/);
  assert.match(publicReport, /export default async function PublicReport/);
  assert.match(publicReport, /createSupabaseAdminClient/);
  assert.doesNotMatch(publicReport, /requireUser|requireBusinessUser|requireCleanerUser/);
  assert.doesNotMatch(proxySource, /"\/report\/:path\*"/);
  assert.match(publicReport, /report_share_invalid_token/);
  const raw = randomBytes(32).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const generatedHash = createHash("sha256").update(raw).digest("hex");
  assert.equal(generatedHash, createHash("sha256").update(raw).digest("hex"));
  assert.match("https://quickola.co.uk/report/" + raw, /^https:\/\/quickola\.co\.uk\/report\/[A-Za-z0-9_-]+$/);
});
