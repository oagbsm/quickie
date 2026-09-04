import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("app/messages/page.tsx");
const conversation = read("app/messages/[conversationId]/page.tsx");
const upload = read("app/api/marketplace/messages/route.ts");
const composer = read("app/messages/MessageComposer.tsx");
const migration = read("supabase/migrations/202608290002_marketplace_message_attachments.sql");
const idempotencyMigration = read("supabase/migrations/202609040008_marketplace_message_idempotency.sql");
const attachmentFixMigration = read("supabase/migrations/202609040009_fix_marketplace_message_attachment_conflict.sql");
const jobPage = read("app/work/jobs/[id]/page.tsx");
const conversationBubble = read("app/components/marketplace/MarketplaceMessageBubble.tsx");
const customerJobPage = read("app/jobs/[token]/page.tsx");
const customerJobActions = read("app/jobs/actions.ts");
const quoteState = read("lib/marketplace/customer-job-state.ts");
const workOffers = read("app/work/offers/page.tsx");
const workActions = read("app/work/actions.ts");
const quoteSubmissionMigration = read("supabase/migrations/202608290001_remove_unimplemented_provider_qualification_gate.sql");
const readNotificationsMigration = read("supabase/migrations/202609040001_marketplace_message_read_notifications.sql");
const transactionalEmail = read("lib/marketplace/email/transactional.ts");
const closedConversationMigration = read("supabase/migrations/202609040003_close_losing_marketplace_conversations.sql");
const conversationHelpers = read("lib/marketplace/conversations.ts");
const providerActions = read("app/work/actions.ts");
const providerPhoto = read("lib/marketplace/provider-photo.ts");
const customerMessagesList = read("app/messages/CustomerMessagesList.tsx");
const customerConversationPanel = read("app/messages/CustomerConversationPanel.tsx");
const promotionActions = read("app/messages/actions.ts");
const promoteButton = read("app/messages/PromoteContentButton.tsx");
const messageBubble = read("app/components/marketplace/MarketplaceMessageBubble.tsx");
const promotionMigration = read("supabase/migrations/202609040002_customer_conversation_job_promotions.sql");
const providerJobPage = read("app/work/jobs/[id]/page.tsx");
const customerJobPageForPromotions = read("app/jobs/[token]/page.tsx");
const myJobs = read("app/my-jobs/page.tsx");

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

