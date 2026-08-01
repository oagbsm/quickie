import Image from "next/image";
import { resolvePortalSession } from "@/lib/portal-session";
import { getCleanerInvitation } from "@/lib/server/cleaner-invitations";
import InvitationCredentials, {
  InvitationAccountMismatch,
  InvitationAcceptButton,
} from "./InvitationCredentials";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  // The invitation token is authoritative for rendering this page. Auth is an
  // optional enhancement used only to offer the signed-in account a direct
  // acceptance button or the wrong-email recovery state.
  const invitation = await getCleanerInvitation(token);
  let session: Awaited<ReturnType<typeof resolvePortalSession>> | null = null;
  if (invitation?.state === "valid") {
    try {
      session = await resolvePortalSession();
    } catch {
      // A malformed/stale cookie must not block a valid invitation.
      session = null;
    }
  }
  const valid = invitation?.state === "valid";
  const userEmail = session?.user?.email?.trim().toLowerCase() || null;
  const emailMatches = Boolean(
    valid && userEmail === invitation.invitedEmail,
  );

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-5">
      <section className="w-full max-w-lg rounded-xl border bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3 text-xl font-extrabold">
          <Image src="/quickola/logo-mark.png" alt="" width={38} height={38} />
          Quickola
        </div>
        <p className="mt-7 text-sm font-extrabold text-[#2d67b2]">
          CLEANER INVITATION
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {invitation
            ? `${invitation.businessName} invited you`
            : "This invitation isn’t available"}
        </h1>
        {valid && (
          <p className="mt-4 leading-7 text-[#657089]">
            You’ll receive cleaning jobs from {invitation.businessName} through
            Quickola.
          </p>
        )}

        {invitation && valid && (
          <p className="mt-4 text-sm leading-6 text-[#657089]">
            Sent to <strong>{invitation.invitedEmail}</strong>
            <br />
            Expires{" "}
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(new Date(invitation.expiresAt))}
          </p>
        )}

        {invitation &&
          invitation.state === "expired" && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-amber-50 p-4 font-bold"
            >
              This invitation has expired. Ask {invitation.businessName} to
              resend it.
            </p>
          )}
        {invitation?.state === "accepted" && <div role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 font-bold text-emerald-900"><p>This invitation has already been accepted. Sign in with {invitation.invitedEmail} to continue.</p><a href="/auth/portal?next=%2Fcleaner%2Ftoday" className="mt-3 inline-block text-sm underline">Sign in</a></div>}
        {(!invitation || invitation.state === "invalid") && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-amber-50 p-4 font-bold"
          >
            This invitation is invalid or has been cancelled. Ask the business
            to resend it.
          </p>
        )}
        {valid && query.error === "verification" && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800"
          >
            We couldn’t verify that link. Enter your password to try again.
          </p>
        )}

        {valid && session?.user && !emailMatches && (
          <InvitationAccountMismatch
            email={invitation.invitedEmail}
            token={token}
          />
        )}
        {valid &&
          session?.user &&
          emailMatches &&
          session.portal !== null && (
            <p
              role="alert"
              className="mt-7 rounded-lg bg-amber-50 p-4 font-bold"
            >
              This account already belongs to the {session.portal} portal and
              cannot accept another portal role. Ask {invitation.businessName} to
              invite a different email.
            </p>
          )}
        {valid &&
          session?.user &&
          emailMatches &&
          session.portal === null && (
            <InvitationAcceptButton
              email={invitation.invitedEmail}
              token={token}
            />
          )}
        {valid && !session?.user && (
          <InvitationCredentials
            email={invitation.invitedEmail}
            token={token}
          />
        )}
      </section>
    </main>
  );
}
