export type Portal = "business" | "cleaner";

export type PortalRoleEvidence = {
  hasBusinessMembership: boolean;
  hasAcceptedCleanerMembership: boolean;
};

export const PORTAL_HOME: Record<Portal, string> = {
  business: "/business/dashboard",
  cleaner: "/cleaner/today",
};

/**
 * A user may only have one canonical product portal. Business wins when legacy
 * data contains both roles; invitation acceptance prevents new overlaps.
 */
export function resolveCanonicalPortal(
  evidence: PortalRoleEvidence,
): Portal | null {
  if (evidence.hasBusinessMembership) return "business";
  if (evidence.hasAcceptedCleanerMembership) return "cleaner";
  return null;
}

export function portalForPath(path: string): Portal | null {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    return null;
  let parsed: URL;
  try {
    parsed = new URL(path, "https://internal.quickola");
  } catch {
    return null;
  }
  if (parsed.origin !== "https://internal.quickola") return null;
  const pathname = parsed.pathname;
  if (pathname === "/business" || pathname.startsWith("/business/"))
    return "business";
  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/"))
    return "cleaner";
  return null;
}

export function signInDestination(nextPath: string) {
  return `/business/sign-in?next=${encodeURIComponent(nextPath)}`;
}

export type PortalNavigationDecision =
  | { kind: "allow"; portal: Portal }
  | { kind: "redirect"; destination: string; portal: Portal }
  | { kind: "sign-in"; destination: string }
  | { kind: "unassigned"; destination: "/auth/portal" };

export function decidePortalNavigation({
  authenticated,
  evidence,
  requestedPath,
}: {
  authenticated: boolean;
  evidence: PortalRoleEvidence;
  requestedPath: string;
}): PortalNavigationDecision {
  if (!authenticated)
    return { kind: "sign-in", destination: signInDestination(requestedPath) };

  const portal = resolveCanonicalPortal(evidence);
  if (!portal) return { kind: "unassigned", destination: "/auth/portal" };
  if (portalForPath(requestedPath) === portal) return { kind: "allow", portal };
  return { kind: "redirect", destination: PORTAL_HOME[portal], portal };
}

export function postLoginDestination(
  evidence: PortalRoleEvidence,
  requestedNext?: string | null,
) {
  const portal = resolveCanonicalPortal(evidence);
  if (!portal) return "/auth/portal";
  return requestedNext && portalForPath(requestedNext) === portal
    ? requestedNext
    : PORTAL_HOME[portal];
}
