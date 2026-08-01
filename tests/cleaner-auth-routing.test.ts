import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  PORTAL_HOME,
  decidePortalNavigation,
  postLoginDestination,
  resolveCanonicalPortal,
  type PortalRoleEvidence,
} from "../lib/portal-policy.ts";

const cleanerOnly: PortalRoleEvidence = {
  hasBusinessMembership: false,
  hasAcceptedCleanerMembership: true,
};
const businessOnly: PortalRoleEvidence = {
  hasBusinessMembership: true,
  hasAcceptedCleanerMembership: false,
};
const bothRoles: PortalRoleEvidence = {
  hasBusinessMembership: true,
  hasAcceptedCleanerMembership: true,
};
const noRole: PortalRoleEvidence = {
  hasBusinessMembership: false,
  hasAcceptedCleanerMembership: false,
};

function followPortalRedirects(
  evidence: PortalRoleEvidence,
  initialPath: string,
) {
  let path = initialPath;
  const seen = new Set<string>();
  for (let hop = 0; hop < 4; hop += 1) {
    assert.equal(seen.has(path), false, `redirect loop revisited ${path}`);
    seen.add(path);
    const decision = decidePortalNavigation({
      authenticated: true,
      evidence,
      requestedPath: path,
    });
    if (decision.kind === "allow" || decision.kind === "unassigned")
      return { decision, path, hops: hop };
    assert.equal(decision.kind, "redirect");
    path = decision.destination;
  }
  assert.fail(`portal routing did not settle from ${initialPath}`);
}

test("cleaner-only direct navigation and refresh stay in the cleaner portal", () => {
  const direct = followPortalRedirects(cleanerOnly, "/cleaner/today");
  assert.equal(direct.decision.kind, "allow");
  assert.equal(direct.hops, 0);

  const wrongPortal = followPortalRedirects(cleanerOnly, "/business/dashboard");
  assert.equal(wrongPortal.path, PORTAL_HOME.cleaner);
  assert.equal(wrongPortal.decision.kind, "allow");
  assert.equal(wrongPortal.hops, 1);

  const refresh = followPortalRedirects(cleanerOnly, wrongPortal.path);
  assert.equal(refresh.decision.kind, "allow");
  assert.equal(refresh.hops, 0);
});

test("operator direct navigation and refresh stay in the business portal", () => {
  const direct = followPortalRedirects(businessOnly, "/business/dashboard");
  assert.equal(direct.decision.kind, "allow");
  assert.equal(direct.hops, 0);

  const wrongPortal = followPortalRedirects(businessOnly, "/cleaner/today");
  assert.equal(wrongPortal.path, PORTAL_HOME.business);
  assert.equal(wrongPortal.decision.kind, "allow");
  assert.equal(wrongPortal.hops, 1);

  const refresh = followPortalRedirects(businessOnly, wrongPortal.path);
  assert.equal(refresh.decision.kind, "allow");
  assert.equal(refresh.hops, 0);
});

test("logout and login route once, then refresh without redirecting", () => {
  for (const [evidence, home] of [
    [cleanerOnly, PORTAL_HOME.cleaner],
    [businessOnly, PORTAL_HOME.business],
  ] as const) {
    const signedOut = decidePortalNavigation({
      authenticated: false,
      evidence: noRole,
      requestedPath: home,
    });
    assert.equal(signedOut.kind, "sign-in");

    const afterLogin = postLoginDestination(evidence, home);
    assert.equal(afterLogin, home);
    assert.equal(followPortalRedirects(evidence, afterLogin).hops, 0);
    assert.equal(followPortalRedirects(evidence, afterLogin).hops, 0);
  }
});

test("worker invitation becomes cleaner access only after acceptance", () => {
  const pending = followPortalRedirects(noRole, "/cleaner/today");
  assert.equal(pending.decision.kind, "unassigned");
  assert.equal(pending.decision.destination, "/auth/portal");

  assert.equal(resolveCanonicalPortal(cleanerOnly), "cleaner");
  const accepted = followPortalRedirects(cleanerOnly, "/cleaner/today");
  assert.equal(accepted.decision.kind, "allow");
  assert.equal(accepted.hops, 0);
});

test("legacy dual-role users deterministically resolve to business", () => {
  assert.equal(resolveCanonicalPortal(bothRoles), "business");
  const fromCleaner = followPortalRedirects(bothRoles, "/cleaner/today");
  assert.equal(fromCleaner.path, "/business/dashboard");
  assert.equal(fromCleaner.decision.kind, "allow");
  assert.equal(fromCleaner.hops, 1);
});

test("post-login routing never accepts an external portal-looking URL", () => {
  assert.equal(
    postLoginDestination(
      businessOnly,
      "https://evil.example/business/dashboard",
    ),
    PORTAL_HOME.business,
  );
  assert.equal(
    postLoginDestination(businessOnly, "//evil.example/business/dashboard"),
    PORTAL_HOME.business,
  );
});

test("portal role lookup and redirects are centralized", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  const cleanerLayout = readFileSync(
    new URL("../app/cleaner/layout.tsx", import.meta.url),
    "utf8",
  );
  const businessLayout = readFileSync(
    new URL("../app/business/dashboard/layout.tsx", import.meta.url),
    "utf8",
  );
  const portalSession = readFileSync(
    new URL("../lib/portal-session.ts", import.meta.url),
    "utf8",
  );
  const signIn = readFileSync(
    new URL("../app/business/sign-in/SignInForm.tsx", import.meta.url),
    "utf8",
  );
  const cleanerActions = readFileSync(
    new URL("../app/business/str-actions.ts", import.meta.url),
    "utf8",
  );

  assert.match(portalSession, /cache\(async/);
  assert.match(portalSession, /from\("business_members"\)/);
  assert.match(portalSession, /from\("workers"\)/);
  assert.match(cleanerLayout, /requireCleanerUser/);
  assert.match(businessLayout, /requireBusinessUser/);
  assert.doesNotMatch(cleanerLayout, /redirect\(/);
  assert.doesNotMatch(businessLayout, /redirect\(/);
  assert.doesNotMatch(proxy, /business_members|from\("workers"\)|account_kind/);
  assert.match(proxy, /isProtectedPortalPath/);
  assert.match(signIn, /\/auth\/portal/);
  assert.match(signIn, /router\.replace\(returnPath\)/);
  assert.match(signIn, /cleanerPath/);
  assert.match(signIn, /!cleanerPath &&/);
  assert.match(cleanerActions, /requireCleanerUser/);
  assert.equal(
    existsSync(new URL("../lib/business/workspace.ts", import.meta.url)),
    false,
  );
});

test("unauthenticated direct portal URLs preserve the requested path", () => {
  const cleaner = decidePortalNavigation({
    authenticated: false,
    evidence: noRole,
    requestedPath: "/cleaner/today?date=2026-08-01",
  });
  const business = decidePortalNavigation({
    authenticated: false,
    evidence: noRole,
    requestedPath: "/business/dashboard",
  });
  assert.deepEqual(cleaner, {
    kind: "sign-in",
    destination:
      "/business/sign-in?next=%2Fcleaner%2Ftoday%3Fdate%3D2026-08-01",
  });
  assert.deepEqual(business, {
    kind: "sign-in",
    destination: "/business/sign-in?next=%2Fbusiness%2Fdashboard",
  });
});
