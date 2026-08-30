import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isStaleSupabaseSessionError,
  supabaseAuthCookieNames,
} from "@/lib/supabase/auth-recovery";

function expireAuthCookies(response: NextResponse, names: string[]) {
  names.forEach((name) =>
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }),
  );
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let staleCookieNames: string[] = [];
  const pathname = request.nextUrl.pathname;

  // Only refresh the session for pages that require it. Public pages and
  // OAuth/sign-in routes must not make an auth request just to render.
  const requiresSession = isProtectedPortalPath(pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Public auth pages must remain stable even when the browser still carries
  // an invalid session cookie. Protected routes perform the authoritative
  // lookup and clear that cookie before redirecting once to sign-in.
  if (requiresSession && url && key) {
    const auth = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try {
      const result = await auth.auth.getUser();
      if (result.error && isStaleSupabaseSessionError(result.error)) {
        staleCookieNames = supabaseAuthCookieNames(request.cookies.getAll());
        staleCookieNames.forEach((name) => request.cookies.delete(name));
        expireAuthCookies(response, staleCookieNames);
      }
    } catch (error) {
      if (isStaleSupabaseSessionError(error)) {
        staleCookieNames = supabaseAuthCookieNames(request.cookies.getAll());
        staleCookieNames.forEach((name) => request.cookies.delete(name));
        expireAuthCookies(response, staleCookieNames);
      }
    }
  }

  return response;
}

function isProtectedPortalPath(pathname: string) {
  return pathname === "/jobs" || pathname === "/my-jobs" || pathname.startsWith("/messages/");
}

export const config = {
  matcher: [
    "/jobs",
    "/my-jobs",
    "/messages/:path*",
  ],
};
