import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/pro/login/ProviderGoogleButton.tsx", import.meta.url), "utf8");
const register = readFileSync(new URL("../app/pro/register/ProviderRegisterForm.tsx", import.meta.url), "utf8");
const callback = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
const footer = readFileSync(new URL("../app/components/Footer.tsx", import.meta.url), "utf8");

test("provider Google OAuth requests one URL and navigates explicitly", () => {
  assert.match(source, /skipBrowserRedirect: true/);
  assert.match(source, /result\.data\?\.url/);
  assert.match(source, /window\.location\.assign\(oauthUrl\.toString\(\)\)/);
  assert.match(source, /OAUTH_START_TIMEOUT_MS = 12_000/);
  assert.doesNotMatch(source, /signInWithOAuth\([^\n]*signInWithOAuth/);
});

test("provider Google OAuth handles failures without exposing raw errors", () => {
  assert.match(source, /catch \(error\)/);
  assert.match(source, /finally/);
  assert.match(source, /setPending\(false\)/);
  assert.match(source, /Google sign-in could not be opened\. Please try again\./);
  assert.match(source, /Google sign-in is taking too long\. Please try again\./);
  assert.doesNotMatch(source, /console\.(log|warn|error)\([^\n]*error\.message/);
});

test("provider signup intent survives the OAuth round trip", () => {
  assert.match(footer, /\/pro\/register\?intent=provider-signup/);
  assert.match(register, /signupIntent \? "\/pro\/register"/);
  assert.match(callback, /const providerSignupIntent = next === "\/pro\/register"/);
  assert.match(callback, /ensureProviderSignupProfile/);
});
