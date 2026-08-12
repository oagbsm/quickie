import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const migration = readFileSync(new URL("../supabase/migrations/202608080003_standalone_cleaner_profiles.sql", import.meta.url), "utf8");
const auth = readFileSync(new URL("../apps/mobile/lib/auth.tsx", import.meta.url), "utf8");
const tabs = readFileSync(new URL("../apps/mobile/app/(tabs)/_layout.tsx", import.meta.url), "utf8");

test("direct cleaner profiles are standalone, idempotent and own-row scoped", () => {
  assert.match(migration, /create table if not exists public\.cleaner_profiles/);
  assert.match(migration, /user_id uuid primary key references auth\.users/);
  assert.match(migration, /role text not null default 'cleaner' check \(role = 'cleaner'\)/);
  assert.match(migration, /on conflict \(user_id\) do nothing/);
  assert.match(migration, /using \(user_id = auth\.uid\(\) and role = 'cleaner'\)/);
  assert.match(migration, /with check \(user_id = auth\.uid\(\) and role = 'cleaner'\)/);
  assert.match(migration, /metadata->>'account_kind'.*quickola_cleaner/s);
  assert.match(migration, /business_members.*current_user_id/s);
  assert.doesNotMatch(migration, /business_accounts|insert into public\.business_members/);
});

test("mobile access accepts standalone profiles without changing invited workers", () => {
  assert.match(auth, /from\("cleaner_profiles"\)/);
  assert.match(auth, /cleanerAccess: Boolean\(worker \|\| standaloneCleaner\)/);
  assert.match(tabs, /if \(!cleanerAccess\) return <Redirect href="\/onboarding" \/>/);
});
