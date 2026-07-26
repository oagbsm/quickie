import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  resendWorkerInvitation,
  revokeWorkerInvitation,
  setWorkerStatus,
} from "../../str-actions";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    token?: string;
    invited?: string;
    resent?: string;
    error?: string;
  }>;
}) {
  const { id } = await params,
    query = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  const { data: worker } = await supabase
    .from("workers")
    .select(
      "*,assignments(id,status,assigned_at,work_items(id,turnover_date,status,properties(nickname))),property_workers(properties(id,nickname))",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!worker) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/business/cleaners"
        className="text-sm font-bold text-[#526078]"
      >
        ← Cleaners
      </Link>
      <header className="mt-4 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{worker.display_name}</h1>
          <p className="mt-1 text-[#657089]">
            {worker.company_name || "Independent cleaner"} ·{" "}
            {worker.invitation_status.replaceAll("_", " ")}
          </p>
        </div>
        <form action={setWorkerStatus}>
          <input type="hidden" name="workerId" value={id} />
          <input
            type="hidden"
            name="status"
            value={worker.status === "active" ? "inactive" : "active"}
          />
          <button className="min-h-11 rounded-lg border bg-white px-4 font-bold">
            {worker.status === "active" ? "Deactivate" : "Reactivate"}
          </button>
        </form>
      </header>
      {query.error === "rate_limited" && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 font-bold text-amber-950"
        >
          An invitation was created less than a minute ago. Wait briefly before
          creating another secure link.
        </p>
      )}
      {(query.invited || query.resent) && query.token && (
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-extrabold text-blue-950">
            {query.resent ? "New invitation created" : "Invitation created"}
          </h2>
          <p className="mt-1 text-sm text-blue-900">
            Share this private, seven-day link using{" "}
            {worker.preferred_contact_method}. It is shown only now.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-lg bg-white p-3 text-sm">
            /invite/{query.token}
          </code>
        </section>
      )}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-extrabold">Contact</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-bold text-[#59677d]">Email</dt>
              <dd>{worker.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[#59677d]">Mobile</dt>
              <dd>{worker.mobile || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[#59677d]">Preferred contact</dt>
              <dd className="capitalize">{worker.preferred_contact_method}</dd>
            </div>
          </dl>
          {worker.invitation_status !== "accepted" && (
            <div className="mt-5 grid gap-2 border-t pt-4">
              <form action={resendWorkerInvitation}>
                <button
                  name="workerId"
                  value={id}
                  className="min-h-11 w-full rounded-lg bg-[#071f49] px-3 text-sm font-extrabold text-white"
                >
                  Resend invitation
                </button>
              </form>
              {worker.invitation_status === "pending" && (
                <form action={revokeWorkerInvitation}>
                  <button
                    name="workerId"
                    value={id}
                    className="min-h-10 w-full text-sm font-bold text-red-700"
                  >
                    Revoke invitation
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-extrabold">Turnover history</h2>
          <div className="mt-3 divide-y">
            {worker.assignments?.length ? (
              worker.assignments.map(
                (a: {
                  id: string;
                  status: string;
                  work_items: {
                    id: string;
                    turnover_date: string;
                    status: string;
                    properties: { nickname: string };
                  };
                }) => (
                  <Link
                    key={a.id}
                    href={`/business/turnovers/${a.work_items.id}`}
                    className="block py-3"
                  >
                    <p className="font-bold">
                      {a.work_items.properties?.nickname}
                    </p>
                    <p className="text-sm text-[#657089]">
                      {a.work_items.turnover_date} · {a.status}
                    </p>
                  </Link>
                ),
              )
            ) : (
              <p className="text-sm text-[#657089]">No assigned turnovers.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
