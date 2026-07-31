import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceResult =
  | { ok: true; accountId: string; role: string; provisioned: boolean }
  | {
      ok: false;
      reference: string;
      reason:
        "schema_outdated" | "provisioning_failed" | "no_session" | "suspended" | "cleaner_account";
    };

export async function resolveBusinessWorkspace(): Promise<WorkspaceResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { ok: false, reference: "AUTH-NO-SESSION", reason: "no_session" };

  // Backward-compatible fast path: users provisioned by the original trigger do
  // not need the repair RPC. This also avoids breaking a rolling deployment while
  // the corrective migration is being applied.
  const { data: existing, error: membershipError } = await supabase
    .from("business_members")
    .select("account_id, role, business_accounts(suspended_at)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.account_id) {
    const account = Array.isArray(existing.business_accounts)
      ? existing.business_accounts[0]
      : existing.business_accounts;
    if (account?.suspended_at)
      return { ok: false, reference: "ACCOUNT-SUSPENDED", reason: "suspended" };
    return {
      ok: true,
      accountId: existing.account_id,
      role: existing.role,
      provisioned: false,
    };
  }

  const { data: cleaner } = await supabase
    .from("workers")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (cleaner)
    return { ok: false, reference: "CLEANER-ACCOUNT", reason: "cleaner_account" };

  const { data, error } = await supabase.rpc("ensure_business_workspace");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row?.account_id) {
    const schemaOutdated = error?.code === "PGRST202";
    const reference = schemaOutdated
      ? "WS-SCHEMA-20260721"
      : `WS-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
    const diagnostic = {
      event: "business_workspace_resolution_failed",
      userId: user.id,
      confirmed: Boolean(user.email_confirmed_at),
      membershipFound: false,
      membershipErrorCode: membershipError?.code || null,
      rpcErrorCode: error?.code || null,
      reason: schemaOutdated ? "schema_outdated" : "provisioning_failed",
      reference,
    };
    // Avoid Next.js treating a handled provisioning state as an uncaught console
    // error overlay. The user receives the dedicated recovery screen instead.
    console.warn(JSON.stringify(diagnostic));
    return {
      ok: false,
      reference,
      reason: schemaOutdated ? "schema_outdated" : "provisioning_failed",
    };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      JSON.stringify({
        event: "business_workspace_resolved",
        userId: user.id,
        accountId: row.account_id,
        provisioned: Boolean(row.provisioned),
      }),
    );
  }
  return {
    ok: true,
    accountId: row.account_id,
    role: row.role,
    provisioned: Boolean(row.provisioned),
  };
}
