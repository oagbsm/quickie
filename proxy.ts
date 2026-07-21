import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_COOKIE = "quickola_admin";
const OPS_LOGIN = "/qk-ops-7f3a-login";

async function adminCookieValue() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
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
    await auth.auth.getUser();
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
  matcher: ["/business/:path*", "/qk-ops-7f3a/:path*", "/.2SADXWEDX@%3E%23@%232/:path*"],
};
