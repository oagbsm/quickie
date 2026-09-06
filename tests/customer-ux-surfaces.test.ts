import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const myJobs = fs.readFileSync("app/my-jobs/page.tsx", "utf8");
const providerNav = fs.readFileSync("app/components/marketplace/ProviderHeaderNavigation.tsx", "utf8");
const onboarding = fs.readFileSync("app/work/onboarding/OnboardingForm.tsx", "utf8");
const onboardingPage = fs.readFileSync("app/work/onboarding/page.tsx", "utf8");
const conversation = fs.readFileSync("app/messages/CustomerConversationPanel.tsx", "utf8");

test("my jobs derives unread customer messages from existing read timestamps", () => {
  assert.match(myJobs, /customer_last_read_at/);
  assert.match(myJobs, /message\.sender_id !== user\.id/);
  assert.match(myJobs, /New message/);
  assert.match(myJobs, /unreadConversationIds\.length === 1 \? `\/messages\//);
  assert.match(myJobs, /\/messages\?job=\$\{item\.job\.id\}/);
  assert.match(conversation, /mark_marketplace_conversation_read/);
});

test("privacy notice is not provider top navigation and remains onboarding-only informational copy", () => {
  assert.doesNotMatch(providerNav, /href="\/privacy-policy"/);
  assert.match(onboarding, /step === 3 && <p[^>]*>Please also read our .*href="\/privacy-policy"/);
  assert.doesNotMatch(onboarding, /I accept the Privacy|consent to the Privacy|I consent to the Privacy/);
  assert.match(onboardingPage, /initialStep === 3/);
});
