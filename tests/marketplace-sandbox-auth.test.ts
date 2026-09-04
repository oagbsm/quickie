import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const auth = readFileSync(new URL("../scripts/sandbox-auth.ts", import.meta.url), "utf8");
const runner = readFileSync(new URL("../scripts/marketplace-scenarios.ts", import.meta.url), "utf8");

test("scenario actors use fixture JWTs and never impersonate auth.uid", () => {
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(auth, /did not match the verified fixture user/);
  assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(runner, /signInSandboxActor/);
});
