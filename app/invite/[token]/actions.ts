"use server";

import { resolvePortalSession } from "@/lib/portal-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCleanerInvitation } from "@/lib/server/cleaner-invitations";

export type PrepareInvitationResult =
  | { status: "credentials_created" }
  | { status: "sign_in_required" }
  | { status: "invitation_unavailable" }
  | { status: "unavailable" };

export type AcceptInvitationResult =
  | { status: "accepted" }
  | {
      status:
        | "not_authenticated"
        | "email_mismatch"
        | "role_conflict"
        | "invitation_unavailable"
        | "unavailable";
    };

function authErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return typeof error.code === "string" ? error.code : "";
}

/**
 * Creates cleaner credentials for a valid invitation. The invitation token is
 * the email-possession proof for this invitation-specific account flow.
 */
export async function prepareCleanerInvitationCredentials({
  token,
  password,
}: {
  token: string;
  password: string;
}): Promise<PrepareInvitationResult> {
  try {
    const invitation = await getCleanerInvitation(token);
    if (!invitation || invitation.state !== "valid")
      return { status: "invitation_unavailable" };
    if (password.length < 10 || password.length > 128)
      return { status: "unavailable" };

    const admin = createSupabaseAdminClient();
    const created = await admin.auth.admin.createUser({
      email: invitation.invitedEmail,
      password,
      email_confirm: true,
      user_metadata: { account_kind: "quickola_cleaner" },
    });
    if (created.error) {
      const code = authErrorCode(created.error);
      return code === "email_exists" || code === "user_already_exists"
        ? { status: "sign_in_required" }
        : { status: "unavailable" };
    }
    return { status: "credentials_created" };
  } catch {
    return { status: "unavailable" };
  }
}

export async function acceptCleanerInvitation({
  token,
}: {
  token: string;
}): Promise<AcceptInvitationResult> {
  try {
    const invitation = await getCleanerInvitation(token);
    if (!invitation || invitation.state !== "valid")
      return { status: "invitation_unavailable" };

    const session = await resolvePortalSession();
    if (session.status === "unauthenticated" || !session.user)
      return { status: "not_authenticated" };
    if (
      session.user.email?.trim().toLowerCase() !== invitation.invitedEmail
    )
      return { status: "email_mismatch" };
    if (session.status === "error") return { status: "unavailable" };

    const { error } = await session.supabase.rpc("accept_worker_invitation", {
      raw_token: token,
      confirmed_name: invitation.workerName,
    });
    if (!error) return { status: "accepted" };

    if (error.message.includes("invitation_email_mismatch"))
      return { status: "email_mismatch" };
    if (
      error.message.includes("business_user_cannot_accept") ||
      error.message.includes("user_already_linked") ||
      error.message.includes("worker_already_linked")
    )
      return { status: "role_conflict" };
    if (
      error.message.includes("invitation_invalid") ||
      error.message.includes("invitation_expired") ||
      error.message.includes("invitation_revoked") ||
      error.message.includes("invitation_already_accepted")
    )
      return { status: "invitation_unavailable" };
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}
