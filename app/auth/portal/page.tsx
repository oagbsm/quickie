import { redirect } from "next/navigation";
import { signOut } from "@/app/business/actions";
import { safeInternalNextPath } from "@/lib/app-url";
import { postLoginDestination, signInDestination } from "@/lib/portal-policy";
import { resolvePortalSession } from "@/lib/portal-session";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const query = await searchParams;
  const requestedNext = safeInternalNextPath(query.next, "") || null;
  const session = await resolvePortalSession();

  if (session.status === "unauthenticated")
    redirect(signInDestination(requestedNext || "/auth/portal"));
  if (session.status === "resolved") {
    if (session.portal === "business" && !requestedNext && session.business) {
      const [{ count }, { data: account }] = await Promise.all([
        session.supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("account_id", session.business.account_id),
        session.supabase
          .from("business_accounts")
          .select("onboarding_step,onboarding_completed_at")
          .eq("id", session.business.account_id)
          .maybeSingle(),
      ]);
      if (account?.onboarding_step !== "complete" && !account?.onboarding_completed_at)
        redirect("/business/continue");
      if ((count || 0) === 0) redirect("/business/properties/new?first=1");
    }
    redirect(postLoginDestination(session, requestedNext));
  }

  const pendingInvitation =
    session.status === "unassigned" &&
    session.reason === "cleaner_invitation_pending";
  const resolutionFailed =
    session.status === "error" || query.error === "resolution";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-5">
      <section className="w-full max-w-lg rounded-xl border bg-white p-7">
        <p className="text-sm font-extrabold text-[#2d67b2]">ACCOUNT ACCESS</p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {resolutionFailed
            ? "We couldn’t verify your portal."
            : pendingInvitation
              ? "Finish accepting your cleaner invitation."
              : "No portal role is assigned."}
        </h1>
        <p className="mt-4 leading-7 text-[#657089]">
          {resolutionFailed
            ? "Try again shortly. If this continues, contact Quickola support."
            : pendingInvitation
              ? "Open the invitation link from the business and select Accept invitation. Quickola will return you here automatically after email verification."
              : "This signed-in account is not an operator and does not have an accepted cleaner invitation. Contact the team that invited you or Quickola support."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {resolutionFailed && (
            <a
              href="/auth/portal"
              className="rounded-lg bg-[#071f49] px-5 py-3 text-center font-extrabold text-white"
            >
              Try again
            </a>
          )}
          <form action={signOut}>
            <button className="min-h-12 w-full rounded-lg border px-5 font-extrabold">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
