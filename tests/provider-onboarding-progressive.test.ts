import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/work/page.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("../app/work/onboarding/OnboardingForm.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/work/onboarding/actions.ts", import.meta.url), "utf8");
const access = readFileSync(new URL("../lib/marketplace/provider-access.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/202608280001_provider_browse_eligibility.sql", import.meta.url), "utf8");
const operationalMigration = readFileSync(new URL("../supabase/migrations/202608220003_provider_operational_eligibility.sql", import.meta.url), "utf8");
const qualificationCompatibility = readFileSync(new URL("../supabase/migrations/202608290001_remove_unimplemented_provider_qualification_gate.sql", import.meta.url), "utf8");
const profile = readFileSync(new URL("../app/work/profile/page.tsx", import.meta.url), "utf8");

test("provider onboarding separates Maidenhead browsing from quote readiness", () => {
  assert.match(onboarding, /Basic profile/);
  assert.match(onboarding, /Continue to quote readiness/);
  assert.match(onboarding, /Quote readiness/);
  assert.doesNotMatch(onboarding, /Where do you work|Select one or more postcode districts/);
  assert.match(actions, /base_town: "Maidenhead"/);
  assert.match(actions, /MAIDENHEAD_MARKET_POSTCODE_DISTRICTS/);
});

test("browsing uses a separate server-side gate and RPC", () => {
  assert.match(access, /canProviderBrowseJobs/);
  assert.match(page, /get_marketplace_browse_opportunities/);
  assert.match(migration, /marketplace_provider_can_browse/);
  assert.match(migration, /get_marketplace_browse_opportunities/);
  assert.match(migration, /SL6/);
  assert.match(migration, /ps\.category_slug = j\.service/);
  assert.match(migration, /ps\.job_type_slug = j\.service_subtype/);
});

test("strict quote and regulated qualification gates remain present", () => {
  assert.match(actions, /provider_terms_accepted_at/);
  assert.match(access, /stripeStatus === "ready"/);
  assert.match(operationalMigration, /provider_status = 'approved'/);
  assert.match(operationalMigration, /stripe_status = 'ready'/);
  assert.match(operationalMigration, /marketplace_active = true/);
  assert.match(operationalMigration, /qualification_verified/);
});

test("unimplemented qualification checks do not block provider quoting or profile UX", () => {
  assert.match(qualificationCompatibility, /qualification_verified/);
  assert.doesNotMatch(qualificationCompatibility, /or ps\.qualification_verified/);
  assert.doesNotMatch(profile, /Service requirements|Checks needed for|Contact Quickola/);
  assert.match(profile, /Payouts/);
  assert.match(profile, /Services/);
  assert.match(onboarding, /quoteReadinessComplete = readyToSubmit/);
  assert.match(access, /isProviderReadyToSubmit/);
  assert.doesNotMatch(onboarding, /qualification verification for selected regulated work/);
});

test("quote readiness autosaves mutable items and removes the generic save action", () => {
  assert.match(actions, /export async function updateProviderTerms/);
  assert.match(actions, /export async function uploadProviderProfilePhoto/);
  assert.match(onboarding, /updateProviderTerms/);
  assert.match(onboarding, /uploadProviderProfilePhoto/);
  assert.match(onboarding, /handleTermsChange/);
  assert.match(onboarding, /handlePhotoChange/);
  assert.doesNotMatch(onboarding, /Save setup/);
});

test("quote readiness uses one status-driven payout action and hides submission when unavailable", () => {
  assert.match(onboarding, /!payoutReady && !payoutVerifying/);
  assert.match(onboarding, /Continue payout setup/);
  assert.match(onboarding, /const canSubmit = \["draft", "action_required"\]/);
  assert.match(onboarding, /Almost done/);
  assert.match(onboarding, /Everything is ready/);
  assert.match(onboarding, /Submit for review/);
  assert.match(onboarding, /!canSubmit &&/);
  assert.match(onboarding, /Service area/);
  assert.match(onboarding, /choose where you work/);
  assert.match(onboarding, /Confirmed email/);
  assert.doesNotMatch(onboarding, /start sending quotes/);
  assert.match(onboarding, /Payout details received — verification in progress/);
  assert.match(onboarding, /Payout setup needs more information/);
  assert.doesNotMatch(onboarding, /Payout status refreshed/);
  assert.doesNotMatch(onboarding, /Approval —/);
});

