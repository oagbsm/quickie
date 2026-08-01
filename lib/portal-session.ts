import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaleSupabaseSessionError } from "@/lib/supabase/auth-recovery";
import {
  PORTAL_HOME,
  decidePortalNavigation,
  resolveCanonicalPortal,
  type Portal,
} from "@/lib/portal-policy";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type BusinessMembership = {
  account_id: string;
  role: string;
  business_accounts:
    | { suspended_at: string | null }
    | Array<{ suspended_at: string | null }>
    | null;
};

type CleanerMembership = {
  id: string;
  account_id: string;
  display_name: string;
};

export type PortalSession = {
  status: "unauthenticated" | "unassigned" | "resolved" | "error";
  supabase: ServerSupabaseClient;
  user: Awaited<
    ReturnType<ServerSupabaseClient["auth"]["getUser"]>
  >["data"]["user"];
  portal: Portal | null;
  hasBusinessMembership: boolean;
  hasAcceptedCleanerMembership: boolean;
  business: BusinessMembership | null;
  cleaner: CleanerMembership | null;
  reason?: "cleaner_invitation_pending" | "no_portal_role" | "resolution_failed";
};

/**
 * The only application-level source of portal role truth. React cache keeps the
 * auth lookup and both membership reads to one resolution per render/request.
 */
export const resolvePortalSession = cache(async (): Promise<PortalSession> => {
  const supabase = await createSupabaseServerClient();
  let user: PortalSession["user"] = null;
  try {
    const authResult = await supabase.auth.getUser();
    if (authResult.error) {
      if (!isStaleSupabaseSessionError(authResult.error))
        console.warn(
          JSON.stringify({
            event: "portal_auth_resolution_failed",
            code: authResult.error.code || "unknown",
          }),
        );
      return {
        status: isStaleSupabaseSessionError(authResult.error)
          ? "unauthenticated"
          : "error",
        supabase,
        user: null,
        portal: null,
        hasBusinessMembership: false,
        hasAcceptedCleanerMembership: false,
        business: null,
        cleaner: null,
        reason: isStaleSupabaseSessionError(authResult.error)
          ? undefined
          : "resolution_failed",
      };
    }
    user = authResult.data.user;
  } catch (error) {
    return {
      status: isStaleSupabaseSessionError(error) ? "unauthenticated" : "error",
      supabase,
      user: null,
      portal: null,
      hasBusinessMembership: false,
      hasAcceptedCleanerMembership: false,
      business: null,
      cleaner: null,
      reason: isStaleSupabaseSessionError(error)
        ? undefined
        : "resolution_failed",
    };
  }

  if (!user)
    return {
      status: "unauthenticated",
      supabase,
      user: null,
      portal: null,
      hasBusinessMembership: false,
      hasAcceptedCleanerMembership: false,
      business: null,
      cleaner: null,
    };

  const [businessResult, cleanerResult] = await Promise.all([
    supabase
      .from("business_members")
      .select("account_id,role,business_accounts(suspended_at)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workers")
      .select("id,account_id,display_name")
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("invitation_status", "accepted")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (businessResult.error || cleanerResult.error) {
    console.warn(
      JSON.stringify({
        event: "portal_role_resolution_failed",
        userId: user.id,
        businessError: businessResult.error?.code || null,
        cleanerError: cleanerResult.error?.code || null,
      }),
    );
    return {
      status: "error",
      supabase,
      user,
      portal: null,
      hasBusinessMembership: false,
      hasAcceptedCleanerMembership: false,
      business: null,
      cleaner: null,
      reason: "resolution_failed",
    };
  }

  const business = (businessResult.data as BusinessMembership | null) || null;
  const cleaner = (cleanerResult.data as CleanerMembership | null) || null;
  const evidence = {
    hasBusinessMembership: Boolean(business),
    hasAcceptedCleanerMembership: Boolean(cleaner),
  };
  const portal = resolveCanonicalPortal(evidence);

  if (business && cleaner)
    console.warn(
      JSON.stringify({
        event: "dual_portal_role_detected",
        userId: user.id,
        resolution: "business",
      }),
    );

  return {
    status: portal ? "resolved" : "unassigned",
    supabase,
    user,
    portal,
    ...evidence,
    business,
    cleaner,
    reason: portal
      ? undefined
      : user.user_metadata?.account_kind === "quickola_cleaner"
        ? "cleaner_invitation_pending"
        : "no_portal_role",
  };
});

export async function requirePortal(portal: Portal): Promise<PortalSession> {
  const session = await resolvePortalSession();
  if (session.status === "error") redirect("/auth/portal?error=resolution");

  const decision = decidePortalNavigation({
    authenticated: session.status !== "unauthenticated",
    evidence: session,
    requestedPath: PORTAL_HOME[portal],
  });
  if (decision.kind !== "allow") redirect(decision.destination);

  if (portal === "business") {
    const account = Array.isArray(session.business?.business_accounts)
      ? session.business.business_accounts[0]
      : session.business?.business_accounts;
    if (account?.suspended_at) redirect("/business/suspended");
  }
  return session;
}
