import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("app/messages/page.tsx");
const conversation = read("app/messages/[conversationId]/page.tsx");
const upload = read("app/api/marketplace/messages/route.ts");
const composer = read("app/messages/MessageComposer.tsx");
const migration = read("supabase/migrations/202608290002_marketplace_message_attachments.sql");
const jobPage = read("app/work/jobs/[id]/page.tsx");
const conversationBubble = read("app/components/marketplace/MarketplaceMessageBubble.tsx");
const customerJobPage = read("app/jobs/[token]/page.tsx");
const customerJobActions = read("app/jobs/actions.ts");
const quoteState = read("lib/marketplace/customer-job-state.ts");
const workOffers = read("app/work/offers/page.tsx");
const workActions = read("app/work/actions.ts");
const quoteSubmissionMigration = read("supabase/migrations/202608290001_remove_unimplemented_provider_qualification_gate.sql");

test("provider messaging stays on provider routes while customer routes remain separate", () => {
  assert.ok(index.includes('providerOnly ? "/work/messages"'));
  assert.ok(index.includes('isProvider ? `/work/messages/${conversation.id}` : `/messages/${conversation.id}`'));
  assert.match(conversation, /providerOnly && account\.role !== "provider"/);
  assert.match(conversation, /conversation\.provider_id === provider\.providerId/);
  assert.match(conversation, /providerOnly \? requireProviderWorkspaceAccess/);
});

test("message attachments are private, validated, and participant-authorized", () => {
  assert.match(upload, /marketplace-message-attachments/);
  assert.match(upload, /ALLOWED_TYPES/);
  assert.match(upload, /attachmentMeta/);
  assert.match(upload, /file\.size > MAX_FILE_SIZE/);
  assert.match(upload, /!isProvider && !isCustomer/);
  assert.ok(upload.includes("${conversationId}/${user.id}"));
  assert.match(composer, /multiple/);
  assert.match(composer, /image\/jpeg,image\/png,image\/webp/);
  assert.match(composer, /new FormData\(\)/);
  assert.match(composer, /formData\.append\("attachments", file, file\.name\)/);
  assert.match(conversation, /createSignedUrl\(attachment\.storage_path/);
  assert.match(conversation, /MarketplaceMessageBubble/);
  assert.match(conversation, /marketplace_providers/);
  assert.match(conversation, /\/providers\/\$\{conversationProviderId\}/);
  assert.match(conversation, /providerName/);
  assert.match(conversationBubble, /hasBody/);
  assert.match(jobPage, /marketplace_message_attachments/);
  assert.match(jobPage, /MarketplaceMessageBubble/);
  assert.match(migration, /public\.marketplace_message_attachments/);
  assert.ok(migration.includes("false, 5242880"));
  assert.match(migration, /conversation participants view message attachments/);
});

test("messages may contain text, images, or both but not neither", () => {
  assert.match(upload, /rawFiles\.filter\(\(value\): value is File => value instanceof File\)/);
  assert.match(upload, /!body && files\.length === 0/);
  assert.match(upload, /body: body \|\| null/);
  assert.match(migration, /body is null or length\(trim\(body\)\) between 1 and 4000/);
});

test("customer job details resolve the public token to the internal job id and show bidder-backed offers", () => {
  assert.match(customerJobPage, /\.eq\("public_token", token\)/);
  assert.match(customerJobPage, /\.eq\("job_id", data\.id\)/);
  assert.match(customerJobPage, /getMarketplaceQuoteProviderId/);
  assert.match(customerJobPage, /\.in\("user_id", quoteProviderIds\)/);
  assert.match(customerJobPage, /Offers \<span className=\"text-\[#657089\]\"\>\(\{quotes\.length\}\)\<\/span\>/);
  assert.doesNotMatch(customerJobPage, /Availability to confirm/);
});

test("customer offers and conversations use the same active statuses and internal job identity", () => {
  assert.match(quoteState, /ACTIVE_MARKETPLACE_OFFER_STATUSES = \["pending", "submitted", "selected", "accepted"\]/);
  assert.match(customerJobPage, /\.in\("status", \[\.\.\.ACTIVE_MARKETPLACE_OFFER_STATUSES\]\)/);
  assert.match(customerJobActions, /\.eq\("public_token", token\)/);
  assert.match(customerJobActions, /jobId: job\.id, providerId, actorUserId: user\.id, customerId: customer\.id/);
  assert.match(customerJobActions, /redirect\(`\/messages\/\$\{conversation\.id\}`\)/);
});

test("provider My Work includes bidder-backed quotes and preserves offer lifecycle states", () => {
  assert.match(workOffers, /\.or\(`provider_id\.eq\.\$\{provider\.providerId\},bidder_user_id\.eq\.\$\{provider\.providerId\}`\)/);
  assert.match(workOffers, /marketplace_jobs\(service,service_subtype,postcode,requested_timing\)/);
  assert.match(workOffers, /marketplace_bookings/);
  for (const status of ["pending", "submitted", "accepted", "selected", "declined", "withdrawn", "expired"]) assert.match(workOffers, new RegExp(status));
  assert.match(workOffers, /href=\{`\/work\/jobs\/\$\{offer\.job_id\}`\}/);
  assert.match(workOffers, /href=\{`\/work\/messages\/\$\{conversation\}`\}/);
  assert.match(workActions, /submit_marketplace_quote/);
  assert.match(quoteSubmissionMigration, /insert into public\.marketplace_quotes\(job_id, provider_id, bidder_user_id/);
  assert.match(quoteSubmissionMigration, /auth\.uid\(\), quote_amount/);
  assert.doesNotMatch(workOffers, /cleaner_profiles/);
});
