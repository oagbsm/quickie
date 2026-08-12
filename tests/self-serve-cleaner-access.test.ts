import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202608090005_self_serve_cleaner_identity.sql", import.meta.url), "utf8");
const auth = readFileSync(new URL("../apps/mobile/lib/auth.tsx", import.meta.url), "utf8");
const index = readFileSync(new URL("../apps/mobile/app/index.tsx", import.meta.url), "utf8");

test("self-serve cleaner bootstrap is not gated by signup metadata", () => {
  assert.match(migration, /create or replace function public\.initialize_direct_cleaner_profile/);
  assert.doesNotMatch(migration, /account_kind.*quickola_cleaner/);
  assert.match(migration, /business_members where user_id = current_user_id/);
  assert.match(migration, /workers where user_id = current_user_id and status = 'active' and invitation_status = 'accepted'/);
  assert.match(auth, /!workerResult\.data && \(!directResult\.data \|\| !directResult\.data\.workspace_account_id\)/);
  assert.match(index, /standaloneCleaner && !standaloneCleaner\.onboarding_completed_at/);
});
