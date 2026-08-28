import { type EmailOtpType, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publishPendingMarketplaceJob } from "@/app/post-job/actions";
import { getAppOrigin, safeInternalNextPath } from "@/lib/app-url";
import {
  isStaleSupabaseSessionError,
  supabaseAuthCookieNames,
} from "@/lib/supabase/auth-recovery";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getCurrentAccountRole } from "@/lib/auth/account-role";

const SIGNUP_CONFIRMATION_PURPOSES = new Set([
  "signup-confirmation",
  // Keep confirmation links issued before this fix usable.
  "signup_confirmation",
  "customer-signup",
]);

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

function failedCallbackDestination(
  next: string,
  email: string | null,
  appOrigin: string,
) {
  if (next.startsWith("/invite/") || next.startsWith("/team/invite/")) {
    const invitation = new URL(next, appOrigin);
    invitation.searchParams.set("error", "verification");
    return invitation;
  }

  if (next.startsWith("/auth/customer") || next.startsWith("/sign-in")) {
    const customer = new URL("/sign-in", appOrigin);
    customer.searchParams.set("error", "confirmation");
    const parsed = new URL(next, appOrigin);
    const draft = parsed.searchParams.get("draft");
    if (draft) customer.searchParams.set("draft", draft);
    return customer;
  }

  const signIn = new URL("/sign-in", appOrigin);
  signIn.searchParams.set("error", "confirmation");
  signIn.searchParams.set("next", next);
  if (email) signIn.searchParams.set("email", email);
  return signIn;
}

function successfulCallbackDestination(
  next: string,
  purpose: string | null,
  user: User,
  appOrigin: string,
) {
  if (!SIGNUP_CONFIRMATION_PURPOSES.has(purpose || ""))
    return new URL(next, appOrigin);

  if (purpose === "customer-signup") {
    const customer = new URL("/sign-in", appOrigin);
    customer.searchParams.set("confirmed", "1");
    const parsed = new URL(next, appOrigin);
    const draft = parsed.searchParams.get("draft");
    if (draft) customer.searchParams.set("draft", draft);
    if (user.email) customer.searchParams.set("email", user.email);
    return customer;
  }

  const signIn = new URL("/auth/portal/sign-in", appOrigin);
  signIn.searchParams.set("confirmed", "1");
  if (user.email) signIn.searchParams.set("email", user.email);
  return signIn;
}

async function ensureMarketplaceCustomer(user: User) {
  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from("marketplace_customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existing.data || existing.error) return existing.data;
  const inserted = await admin
    .from("marketplace_customers")
    .insert({
      auth_user_id: user.id,
      email: user.email || null,
      display_name:
        user.user_metadata?.full_name || user.user_metadata?.name || null,
    })
    .select("id")
    .maybeSingle();
  if (inserted.data || inserted.error?.code === "23505")
    return inserted.data || (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data;
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeInternalNextPath(url.searchParams.get("next"), "/portal");
  const draft = url.searchParams.get("draft");
  const providerInvite = url.searchParams.get("provider_invite");
  const purpose = url.searchParams.get("purpose");
  const email = url.searchParams.get("email");
  const appOrigin = getAppOrigin({ browserOrigin: url.origin });
  const hadExistingAuthSession =
    supabaseAuthCookieNames(request.cookies.getAll()).length > 0;
  const supabase = await createSupabaseServerClient();
  let verificationFailed = false;
  let staleSession = false;

  try {
    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      staleSession = isStaleSupabaseSessionError(result.error);
      if (result.error) console.warn("[auth/callback] code exchange failed", { name: result.error.name, code: result.error.code });
      verificationFailed = Boolean(result.error);
    } else if (tokenHash && type) {
      const result = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      staleSession = isStaleSupabaseSessionError(result.error);
      if (result.error) console.warn("[auth/callback] OTP verification failed", { name: result.error.name, code: result.error.code });
      verificationFailed = Boolean(result.error);
    } else {
      verificationFailed = true;
    }
  } catch (error) {
    console.warn("[auth/callback] auth exchange threw", { name: error instanceof Error ? error.name : typeof error });
    verificationFailed = true;
    staleSession = isStaleSupabaseSessionError(error);
  }

  let user: User | null = null;
  if (!verificationFailed) {
    try {
      const result = await supabase.auth.getUser();
      user = result.data.user;
      staleSession = isStaleSupabaseSessionError(result.error);
      verificationFailed = Boolean(result.error || !user);
    } catch (error) {
      console.warn("[auth/callback] user lookup threw", { name: error instanceof Error ? error.name : typeof error });
      staleSession = isStaleSupabaseSessionError(error);
      verificationFailed = true;
    }
  }

  if (verificationFailed || !user) {
    const failureDestination = providerInvite
      ? new URL(`/provider/invite/accept?${new URLSearchParams({ token: providerInvite, error: code ? "oauth" : "confirmation" })}`, appOrigin)
      : code || draft
        ? new URL(`/sign-in?${new URLSearchParams({ ...(draft ? { draft } : {}), ...(next !== "/portal" ? { next } : {}), error: code ? "oauth" : "confirmation" })}`, appOrigin)
        : failedCallbackDestination(next, email, appOrigin);
    const response = NextResponse.redirect(failureDestination);
    return staleSession
      ? expireAuthCookies(
          response,
          supabaseAuthCookieNames(request.cookies.getAll()),
        )
      : response;
  }

  if (providerInvite) {
    return NextResponse.redirect(
      new URL(
        `/provider/invite/accept?token=${encodeURIComponent(providerInvite)}`,
        appOrigin,
      ),
    );
  }

  const accountRole = await getCurrentAccountRole();
  if (accountRole === "admin") return NextResponse.redirect(new URL("/admin", appOrigin));
  if (accountRole === "customer" && (next === "/work" || next.startsWith("/work/"))) return NextResponse.redirect(new URL("/my-jobs", appOrigin));
  if (accountRole === "provider" && (next === "/my-jobs" || next === "/messages" || next.startsWith("/messages/"))) return NextResponse.redirect(new URL("/work", appOrigin));

  if (!url.searchParams.has("next") && !draft && !purpose && await getApprovedMarketplaceProvider())
    return NextResponse.redirect(new URL("/work", appOrigin));

  if (SIGNUP_CONFIRMATION_PURPOSES.has(purpose || "") && !hadExistingAuthSession)
    await supabase.auth.signOut();

  const customerFlow = Boolean(
    draft ||
      purpose === "customer-signup" ||
      next === "/portal" ||
      next === "/my-jobs" ||
      next.startsWith("/jobs/") ||
      next.startsWith("/messages/"),
  );
  if (customerFlow && !SIGNUP_CONFIRMATION_PURPOSES.has(purpose || "")) {
    const customer = await ensureMarketplaceCustomer(user);
    if (!customer)
      return NextResponse.redirect(
        new URL("/sign-in?error=profile", appOrigin),
      );
  }

  if (draft) {
    const published = await publishPendingMarketplaceJob(draft);
    if (published.token) return NextResponse.redirect(new URL("/my-jobs", appOrigin));
    return NextResponse.redirect(new URL(`/sign-in?draft=${encodeURIComponent(draft)}&error=${published.error || "publish"}`, appOrigin));
  }

  if (!url.searchParams.has("next") && !purpose)
    return NextResponse.redirect(new URL("/portal", appOrigin));

  return NextResponse.redirect(
    successfulCallbackDestination(next, purpose, user, appOrigin),
  );
}
