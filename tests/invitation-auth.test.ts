import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PRODUCTION_ORIGIN,
  resolveAppOrigin,
  safeInternalNextPath,
} from "../lib/app-url.ts";
import {
  isStaleSupabaseSessionError,
  supabaseAuthCookieNames,
} from "../lib/supabase/auth-recovery.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const invitePage = read("../app/invite/[token]/page.tsx");
const credentials = read(
  "../app/invite/[token]/InvitationCredentials.tsx",
);
const invitationActions = read("../app/invite/[token]/actions.ts");
const invitationLookup = read("../lib/server/cleaner-invitations.ts");
const callback = read("../app/auth/callback/route.ts");
const proxy = read("../proxy.ts");
const notifications = read("../lib/server/business-notifications.ts");
const browserAuth = read("../lib/supabase/browser.ts");
const businessSignIn = read("../app/business/sign-in/SignInForm.tsx");
const roleExclusivity = read(
  "../supabase/migrations/202608010002_portal_role_exclusivity.sql",
);
const existingUserMigration = read(
  "../supabase/migrations/202608040002_existing_user_cleaner_invitations.sql",
);
const invitationRpc = read(
  "../supabase/migrations/202607310001_sprint_2a_cleaner_security.sql",
);
const oldBusinessActions = read("../app/business/str-actions.ts");
const legacyInviteRoute = read("../app/team/invite/[token]/page.tsx");

test("new cleaner creates a confirmed account and accepts without verification email", () => {
  assert.match(invitationActions, /admin\.auth\.admin\.createUser/);
  assert.match(invitationActions, /email_confirm: true/);
  assert.match(invitationActions, /account_kind: "quickola_cleaner"/);
  assert.doesNotMatch(invitationActions, /sendCleanerVerificationEmail|generateLink/);
  assert.doesNotMatch(credentials, /Verify your email to continue/);
  assert.match(credentials, /credentials_created/);
});

