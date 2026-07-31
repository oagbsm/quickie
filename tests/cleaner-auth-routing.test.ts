import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/cleaner/layout.tsx", import.meta.url), "utf8");
const signIn = readFileSync(new URL("../app/business/sign-in/SignInForm.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../lib/business/workspace.ts", import.meta.url), "utf8");
const businessAuth = readFileSync(new URL("../lib/business/auth.ts", import.meta.url), "utf8");
const continuation = readFileSync(new URL("../app/business/continue/page.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("../app/business/onboarding/page.tsx", import.meta.url), "utf8");
const turnoverPage = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");

test("active cleaners opening cleaner jobs are not sent to business onboarding", () => {
  assert.match(proxy, /startsWith\("\/cleaner"\)/);
  assert.match(layout, /status,invitation_status/);
  assert.doesNotMatch(layout, /business\/onboarding/);
  assert.match(workspace, /reason: "cleaner_account"/);
});

test("cleaner sign-in preserves the original turnover URL", () => {
  assert.match(proxy, /searchParams\.set\("next", request\.nextUrl\.pathname \+ request\.nextUrl\.search\)/);
  assert.match(signIn, /router\.push\(next\?\.startsWith/);
  assert.match(proxy, /startsWith\("\/cleaner"\)/);
});

test("operator onboarding guard does not run for cleaner-only accounts", () => {
  assert.match(onboarding, /w\.reason==="cleaner_account".*redirect\("\/cleaner\/today"\)/);
  assert.match(continuation, /workspace\.reason === "cleaner_account"/);
  assert.match(businessAuth, /workspace\.reason === "cleaner_account"/);
});

test("another cleaner cannot access an unassigned turnover", () => {
  assert.match(turnoverPage, /from\("work_items"\)/);
  assert.match(proxy, /!user/);
  assert.match(workspace, /eq\("user_id", user\.id\)/);
});

test("operators cannot act as cleaners", () => {
  assert.match(layout, /worker\.status !== "active"/);
  assert.match(turnoverPage, /transitionTurnover/);
  assert.match(workspace, /business_members/);
});

test("unauthenticated cleaner job URLs preserve next", () => {
  assert.match(proxy, /new URL\("\/business\/sign-in", request\.url\)/);
  assert.match(proxy, /request\.nextUrl\.pathname \+ request\.nextUrl\.search/);
  assert.match(layout, /business\/sign-in\?next=%2Fcleaner%2Ftoday/);
});

test("genuine unfinished business accounts still resolve into onboarding", () => {
  assert.match(continuation, /redirect\("\/business\/onboarding"\)/);
  assert.match(onboarding, /resolveBusinessWorkspace/);
  assert.match(workspace, /ensure_business_workspace/);
});
