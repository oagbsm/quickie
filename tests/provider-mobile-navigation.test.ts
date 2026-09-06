import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const nav = readFileSync(new URL("../app/components/marketplace/ProviderMobileBottomNav.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../app/components/marketplace/ProviderHeader.tsx", import.meta.url), "utf8");
const providerMessages = readFileSync(new URL("../app/messages/page.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("../app/work/onboarding/OnboardingForm.tsx", import.meta.url), "utf8");
const pendingReview = readFileSync(new URL("../app/work/onboarding/PendingReview.tsx", import.meta.url), "utf8");

test("provider mobile navigation covers the workspace and nested routes", () => {
  for (const route of ["/work", "/work/offers", "/work/messages", "/work/payments", "/work/profile"]) assert.match(nav, new RegExp(route.replaceAll("/", "\\/")));
  assert.match(nav, /path\.startsWith\("\/work\/jobs\/"\)/);
  assert.match(nav, /path\.startsWith\("\/work\/messages\/"\)/);
  assert.match(nav, /aria-current=\{active \? "page"/);
  assert.match(nav, /env\(safe-area-inset-bottom\)/);
  assert.match(nav, /sm:hidden/);
});

test("approved provider header owns the mobile nav while restricted onboarding does not", () => {
  assert.match(header, /workspaceAccess/);
  assert.match(header, /workspaceAccess && <ProviderMobileBottomNav/);
  assert.match(header, /unreadCount=\{unreadCount\}/);
  assert.doesNotMatch(onboarding, /ProviderMobileBottomNav/);
  assert.doesNotMatch(pendingReview, /ProviderMobileBottomNav/);
});

test("provider messages do not render the customer bottom navigation", () => {
  assert.match(providerMessages, /<ProviderHeader \/>/);
  assert.doesNotMatch(providerMessages, /<MobileBottomNav/);
  assert.match(providerMessages, /providerOnly \? "/);
});