test("existing cleaner signs in, accepts once, and lands on cleaner today", () => {
  const submitIndex = credentials.indexOf("async function submit");
  const signInIndex = credentials.indexOf("signInWithPassword", submitIndex);
  const acceptIndex = credentials.indexOf(
    "const accepted = await acceptCleanerInvitation",
    signInIndex,
  );
  assert.ok(signInIndex >= 0);
  assert.ok(acceptIndex > signInIndex);
  assert.match(credentials, /window\.location\.replace\("\/cleaner\/today"\)/);
  assert.match(invitationActions, /rpc\("accept_worker_invitation"/);
  assert.match(invitationActions, /confirmed_name: invitation\.workerName/);
  assert.doesNotMatch(oldBusinessActions, /acceptWorkerInvitation/);
});

test("existing accounts use the invitation acceptance path instead of signup", () => {
  assert.match(credentials, /signInWithPassword/);
  assert.match(invitationActions, /email_exists|user_already_exists/);
  assert.match(oldBusinessActions, /const normalisedEmail = normaliseEmail/);
  assert.doesNotMatch(oldBusinessActions, /auth\.admin\.createUser/);
  assert.match(existingUserMigration, /drop index if exists public\.workers_user_id_unique/);
  assert.match(existingUserMigration, /workers_user_account_unique/);
  assert.match(existingUserMigration, /quickola\.accepting_cleaner_invitation/);
  assert.match(existingUserMigration, /business_user_cannot_become_cleaner/);
});

test("invitation callback remains safe while creation does not depend on verification", () => {
  assert.match(callback, /purpose !== "signup_confirmation"[\s\S]*return new URL\(next, appOrigin\)/);
  assert.match(callback, /next\.startsWith\("\/invite\/"\)/);
  assert.equal(safeInternalNextPath("/invite/secure_token"), "/invite/secure_token");
  assert.doesNotMatch(invitationActions, /token_hash|verification_type/);
  assert.doesNotMatch(callback, /new URL\("\/", appOrigin\)/);
});

test("a valid invitation renders from its token before optional auth inspection", () => {
  const invitationLookupIndex = invitePage.indexOf("getCleanerInvitation(token)");
  const sessionIndex = invitePage.indexOf("resolvePortalSession()");
  assert.ok(invitationLookupIndex >= 0);
  assert.ok(sessionIndex > invitationLookupIndex);
  assert.match(invitePage, /if \(invitation\?\.state === "valid"\)/);
  assert.match(invitePage, /valid && !session\?\.user/);
  assert.doesNotMatch(invitePage, /Promise\.all\(\[\s*getCleanerInvitation/);
  assert.doesNotMatch(invitePage, /We couldn’t verify your session|Refresh this page/);
});

test("valid invite, stale cookie, and signed-in account states remain actionable", () => {
  assert.match(proxy, /isStaleSupabaseSessionError/);
  assert.match(proxy, /request\.cookies\.delete\(name\)/);
  assert.match(invitePage, /A malformed\/stale cookie must not block a valid invitation/);
  assert.match(invitePage, /InvitationAcceptButton/);
  assert.doesNotMatch(invitePage, /InvitationAutoAccept/);
  assert.match(invitePage, /session\?\.user && !emailMatches/);
});

test("invited email remains authoritative and wrong accounts are recoverable", () => {
  assert.match(
    invitationActions,
    /session\.user\.email\?\.trim\(\)\.toLowerCase\(\) !==\s*invitation\.invitedEmail/,
  );
  assert.match(
    credentials,
    /This invitation was sent to \{email\}\. Sign in with that email\./,
  );
  assert.match(invitationRpc, /invitation_email_mismatch/);
  assert.match(credentials, /scope: "local"/);
  assert.match(credentials, /\/invite\/\$\{encodeURIComponent\(token\)\}/);
});

test("expired, used, revoked, and malformed invitations fail safely", () => {
  assert.match(invitationLookup, /"expired"/);
  assert.match(invitationLookup, /"accepted"/);
  assert.match(invitationLookup, /"invalid"/);
  assert.ok(invitationLookup.includes("/^[A-Za-z0-9_-]{32,128}$/"));
  assert.match(
    invitePage,
    /This invitation has expired\. Ask \{invitation\.businessName\} to/,
  );
  assert.match(invitationRpc, /invitation_invalid/);
  assert.match(invitationRpc, /invitation_already_accepted/);
  assert.doesNotMatch(invitePage, /error\.message|stack|Refresh Token/);
});

test("invitation acceptance links the worker to the authenticated user atomically", () => {
  assert.match(invitationRpc, /set user_id=auth\.uid\(\)/);
  assert.match(invitationRpc, /accepted_at=now\(\)/);
  assert.match(invitationRpc, /lower\(worker\.email\).*signed_in_email/);
  assert.match(roleExclusivity, /reject_cross_portal_role_write/);
  assert.match(existingUserMigration, /set user_id = auth\.uid\(\)/);
  assert.match(existingUserMigration, /worker\.user_id = auth\.uid\(\) then return worker\.id/);
  assert.match(existingUserMigration, /worker_already_linked/);
});

test("cleaner invitation never provisions or enters operator onboarding", () => {
  assert.doesNotMatch(invitationActions, /ensure_business_workspace/);
  assert.doesNotMatch(invitationActions, /quickola_business/);
  assert.doesNotMatch(invitePage, /business\/sign-up|business\/onboarding/);
  assert.doesNotMatch(credentials, /business\/sign-up|Create account/);
  assert.doesNotMatch(invitationActions, /if \(session\.portal\)/);
  assert.match(roleExclusivity, /business_portal_role_required/);
});

test("invitation email is cleaner-focused and production URLs cannot be localhost", () => {
  assert.match(
    notifications,
    /You’ll receive cleaning jobs from \$\{escapeHtml\(workspaceName\)\} through Quickola\./,
  );
  assert.doesNotMatch(notifications, /does not employ or pay you/);
  assert.match(notifications, /buildAbsoluteAppUrl/);
  assert.equal(
    resolveAppOrigin({
      nodeEnv: "production",
      siteUrl: "http://localhost:3000",
    }),
    PRODUCTION_ORIGIN,
  );
  assert.equal(
    resolveAppOrigin({
      nodeEnv: "production",
      vercelUrl: "localhost:3000",
    }),
    PRODUCTION_ORIGIN,
  );
});

test("the canonical invitation route is /invite and legacy team links redirect", () => {
  assert.match(notifications, /buildAbsoluteAppUrl\(`\/invite\//);
  assert.match(legacyInviteRoute, /redirect\(`\/invite\/\$\{encodeURIComponent\(token\)\}`\)/);
});

test("stale refresh sessions are cleared without provider errors", () => {
  for (const error of [
    { code: "refresh_token_not_found" },
    { code: "refresh_token_already_used" },
    { code: "session_not_found" },
    { message: "Invalid Refresh Token: Refresh Token Not Found" },
  ])
    assert.equal(isStaleSupabaseSessionError(error), true);
  assert.equal(
    isStaleSupabaseSessionError({ code: "invalid_credentials" }),
    false,
  );
  assert.deepEqual(
    supabaseAuthCookieNames([
      { name: "sb-project-auth-token" },
      { name: "sb-project-auth-token.0" },
      { name: "quickola_admin" },
    ]),
    ["sb-project-auth-token", "sb-project-auth-token.0"],
  );
  assert.match(proxy, /expireAuthCookies/);
  assert.match(proxy, /"\/invite\/:path\*"/);
  assert.match(callback, /expireAuthCookies/);
  assert.doesNotMatch(callback, /console\.error|error\.message/);
  assert.match(browserAuth, /autoRefreshToken: false/);
  assert.match(businessSignIn, /authForm: true/);
});

test("invitation page has one dominant action and no metadata or legal detour", () => {
  assert.equal(
    credentials.match(/\{pending \? "Accepting invitation…" : "Accept invitation"\}/g)
      ?.length,
    2,
  );
  assert.doesNotMatch(invitePage, /Role:\s*Cleaner|<dl|Confirm your name/);
  assert.doesNotMatch(invitePage, /does not employ|handle cleaning payments/);
  assert.doesNotMatch(credentials, /Sign in to accept|Create credentials/);
});
