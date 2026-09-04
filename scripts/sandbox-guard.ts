import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SANDBOX_MARKER = "[quickola-sandbox-fixture]";
export const SANDBOX_FIXTURE_TOKEN = "00000000-0000-4000-8000-000000000001";
export const SANDBOX_FIXTURE_EMAILS = {
  customer: "customer+sandbox@quickola.test",
  provider: "provider+sandbox@quickola.test",
  admin: "admin+sandbox@quickola.test",
} as const;
export const LINKED_PRODUCTION_REF = "mmwysvsyqcjcckiwhpfq";

export type SandboxAdminClient = SupabaseClient;
export type SandboxContext = {
  admin: SandboxAdminClient;
  productionOverride: boolean;
  supabaseHost: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[sandbox] ${name} is required`);
  return value;
}

export function getSandboxContext(options: { requireProductionOverride?: boolean } = {}): SandboxContext {
  if (process.env.QUICKOLA_SANDBOX !== "true") throw new Error("[sandbox] QUICKOLA_SANDBOX=true is required");
  const stripeSecret = requiredEnv("STRIPE_SECRET_KEY");
  if (!stripeSecret.startsWith("sk_test_")) throw new Error("[sandbox] STRIPE_SECRET_KEY must start with sk_test_");

  const siteUrl = requiredEnv("NEXT_PUBLIC_SITE_URL");
  const siteHostname = new URL(siteUrl).hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "staging.quickola.co.uk"].includes(siteHostname)) {
    throw new Error("[sandbox] site URL must be localhost or staging.quickola.co.uk");
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.hostname.includes("your-sandbox-ref")) throw new Error("[sandbox] replace the placeholder Supabase URL");
  const productionTarget = parsedUrl.hostname === `${LINKED_PRODUCTION_REF}.supabase.co` || parsedUrl.hostname.includes("quickola.co.uk");
  const productionOverride = process.env.QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX === "true";
  if (productionTarget && (!productionOverride || options.requireProductionOverride)) {
    if (!productionOverride) throw new Error("[sandbox] the configured Supabase target is recognised as production; set QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX=true explicitly to override");
  }
  if (productionTarget && !productionOverride) throw new Error("[sandbox] production Supabase is rejected by default");
  if (productionOverride) console.warn("[sandbox] WARNING: sandbox fixture data will be written to the existing Quickola Supabase database.");

  return {
    admin: createClient(supabaseUrl, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } }),
    productionOverride,
    supabaseHost: parsedUrl.hostname,
  };
}

export function assertExecutionAllowed(): void {
  if (process.env.QUICKOLA_SANDBOX !== "true" || process.env.QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX !== "true") {
    throw new Error("[sandbox] scenario execution requires QUICKOLA_SANDBOX=true and QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX=true");
  }
  if (process.env.QUICKOLA_SCENARIO_EXECUTION_CONFIRM !== "RUN_SANDBOX_SCENARIOS_ONLY") {
    throw new Error("[sandbox] refusing scenario writes; set QUICKOLA_SCENARIO_EXECUTION_CONFIRM=RUN_SANDBOX_SCENARIOS_ONLY for an explicit execution run");
  }
}
