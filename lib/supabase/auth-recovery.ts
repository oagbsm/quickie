type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

const STALE_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
]);

/** Stale sessions are an expected signed-out state, not a user-facing error. */
export function isStaleSupabaseSessionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as AuthErrorLike;
  if (
    typeof candidate.code === "string" &&
    STALE_SESSION_CODES.has(candidate.code)
  )
    return true;

  if (typeof candidate.message !== "string") return false;
  const message = candidate.message.toLowerCase();
  return (
    message.includes("refresh token not found") ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token has already been used") ||
    message.includes("session not found")
  );
}

export function supabaseAuthCookieNames(
  cookies: ReadonlyArray<{ name: string }>,
) {
  return cookies
    .map(({ name }) => name)
    .filter(
      (name, index, names) =>
        name.startsWith("sb-") &&
        name.includes("-auth-token") &&
        names.indexOf(name) === index,
    );
}
