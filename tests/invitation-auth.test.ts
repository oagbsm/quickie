import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeInternalNextPath } from "../lib/app-url.ts";

const invitePage = readFileSync(new URL("../app/invite/[token]/page.tsx", import.meta.url), "utf8");
const credentials = readFileSync(new URL("../app/invite/[token]/InvitationCredentials.tsx", import.meta.url), "utf8");
const signIn = readFileSync(new URL("../app/business/sign-in/SignInForm.tsx", import.meta.url), "utf8");
const callback = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
const cleanerPage = readFileSync(new URL("../app/business/cleaners/[id]/page.tsx", import.meta.url), "utf8");
const copyInvite = readFileSync(new URL("../app/business/cleaners/CopyInviteLink.tsx", import.meta.url), "utf8");
const invitationGuard = readFileSync(new URL("../supabase/migrations/202607310001_sprint_2a_cleaner_security.sql", import.meta.url), "utf8");

test("signed-out invitation preserves its token through authentication", () => {
  assert.match(credentials, /business\/sign-in\?email=.*next=.*\/invite\//);
  assert.match(invitePage, /InvitationCredentials email=\{worker\.email\} token=\{token\}/);
});

test("invitation authentication returns to the original invite URL", () => {
  assert.match(credentials, /encodeURIComponent\(`\/invite\/\$\{token\}`\)/);
  assert.match(credentials, /encodeURIComponent\(email\)/);
  assert.match(callback, /nextQuery = encodeURIComponent\(next\)/);
  assert.match(callback, /business\/sign-in\?error=confirmation&next=\$\{nextQuery\}\$\{emailQuery\}/);
  assert.equal(safeInternalNextPath("/invite/secure-token"), "/invite/secure-token");
});

test("invited email can authenticate and accept the invitation", () => {
  assert.match(credentials, /auth\.signUp\(\{\s*email/);
  assert.match(signIn, /signInWithPassword/);
  assert.match(actions, /accept_worker_invitation/);
  assert.match(actions, /raw_token: token/);
});

test("wrong-email authentication remains blocked at acceptance", () => {
  assert.match(invitePage, /Invited email/);
  assert.match(credentials, /value=\{email\} readOnly/);
  assert.match(invitationGuard, /invitation_email_mismatch/);
});

test("operator sign-up is not shown as the cleaner invitation path", () => {
  assert.match(signIn, /invitationPath/);
  assert.match(signIn, /!invitationPath &&/);
  assert.match(credentials, /New to Quickola\? Create credentials/);
});

test("expired and used invitations fail safely", () => {
  assert.match(invitePage, /state === "expired"/);
  assert.match(invitePage, /state === "accepted"/);
  assert.match(invitationGuard, /invitation_invalid/);
  assert.match(actions, /if \(error\) redirect\(`\/invite\/\$\{token\}\?error=invalid`\)/);
});

test("manual invite copy constructs only the active invitation URL", () => {
  assert.match(copyInvite, /new URL\(`\/invite\/\$\{encodeURIComponent\(inviteToken\)\}/);
  assert.doesNotMatch(copyInvite, /cleaner\/turnovers/);
  assert.match(cleanerPage, /eq\("token_hash", tokenHash\)/);
  assert.match(cleanerPage, /is\("accepted_at", null\)/);
  assert.match(cleanerPage, /is\("revoked_at", null\)/);
  assert.match(cleanerPage, /CopyInviteLink inviteToken=\{manualInvite\.token\}/);
});
