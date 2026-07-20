import { NextRequest, NextResponse } from "next/server";

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
  const expected = await adminCookieValue();
  const supplied = request.cookies.get(ADMIN_COOKIE)?.value || "";

  if (expected && supplied === expected) return NextResponse.next();

  const loginUrl = new URL(OPS_LOGIN, request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/qk-ops-7f3a/:path*", "/.2SADXWEDX@%3E%23@%232/:path*"],
};
