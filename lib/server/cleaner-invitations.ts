import "server-only";

import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CleanerInvitationState =
  | "valid"
  | "expired"
  | "accepted"
  | "invalid";

export type CleanerInvitation = {
  id: string;
  accountId: string;
  workerId: string;
  workerName: string;
  invitedEmail: string;
  businessName: string;
  expiresAt: string;
  state: CleanerInvitationState;
};

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

export async function getCleanerInvitation(
  rawToken: string,
): Promise<CleanerInvitation | null> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(rawToken)) return null;
  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const { data, error } = await createSupabaseAdminClient()
      .from("worker_invitations")
      .select(
        "id,account_id,worker_id,expires_at,accepted_at,revoked_at,workers(id,display_name,email),business_accounts(name)",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !data) return null;
    const worker = first(data.workers);
    const business = first(data.business_accounts);
    if (!worker?.email || !business?.name || worker.id !== data.worker_id)
      return null;

    const state: CleanerInvitationState = data.accepted_at
      ? "accepted"
      : data.revoked_at
        ? "invalid"
        : new Date(data.expires_at).getTime() <= Date.now()
          ? "expired"
          : "valid";

    return {
      id: data.id,
      accountId: data.account_id,
      workerId: data.worker_id,
      workerName: worker.display_name,
      invitedEmail: worker.email.trim().toLowerCase(),
      businessName: business.name,
      expiresAt: data.expires_at,
      state,
    };
  } catch {
    return null;
  }
}
