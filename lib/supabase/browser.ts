"use client";

import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserClient | null = null;

export function createSupabaseBrowserClient({
  authForm = false,
}: { authForm?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  void authForm;
  if (!browserClient) browserClient = createBrowserClient(url, key, { auth: { flowType: "pkce", autoRefreshToken: true, detectSessionInUrl: true, persistSession: true } });
  return browserClient;
}
