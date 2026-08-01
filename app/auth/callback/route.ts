import { type EmailOtpType, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, safeInternalNextPath } from "@/lib/app-url";
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

  const signIn = new URL("/business/sign-in", appOrigin);
  signIn.searchParams.set("error", "confirmation");
  signIn.searchParams.set("next", next);
  if (email) signIn.searchParams.set("email", email);
  return signIn;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeInternalNextPath(url.searchParams.get("next"));
  const email = url.searchParams.get("email");
  const appOrigin = getAppOrigin();
  const supabase = await createSupabaseServerClient();
  let verificationFailed = false;
  let staleSession = false;

  try {
    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      verificationFailed = Boolean(result.error);
    } else if (tokenHash && type) {
      const result = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      verificationFailed = Boolean(result.error);
    } else {
      verificationFailed = true;
    }
  } catch (error) {
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
      staleSession = isStaleSupabaseSessionError(error);
      verificationFailed = true;
    }
  }

  if (verificationFailed || !user) {
    const response = NextResponse.redirect(
      failedCallbackDestination(next, email, appOrigin),
    );
    return staleSession
      ? expireAuthCookies(
          response,
          supabaseAuthCookieNames(request.cookies.getAll()),
        )
      : response;
  }

  return NextResponse.redirect(new URL(next, appOrigin));
}
