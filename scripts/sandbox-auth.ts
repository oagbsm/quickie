import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { SANDBOX_FIXTURE_EMAILS } from "./sandbox-guard.ts";

export type SandboxActor = "customer" | "provider" | "admin";
export type SandboxActorContext = { actor: SandboxActor; user: User; client: SupabaseClient };

/** Test-only JWT contexts. Product routes and production auth are not changed. */
export async function signInSandboxActor(actor: SandboxActor, password: string): Promise<SandboxActorContext> {
  const email = SANDBOX_FIXTURE_EMAILS[actor];
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user || !result.data.session) throw new Error(`[sandbox] ${actor} JWT login failed`);
  return { actor, user: result.data.user, client };
}

export function assertFixtureUserIds(actors: SandboxActorContext[], expected: Record<SandboxActor, string>): void {
  for (const actor of actors) if (actor.user.id !== expected[actor.actor]) throw new Error(`[sandbox] ${actor.actor} JWT identity did not match the verified fixture user`);
}
