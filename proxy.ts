import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  isStaleSupabaseSessionError,
  supabaseAuthCookieNames,
} from "@/lib/supabase/auth-recovery";

const ADMIN_COOKIE = "quickola_admin";
const OPS_LOGIN = "/qk-ops-7f3a-login";
const PUBLIC_BUSINESS_PREFIXES = [
  "/business/sign-in",
  "/business/sign-up",
  "/business/update-password",
  "/business/setup-error",
  "/business/suspended",
  "/business/enquire",
  "/business/legal",
];

function isProtectedPortalPath(pathname: string) {
  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/")) return true;
  if (pathname !== "/business" && !pathname.startsWith("/business/"))
    return false;
  return !PUBLIC_BUSINESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function adminCookieValue() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
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
    let user: User | null = null;
    try {
      const result = await auth.auth.getUser();
      user = result.data.user;
      if (result.error && isStaleSupabaseSessionError(result.error)) {
        staleCookieNames = supabaseAuthCookieNames(request.cookies.getAll());
        staleCookieNames.forEach((name) => request.cookies.delete(name));
        expireAuthCookies(response, staleCookieNames);
        user = null;
      }
    } catch (error) {
      if (isStaleSupabaseSessionError(error)) {
        staleCookieNames = supabaseAuthCookieNames(request.cookies.getAll());
        staleCookieNames.forEach((name) => request.cookies.delete(name));
        expireAuthCookies(response, staleCookieNames);
      }
    }
    if (isProtectedPortalPath(request.nextUrl.pathname) && !user) {
      const loginUrl = new URL("/business/sign-in", request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      return expireAuthCookies(NextResponse.redirect(loginUrl), staleCookieNames);
    }
  }

  if (!request.nextUrl.pathname.startsWith("/qk-ops-7f3a")) return response;
  const expected = await adminCookieValue();
  const supplied = request.cookies.get(ADMIN_COOKIE)?.value || "";

  if (expected && supplied === expected) return response;

  const loginUrl = new URL(OPS_LOGIN, request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/business/:path*",
    "/cleaner/:path*",
    "/invite/:path*",
    "/team/invite/:path*",
    "/qk-ops-7f3a/:path*",
    "/.2SADXWEDX@%3E%23@%232/:path*",
  ],
};
