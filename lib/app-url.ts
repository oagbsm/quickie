export type AppOriginEnvironment = {
  appUrl?: string;
  siteUrl?: string;
  vercelUrl?: string;
  nodeEnv?: string;
  browserOrigin?: string;
};

export const PRODUCTION_ORIGIN = "https://quickola.co.uk";
const LOCAL_ORIGIN = "http://localhost:3000";

export function isLocalDevelopmentOrigin(value: string | undefined) {
  if (!value) return false;
  try {
    const hostname = new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0" || hostname.endsWith(".local");
  } catch {
    return false;
  }
}

function validOrigin(value: string | undefined, production: boolean) {
  if (!value) return null;
  const candidate = value.includes("://") ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash)
      return null;
    const local =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (production && (local || url.protocol !== "https:")) return null;
    if (production && url.hostname !== new URL(PRODUCTION_ORIGIN).hostname)
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveAppOrigin(environment: AppOriginEnvironment = {}) {
  const production = environment.nodeEnv === "production";
  const browserOrigin = !production
    ? validOrigin(environment.browserOrigin, false)
    : null;
  return (
    browserOrigin ||
    validOrigin(environment.appUrl, production) ||
    validOrigin(environment.siteUrl, production) ||
    (!production ? validOrigin(environment.vercelUrl, false) : null) ||
    (!production
      ? LOCAL_ORIGIN
      : PRODUCTION_ORIGIN)
  );
}

export function getAppOrigin() {
  return resolveAppOrigin({
    appUrl: process.env.APP_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    nodeEnv: process.env.NODE_ENV,
    browserOrigin:
      typeof window === "undefined" ? undefined : window.location.origin,
  });
}

export function getTransactionalEmailOrigin(environment: AppOriginEnvironment = {}) {
  const production = environment.nodeEnv === "production";
  const configuredOrigin = environment.appUrl || environment.siteUrl;
  if (production && isLocalDevelopmentOrigin(configuredOrigin)) return null;
  const origin = resolveAppOrigin(environment);
  return production && isLocalDevelopmentOrigin(origin) ? null : origin;
}

export function safeInternalNextPath(
  value: string | null | undefined,
  fallback = "/auth/portal",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\0")
  )
    return fallback;
  try {
    const parsed = new URL(value, "https://internal.quickola");
    if (parsed.origin !== "https://internal.quickola") return fallback;
    if (
      !parsed.pathname.startsWith("/business/") &&
      !parsed.pathname.startsWith("/cleaner/") &&
      !parsed.pathname.startsWith("/team/invite/") &&
      !parsed.pathname.startsWith("/invite/") &&
      parsed.pathname !== "/admin"
    )
      return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildAbsoluteAppUrl(
  path: string,
  environment?: AppOriginEnvironment,
) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    throw new Error("Application URL path must be internal.");
  const url = new URL(path, resolveAppOrigin(environment));
  if (url.origin !== resolveAppOrigin(environment))
    throw new Error("Application URL path must be internal.");
  return url.toString();
}