test("customer conversation composer fits narrow mobile widths without changing send behavior", () => {
  assert.match(composer, /className="mt-4 grid min-w-0 gap-2"/);
  assert.match(composer, /className="flex min-w-0 gap-1\.5 sm:gap-2"/);
  assert.match(composer, /shrink-0 cursor-pointer/);
  assert.match(composer, /min-w-0 flex-1/);
  assert.match(composer, /type="submit" disabled=\{busy\}/);
  assert.match(composer, /fetch\("\/api\/marketplace\/messages"/);
  assert.match(composer, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(composer, /crypto\.randomUUID\(\)/);
  assert.match(upload, /clientMessageId/);
  assert.match(upload, /target_client_message_id/);
});

test("message submissions are idempotent for repeated client keys, including attachments", () => {
  const idempotency = read("supabase/migrations/202609040008_marketplace_message_idempotency.sql");
  assert.match(idempotency, /client_message_id uuid/);
  assert.match(idempotency, /marketplace_messages_client_submission_uidx/);
  assert.match(idempotency, /on conflict \(conversation_id, sender_id, client_message_id\)/);
  assert.match(idempotency, /client_message_id_required/);
  assert.match(idempotency, /client_attachment_index integer/);
  assert.match(upload, /ignoreDuplicates: true/);
  assert.match(upload, /client_attachment_index: clientMessageId \? index : null/);
  assert.match(upload, /upsert: true/);
  assert.match(upload, /existingAttachmentRows/);
  assert.match(upload, /protectedPaths/);
  assert.match(upload, /messageError/);
  assert.match(idempotencyMigration, /client_submission_uidx/);
  assert.match(attachmentFixMigration, /create unique index marketplace_message_attachments_client_submission_uidx/);
  assert.match(read("app/work/jobs/ProviderJobActions.tsx"), /event\.preventDefault\(\)/);
});

test("conversation bubbles keep sender alignment, safe wrapping, compact timestamps and bounded images", () => {
  assert.match(conversationBubble, /max-w-\[82%\]/);
  assert.match(conversationBubble, /ml-auto bg-\[#061b3f\]/);
  assert.match(conversationBubble, /break-words/);
  assert.match(conversationBubble, /max-h-48 max-w-full/);
  assert.match(conversationBubble, /text-\[10px\]/);
  assert.match(conversationBubble, /target="_blank"/);
});

test("customer job details resolve the public token to the internal job id and show bidder-backed offers", () => {
  assert.match(customerJobPage, /\.eq\("public_token", token\)/);
  assert.match(customerJobPage, /\.eq\("job_id", data\.id\)/);
  assert.match(customerJobPage, /getMarketplaceQuoteProviderId/);
  assert.match(customerJobPage, /\.in\("user_id", quoteProviderIds\)/);
  assert.match(customerJobPage, /Quotes \<span className=\"text-\[#657089\]\"\>\(\{quotes\.length\}\)\<\/span\>/);
  assert.doesNotMatch(customerJobPage, /Availability to confirm/);
});

test("customer offers and conversations use the same active statuses and internal job identity", () => {
  assert.match(quoteState, /ACTIVE_MARKETPLACE_OFFER_STATUSES = \["pending", "submitted", "selected", "accepted"\]/);
  assert.match(customerJobPage, /\.in\("status", \[\.\.\.ACTIVE_MARKETPLACE_OFFER_STATUSES\]\)/);
  assert.match(customerJobActions, /\.eq\("public_token", token\)/);
  assert.match(customerJobActions, /jobId: job\.id, providerId, actorUserId: user\.id, customerId: customer\.id/);
  assert.match(customerJobActions, /redirect\(`\/messages\/\$\{conversation\.id\}`\)/);
});

test("customer job navigation and conversation summaries stay distinct", () => {
  assert.match(myJobs, /conversationIds\.length === 1 \? `\/messages\/\$\{conversationIds\[0\]\}`/);
  assert.match(myJobs, /`\/messages\?job=\$\{job\.id\}`/);
  assert.match(customerJobPage, /Provider conversations/);
  assert.match(customerJobPage, /Question before quote/);
  assert.match(customerJobPage, /View conversation/);
  assert.match(customerJobPage, /Providers can ask questions before sending a quote/);
  assert.match(customerJobPage, /waiting \? "Waiting for quotes"/);
  assert.match(myJobs, /Waiting for quotes/);
  assert.match(myJobs, /activeQuotes\.length === 1 \? "quote" : "quotes"/);
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

test("message email notifications are claimed once per unread recipient episode", () => {
  assert.match(readNotificationsMigration, /customer_last_read_at/);
  assert.match(readNotificationsMigration, /provider_last_read_at/);
  assert.match(readNotificationsMigration, /customer_last_notified_at/);
  assert.match(readNotificationsMigration, /provider_last_notified_at/);
  assert.match(readNotificationsMigration, /for update;/);
  assert.match(readNotificationsMigration, /mark_marketplace_conversation_read/);
  assert.match(readNotificationsMigration, /claim_marketplace_message_email_notification/);
  assert.match(readNotificationsMigration, /last_notified_at is not null and/);
  assert.match(readNotificationsMigration, /last_read_at <= last_notified_at/);
  assert.match(readNotificationsMigration, /sender_id is distinct from recipient_user_id/);
  assert.match(conversation, /mark_marketplace_conversation_read/);
  assert.match(upload, /notifyFirstMarketplaceMessage\(conversationId, user\.id\)/);
  assert.match(transactionalEmail, /claim_marketplace_message_email_notification/);
  assert.match(transactionalEmail, /sourceId: notificationMessageId/);
  assert.match(transactionalEmail, /:\$\{notificationMessageId\}/);
});

test("customer provider avatars resolve private storage paths and keep a safe fallback", () => {
  assert.match(providerPhoto, /marketplace-provider-photos/);
  assert.match(providerPhoto, /createSignedUrl\(value, expiresIn\)/);
  assert.match(providerPhoto, /return error \? null : data\?\.signedUrl \|\| null/);
  assert.match(providerPhoto, /value\.startsWith\("\/"\)/);
  assert.match(providerPhoto, /protocol === "http:" \|\| url\.protocol === "https:"/);
  assert.match(index, /Promise\.all\(profileRows\.map\(async \(profile\) =>/);
  assert.match(index, /resolveProviderPhotoUrl\(admin, profile\.profile_photo_url\)/);
  assert.match(customerMessagesList, /profile\?\.profile_photo_url \? <img/);
  assert.match(customerMessagesList, /providerName\.slice\(0, 1\)\.toUpperCase\(\)/);
  assert.match(customerConversationPanel, /resolveProviderPhotoUrl\(admin, provider\?\.profile_photo_url\)/);
  assert.match(customerConversationPanel, /providerPhoto \? <img/);
  assert.match(conversation, /resolveProviderPhotoUrl\(admin, providerProfile\?\.profile_photo_url\)/);
});

test("selected-provider conversations remain writable while losing conversations are server-closed", () => {
  assert.match(conversationHelpers, /isMarketplaceConversationReadOnly/);
  assert.match(conversationHelpers, /in\("status", \["accepted", "selected"\]\)/);
  assert.match(closedConversationMigration, /conversation_closed/);
  assert.match(closedConversationMigration, /coalesce\(c\.provider_id, c\.bidder_user_id\) is distinct from coalesce\(q\.provider_id, q\.bidder_user_id\)/);
  assert.match(closedConversationMigration, /drop policy if exists "marketplace participants send messages"/);
  assert.match(upload, /isMarketplaceConversationReadOnly\(admin, conversationId\)/);
  assert.match(upload, /supabase\.rpc\("create_marketplace_message"/);
  assert.match(providerActions, /isMarketplaceConversationReadOnly\(admin, conversation\.id\)/);
  assert.match(customerConversationPanel, /readOnly=\{conversationReadOnly\}/);
  assert.match(conversation, /readOnly=\{conversationReadOnly\}/);
  assert.match(conversation, /isMarketplaceConversationReadOnly\(admin, conversationId\)/);
  assert.match(composer, /This conversation is closed because another provider was selected for this job/);
});

test("customer conversation content can be explicitly promoted into the job scope", () => {
  assert.match(promotionActions, /message\.sender_id !== user\.id/);
  assert.match(promotionActions, /conversation\.customer_id !== customer\.id/);
  assert.match(promotionActions, /eq\("message_id", message\.id\)/);
  assert.match(promotionActions, /marketplace-message-attachments/);
  assert.match(promotionActions, /marketplace-job-photos/);
  assert.match(promotionActions, /source_message_attachment_id: attachment\.id/);
  assert.match(promotionActions, /marketplace_job_detail_promotions/);
  assert.match(promotionActions, /code === "23505"/);
  assert.match(promotionMigration, /unique\(job_id, source_message_id\)/);
  assert.match(promotionMigration, /source_message_attachment_id uuid/);
  assert.match(providerJobPage, /marketplace_job_photos/);
  assert.match(providerJobPage, /optional_note/);
  assert.match(customerJobPageForPromotions, /marketplace_job_photos/);
  assert.match(messageBubble, /canPromote && isMine/);
  assert.match(messageBubble, /PromoteContentButton kind="photo"/);
  assert.match(messageBubble, /PromoteContentButton kind="detail"/);
  assert.match(promoteButton, /This \{kind === "photo" \? "photo" : "detail"\} will be added/);
  assert.match(promoteButton, /Add to job/);
  assert.match(promoteButton, /Add detail to job/);
});
