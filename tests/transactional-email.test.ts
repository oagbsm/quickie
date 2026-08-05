import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202607310002_transactional_email_deliveries.sql", import.meta.url), "utf8");
const mailer = readFileSync(new URL("../lib/server/business-notifications.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");

test("invitation email is attempted after invitation creation and resend", () => {
  assert.match(actions, /sendCleanerInvitationEmail/);
  assert.match(mailer, /eventType: "cleaner_invitation"/);
  assert.match(mailer, /Accept invitation/);
});

test("invitation delivery results are classified without using sent=false as failure proof", () => {
  const addWorkerStart = actions.indexOf("export async function addWorker");
  const turnoverWorkerStart = actions.indexOf("export async function addWorkerForTurnover");
  const addWorker = actions.slice(addWorkerStart, turnoverWorkerStart);
  assert.match(mailer, /status: "sent"/);
  assert.match(mailer, /status: "failed"/);
  assert.match(mailer, /status: "skipped"/);
  assert.match(addWorker, /created\.deliveryStatus === "failed"/);
  assert.match(addWorker, /created\.deliveryStatus === "skipped"/);
  assert.doesNotMatch(addWorker, /if \(!created\.deliverySent\)/);
  assert.match(addWorker, /created\.deliveryReason === "already_sent" \? "already_sent" : "processing"/);
  assert.match(addWorker, /email=\$\{emailState\}/);
  assert.match(addWorker, /email=sent/);
});

test("onboarding defers only delivery while preserving the invitation generation", () => {
  assert.match(actions, /after\(async \(\) => \{\s*const \{ data: account \} = await accountPromise/);
  assert.match(actions, /target_token_hash: tokenHash/);
  assert.match(actions, /worker_invitations/);
  assert.match(actions, /deliveryDeferred: true/);
  assert.match(actions, /delivery: created\.deliveryDeferred \? "queued" : "email"/);
});

test("shared delivery diagnostics expose safe configuration and provider state", () => {
  assert.match(mailer, /resend_api_key_present: Boolean\(apiKey\)/);
  assert.match(mailer, /configured_from_address: from \? senderAddress\(from\) : null/);
  assert.match(mailer, /resend_from_email_present: Boolean\(from\)/);
  assert.match(mailer, /supabase_service_role_key_present: Boolean\(process\.env\.SUPABASE_SERVICE_ROLE_KEY\)/);
  assert.match(mailer, /supabase_service_role_key_missing/);
  assert.match(mailer, /deliveryId/);
  assert.match(mailer, /sendAttempted/);
  assert.match(mailer, /skippedDueToIdempotency/);
  assert.match(mailer, /providerAccepted/);
  assert.match(mailer, /providerMessageId/);
  assert.match(mailer, /safeProviderMessage/);
  assert.doesNotMatch(mailer, /console\.(info|error)\([^\n]*(apiKey|invitationToken|password)/);
});

test("failed delivery retry claims are atomic and do not duplicate sends", () => {
  assert.match(mailer, /eq\("delivery_status", "failed"\)[\s\S]*select\("id"\)[\s\S]*maybeSingle\(\)/);
  assert.match(mailer, /if \(!claimed\)[\s\S]*delivery_in_progress/);
});

test("development email diagnostic uses the shared assignment sender and server guard", () => {
  assert.match(actions, /export async function sendTestCleanerEmail/);
  assert.match(actions, /process\.env\.NODE_ENV !== "development"/);
  assert.match(actions, /requireBusinessUser\(\)/);
  assert.match(actions, /sendCleanerAssignmentEmail/);
  assert.match(actions, /development_test_cleaner:/);
});

test("assignment email is idempotent per assignment", () => {
  assert.match(actions, /sendCleanerAssignmentEmail/);
  assert.match(mailer, /eventType: "turnover_assigned"/);
  assert.match(mailer, /turnover_assigned:\$\{turnoverId\}:\$\{assignmentId \|\| workerId\}/);
  assert.match(actions, /assignmentId: assigned\.id/);
  assert.match(migration, /idempotency_key text not null unique/);
});

test("repeated transitions do not duplicate accepted, declined, or arrived mail", () => {
  assert.match(actions, /turnover_\$\{id\}:\$\{next\}/);
  assert.match(actions, /\["accepted", "declined", "arrived"\]/);
});

test("action-required mail is deduplicated by blocker state", () => {
  assert.match(actions, /action_required:\$\{id\}:\$\{blockerKey\}/);
  assert.match(actions, /action_required:issue:\$\{issue\.id\}/);
});

test("property-ready mail sends through the same delivery wrapper once", () => {
  assert.match(actions, /property_ready:\$\{id\}/);
  assert.match(actions, /turnover\.status === "ready"/);
  assert.match(actions, /eventType: "property_ready"/);
});

test("email failure is isolated from business actions", () => {
  assert.match(mailer, /catch \{ \/\* email failure must not affect the business action \*\//);
  assert.match(mailer, /delivery_status: "failed"/);
  assert.match(actions, /await sendOperatorTurnoverEmail/);
});

test("cleaner invitation email diagnostics do not include secrets or raw tokens", () => {
  assert.match(mailer, /response\.status/);
  assert.match(mailer, /const failureCategory = error instanceof Error/);
  assert.doesNotMatch(mailer, /console\.error\([^\n]*apiKey/);
  assert.doesNotMatch(mailer, /console\.error\([^\n]*invitationToken/);
  assert.match(mailer, /recipientDomain/);
  assert.match(actions, /const normaliseEmail =/);
});

test("failed invitation deliveries can be retried without reusing a successful send", () => {
  assert.match(mailer, /previous\.delivery_status === "sent"/);
  assert.match(mailer, /previous\.delivery_status === "pending"/);
  assert.match(mailer, /delivery_status: "pending", error_category: null/);
  assert.match(mailer, /resend_api_key_invalid/);
  assert.match(mailer, /sender_domain_not_verified/);
});

test("reset auth users can receive a new invitation generation without weakening active deduplication", () => {
  assert.match(actions, /select\("id,user_id,invitation_status"\)/);
  assert.match(actions, /activeInvitation/);
  assert.match(actions, /existingWorker\.invitation_status === "accepted" && existingWorker\.user_id/);
  assert.match(mailer, /cleaner_invitation:\$\{workerId\}:\$\{tokenHash\}/);
});

test("links use the configured application origin", () => {
  assert.match(mailer, /const site = transactionalEmailOrigin\(\)/);
  assert.match(mailer, /site}\/cleaner\/turnovers/);
  assert.match(mailer, /site}\/business\/turnovers/);
});

test("all Resend payloads use the configured sender and reply-to", () => {
  assert.match(mailer, /getResendFromEmail/);
  assert.match(mailer, /getResendReplyToEmail/);
  assert.match(mailer, /reply_to: replyTo \|\| undefined/);
});

test("invitation tokens are hashed and never stored in delivery records", () => {
  assert.match(mailer, /crypto\.createHash\("sha256"\)/);
  assert.match(mailer, /idempotencyKey: `cleaner_invitation:\$\{workerId\}:\$\{tokenHash\}`/);
  assert.doesNotMatch(migration, /token/);
});

test("delivery records are account-scoped and recipients come from account data", () => {
  assert.match(migration, /account_id uuid not null references public\.business_accounts/);
  assert.match(mailer, /ownerEmail\(accountId\)/);
  assert.match(mailer, /eq\("account_id", accountId\)/);
});

test("operator notification payloads include workflow context", () => {
  assert.match(mailer, /propertyName/);
  assert.match(mailer, /cleanerName/);
  assert.match(mailer, /turnoverDate/);
  assert.match(mailer, /Open turnover/);
});
