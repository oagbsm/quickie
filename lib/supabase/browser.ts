"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient({
  authForm = false,
}: { authForm?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createBrowserClient(
    url,
    key,
    authForm
      ? {
          isSingleton: false,
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            flowType: "pkce",
            persistSession: true,
          },
        }
      : { auth: { flowType: "pkce" } },
  );
}
