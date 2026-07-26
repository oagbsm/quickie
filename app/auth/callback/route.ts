import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, safeInternalNextPath } from "@/lib/app-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeInternalNextPath(url.searchParams.get("next"));
  const appOrigin = getAppOrigin();
  const supabase = await createSupabaseServerClient();
  let error: { message: string } | null = null;

  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  else error = { message: "Missing confirmation credentials" };

  const { data: { user } } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("business_auth_callback_failed", { hasCode: Boolean(code), hasTokenHash: Boolean(tokenHash), type, authenticated: Boolean(user) });
    return NextResponse.redirect(
      new URL("/business/sign-in?error=confirmation", appOrigin),
    );
  }
  if (process.env.NODE_ENV !== "production") console.info("business_auth_callback_complete", { userId: user.id, type });
  return NextResponse.redirect(new URL(next, appOrigin));
}
