import crypto from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  resendWorkerInvitation,
  revokeWorkerInvitation,
  setWorkerStatus,
  generateWorkerInviteLink,
} from "../../str-actions";
import CopyInviteLink from "../CopyInviteLink";
import CopyCleanerJobLink from "../CopyCleanerJobLink";
import { cookies } from "next/headers";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    link?: string;
    invited?: string;
    resent?: string;
    manual?: string;
    existing?: string;
    email?: string;
    error?: string;
    history?: string;
  }>;
}) {
  const { id } = await params,
    query = await searchParams;
  const { supabase, accountId, role } = await requireBusinessUser();
  const { data: worker } = await supabase
    .from("workers")
    .select(
      "*,assignments(id,status,assigned_at,work_items(id,turnover_date,status,properties(nickname))),property_workers(properties(id,nickname))",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!worker) notFound();
  let manualInvite: { token: string; expiresAt: string } | null = null;
  if (role === "owner" && worker.invitation_status === "pending" && query.link === "1") {
    const raw = (await cookies()).get(`quickola-invite-${id}`)?.value;
    if (raw) try { manualInvite = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")); } catch { manualInvite = null; }
  }
  if (manualInvite?.token) {
    const tokenHash = crypto.createHash("sha256").update(manualInvite.token).digest("hex");
    const { data: activeInvitation } = await supabase
      .from("worker_invitations")
      .select("id")
      .eq("worker_id", id)
      .eq("account_id", accountId)
      .eq("token_hash", tokenHash)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!activeInvitation) manualInvite = null;
  }
  const today=new Date().toISOString().slice(0,10);const assignments=worker.assignments||[];const history=query.history||"upcoming";const group=(a:{status:string;work_items:{turnover_date:string;status:string}})=>a.status==="cancelled"||a.work_items.status==="cancelled"?"cancelled":["ready","evidence_submitted"].includes(a.work_items.status)||a.work_items.turnover_date<today?"completed":"upcoming";const filtered=assignments.filter((a:{status:string;work_items:{turnover_date:string;status:string}})=>group(a)===history);const counts={upcoming:assignments.filter((a:{status:string;work_items:{turnover_date:string;status:string}})=>group(a)==="upcoming").length,completed:assignments.filter((a:{status:string;work_items:{turnover_date:string;status:string}})=>group(a)==="completed").length,cancelled:assignments.filter((a:{status:string;work_items:{turnover_date:string;status:string}})=>group(a)==="cancelled").length};const workerState=worker.status!=="active"?"Inactive":worker.invitation_status==="pending"?"Pending invitation":"Active cleaner";
  return (
    <div className="portal-page max-w-5xl">
      <Link
        href="/business/cleaners"
        className="text-sm font-bold text-[#526078]"
      >
        ← Cleaners
      </Link>
      <header className="portal-header mt-4 border-b pb-5">
        <div>
          <h1 className="portal-title">{worker.display_name}</h1>
          <p className="portal-subtitle">{workerState}</p>
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
      {(query.invited || query.resent || query.manual) && manualInvite?.token && (
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-extrabold text-blue-950">
            {query.manual ? "New invite link generated" : query.email === "failed" ? "Invitation created, but the email could not be sent" : query.email === "already_sent" ? "Invitation email already sent" : query.email === "processing" ? "Invitation email is already being sent" : query.resent ? "Invitation sent again" : "Invitation sent"}
          </h2>
          <p className="mt-1 text-sm text-blue-900">
            {query.email === "failed" ? "You can copy the invitation link and share it manually." : query.email === "already_sent" ? "The existing invitation email was already sent." : query.email === "processing" ? "Another send is already in progress." : "An invitation was sent to"} <strong>{worker.email}</strong>.
          </p>
          {manualInvite?.expiresAt && <p className="mt-1 text-sm text-blue-900">Expires {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(new Date(manualInvite.expiresAt))}</p>}
          <p className="mt-2 text-sm text-blue-900">Copy this private link and share it manually with the invited cleaner.</p>
          {query.email === "failed" && <p role="alert" className="mt-2 text-sm font-bold text-amber-900">The email could not be delivered, but the manual invitation link is active.</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3"><CopyInviteLink inviteToken={manualInvite.token} /></div>
        </section>
      )}
      {query.existing === "1" && (
        <p role="status" className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 font-bold text-blue-950">
          This cleaner already belongs to your team. No duplicate invitation was created.
        </p>
      )}
      <section className="mt-5 grid grid-cols-3 gap-3">{Object.entries(counts).map(([label,value])=><div key={label} className="portal-card p-3"><p className="text-xs font-bold capitalize text-[#65758c]">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>)}</section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <section className="portal-card p-5">
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
              {role === "owner" && worker.invitation_status === "pending" && <form action={generateWorkerInviteLink}><button name="workerId" value={id} className="min-h-11 w-full rounded-lg border px-3 text-sm font-extrabold">Generate new invite link</button></form>}
              <form action={resendWorkerInvitation}>
                <button
                  name="workerId"
                  value={id}
                  className="min-h-11 w-full rounded-lg bg-[#071f49] px-3 text-sm font-extrabold text-white"
                >
                  Resend email
                </button>
              </form>
              {worker.invitation_status === "pending" && (
                <form action={revokeWorkerInvitation}>
                  <button
                    name="workerId"
                    value={id}
                    className="min-h-10 w-full text-sm font-bold text-red-700"
                  >
                    Cancel invitation
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
        <section className="portal-panel">
          <div className="portal-panel-head flex-wrap"><h2 className="text-lg font-extrabold">Clean history</h2><nav aria-label="Cleaner history filters" className="flex rounded-lg bg-[#eef2f7] p-1 text-xs font-bold">{["upcoming","completed","cancelled"].map(value=><Link key={value} href={`/business/cleaners/${id}?history=${value}`} aria-current={history===value?"page":undefined} className={`rounded-md px-2.5 py-2 capitalize ${history===value?"bg-white shadow-sm":"text-[#65758c]"}`}>{value}</Link>)}</nav></div>
          <div className="divide-y px-5">
            {filtered.length ? (
              filtered.map(
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
                  <article key={a.id} className="py-3">
                    <Link href={`/business/turnovers/${a.work_items.id}`} className="block">
                      <p className="font-bold">{a.work_items.properties?.nickname}</p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                      <p className="text-[#657089]">
                        {a.work_items.turnover_date} · {a.status}
                      </p>
                      <span className="shrink-0 font-bold text-[#245b9d]">
                        View clean →
                      </span>
                    </div>
                    </Link>
                    {a.status !== "cancelled" && a.work_items.status !== "cancelled" && (
                      <div className="mt-3">
                        <CopyCleanerJobLink jobLink={buildAbsoluteAppUrl(`/cleaner/turnovers/${a.work_items.id}`)} />
                      </div>
                    )}
                  </article>
                ),
              )
            ) : (
              <p className="py-6 text-sm text-[#657089]">No {history} cleans.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