test("Stripe return refreshes status before rendering onboarding", () => {
  assert.match(readFileSync(new URL("../app/work/onboarding/page.tsx", import.meta.url), "utf8"), /\["return", "refresh", "checked"\]\.includes\(query\.payouts/);
  assert.match(readFileSync(new URL("../app/work/onboarding/page.tsx", import.meta.url), "utf8"), /refreshProviderPayoutStatus\(providerId\)/);
  assert.match(readFileSync(new URL("../app/work/onboarding/page.tsx", import.meta.url), "utf8"), /profileComplete/);
  assert.match(readFileSync(new URL("../app/work/onboarding/page.tsx", import.meta.url), "utf8"), /displayError/);
});

test("profile photo picker is only visible when needed or explicitly changed", () => {
  assert.match(onboarding, /const \[photoPickerOpen, setPhotoPickerOpen\] = useState\(!photoUrl\)/);
  assert.match(onboarding, /\{\(!hasPhoto \|\| photoPickerOpen\) &&/);
  assert.match(onboarding, /hasPhoto && !photoPickerOpen/);
  assert.match(onboarding, /Change photo/);
  assert.match(onboarding, /setPhotoPickerOpen\(false\)/);
  assert.match(onboarding, /if \(photoSaving\) return/);
  assert.match(onboarding, /disabled=\{photoSaving\}/);
});

test("submitted provider states do not reopen editable onboarding", () => {
  const page = readFileSync(new URL("../app/work/onboarding/page.tsx", import.meta.url), "utf8");
  const status = readFileSync(new URL("../app/work/onboarding/PendingReview.tsx", import.meta.url), "utf8");
  const pendingScreen = status.slice(status.indexOf("PROVIDER APPLICATION"));
  assert.match(actions, /redirect\("\/work\/onboarding"\);/);
  assert.match(page, /provider\.providerStatus === "pending_review"/);
  assert.match(page, /<PendingReview/);
  assert.match(status, /You’re all signed up!/);
  assert.match(status, /Awaiting Quickola approval/);
  assert.doesNotMatch(pendingScreen, /View available jobs/);
  assert.doesNotMatch(pendingScreen, /Submit for review|Change photo|Set up payouts|Refresh payouts|Save setup|form action/);
  assert.match(status, /You’re approved/);
  assert.match(status, /status === "suspended"/);
  assert.match(onboarding, /\["draft", "action_required"\]\.includes\(status\)/);
});

test("approved providers can repair readiness from profile without workspace lockout", () => {
  const access = readFileSync(new URL("../lib/marketplace/provider-access.ts", import.meta.url), "utf8");
  const profile = readFileSync(new URL("../app/work/profile/page.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/work/actions.ts", import.meta.url), "utf8");
  assert.match(access, /requireProviderOperationalAccess/);
  assert.match(access, /provider\.providerStatus !== "approved"/);
  assert.match(profile, /Your profile/);
  assert.match(profile, /Set up payouts/);
  assert.match(profile, /returnPath.*\/work\/profile/);
  assert.match(actions, /requireProviderOperationalAccess/);
});

test("profile submission CTA follows the same readiness and lifecycle rules as onboarding", () => {
  assert.match(profile, /isProviderReadyToSubmit\(provider\.profile/);
  assert.match(profile, /\["draft", "action_required"\]\.includes\(provider\.providerStatus\) && profileReadyToSubmit/);
  assert.match(profile, /form action=\{submitProviderApplication\}/);
  assert.match(profile, /Everything is ready/);
  assert.match(profile, /Finish your setup before submitting for review/);
  assert.match(profile, /provider\.providerStatus === "approved"/);
  assert.match(onboarding, /\["draft", "action_required"\]\.includes\(status\)/);
  assert.match(onboarding, /formAction=\{submitProviderApplication\}/);
  assert.match(actions, /isProviderReadyToSubmit\(profile, servicesCount \|\| 0, areasCount \|\| 0/);
  assert.match(actions, /to_status: "pending_review"/);
  assert.match(actions, /redirect\("\/work\/onboarding"\)/);
});
