import crypto from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { acceptWorkerInvitation } from "@/app/business/str-actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("worker_invitations")
    .select(
      "expires_at,accepted_at,revoked_at,workers(display_name),business_accounts(name)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();
  const valid = Boolean(
    invitation &&
    !invitation.accepted_at &&
    !invitation.revoked_at &&
    new Date(invitation.expires_at) > new Date(),
  );
  const worker = Array.isArray(invitation?.workers)
    ? invitation.workers[0]
    : invitation?.workers;
  const account = Array.isArray(invitation?.business_accounts)
    ? invitation.business_accounts[0]
    : invitation?.business_accounts;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-5">
      <div className="w-full max-w-lg rounded-xl border bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3 text-xl font-extrabold">
          <Image src="/quickola/logo-mark.png" alt="" width={38} height={38} />
          Quickola
        </div>
        <p className="mt-7 text-sm font-extrabold text-[#2d67b2]">
          CLEANER INVITATION
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {valid && account?.name
            ? `${account.name} invited you`
            : "Coordinate turnovers with your client"}
        </h1>
        <p className="mt-4 leading-7 text-[#657089]">
          Quickola helps short-term-rental operators coordinate the cleaners
          they already use. You can accept assignments, follow property
          checklists, upload evidence and report issues. Quickola does not
          employ you or handle cleaning payments.
        </p>
        {(!valid || error === "invalid") && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 font-bold text-red-800"
          >
            This invitation is invalid, expired, already used or has been
            revoked.
          </p>
        )}
        {error === "name" && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 font-bold text-red-800"
          >
            Enter the name you want your client to see.
          </p>
        )}
        {valid && user ? (
          <form action={acceptWorkerInvitation} className="mt-7">
            <input type="hidden" name="token" value={token} />
            <label className="font-bold">
              Confirm your name
              <input
                name="confirmedName"
                defaultValue={worker?.display_name || ""}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-lg border px-3 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15"
              />
            </label>
            <button className="mt-5 min-h-12 w-full rounded-lg bg-[#071f49] font-extrabold text-white">
              Confirm and accept invitation
            </button>
          </form>
        ) : valid ? (
          <Link
            href={`/business/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="mt-7 flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] font-extrabold text-white"
          >
            Sign in or create credentials
          </Link>
        ) : null}
      </div>
    </main>
  );
}
