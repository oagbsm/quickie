import { createClient } from "@supabase/supabase-js";
import { markCompletedUnconfirmed, recordProviderReply, runPolForRequest, sendPolMatchToProvider } from "../actions";
import MayaGrowthPanel from "./components/MayaGrowthPanel";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestRow = {
  id: string;
  service: string | null;
  area: string | null;
  postcode: string | null;
  time_needed: string | null;
  details: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
  admin_notes?: string | null;
  ready_for_pol?: boolean | null;
  cumar_status?: string | null;
  pol_status?: string | null;
  zayn_status?: string | null;
  provider_lane?: string | null;
  job_risk?: string | null;
  estimated_value?: number | null;
  customer_paid_amount?: number | null;
  customer_rating?: number | null;
  customer_issue?: string | null;
  customer_feedback?: string | null;
};

type BusinessRow = {
  id: string;
  business_name: string | null;
  category: string | null;
  status: string | null;
  active: boolean | null;
  provider_type?: string | null;
  auto_match_enabled?: boolean | null;
};

type MatchRow = {
  id: string;
  request_id: string | null;
  business_id: string | null;
  status: string | null;
  created_at: string | null;
  provider_reply?: string | null;
  rough_range?: string | null;
  quoted_price?: number | null;
  availability?: string | null;
};

function label(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDetail(details: string | null | undefined, name: string) {
  if (!details) return "Not provided";
  const line = details
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${name.toLowerCase()}:`));

  if (!line) return "Not provided";
  return line.slice(line.indexOf(":") + 1).trim();
}

function statusStyle(status: string | null | undefined) {
  const value = status || "new";

  if (["ready_for_pol", "completed", "done", "accepted", "customer_contacted", "in_progress"].includes(value)) return "bg-[#dcfce7] text-[#08783f]";
  if (["provider_marked_completed", "confirm_customer_satisfaction"].includes(value)) return "bg-[#e8fbff] text-[#0891b2]";
  if (["matching", "matching_in_progress", "sent_to_providers", "queued"].includes(value)) return "bg-[#efe7ff] text-[#6d28d9]";
  if (
    [
      "failed_no_provider",
      "matching_failed",
      "cancelled",
      "rejected",
      "issue_reported",
      "customer_reported_issue",
      "needs_review",
      "not_completed",
    ].includes(value)
  )
    return "bg-[#ffe4e8] text-[#d4142a]";
  if (["needs_customer_info", "waiting", "sent", "needs_more_info", "unclear", "customer_no_answer", "customer_unreachable"].includes(value)) return "bg-[#fff0d9] text-[#c45500]";

  return "bg-[#eef4ff] text-[#24436f]";
}

function extractWhatsappLink(value: string | null | undefined) {
  if (!value) return "";
  const match = value.match(/https:\/\/wa\.me\/[^\s]+/);
  return match ? match[0] : "";
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function MetricCard({
  icon,
  title,
  value,
  note,
  tone,
}: {
  icon: string;
  title: string;
  value: number;
  note: string;
  tone: "blue" | "green" | "purple" | "orange" | "cyan" | "red";
}) {
  const toneClass = {
    blue: "bg-[#e9f1ff] text-[#075cff] from-[#2d7fff]",
    green: "bg-[#e7f9ef] text-[#079448] from-[#16b866]",
    purple: "bg-[#f0e8ff] text-[#6d28d9] from-[#7c3aed]",
    orange: "bg-[#fff0db] text-[#f36b00] from-[#f97316]",
    cyan: "bg-[#e8fbff] text-[#0891b2] from-[#06b6d4]",
    red: "bg-[#ffe4e8] text-[#d4142a] from-[#ef233c]",
  }[tone];

  return (
    <div className="min-h-[138px] rounded-[20px] border border-[#e3eaf5] bg-white p-4 shadow-[0_14px_34px_rgba(7,22,56,0.055)]">
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[21px] ${toneClass}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[33px] font-black leading-none tracking-[-0.06em] text-[#071638]">{value}</p>
          <p className="mt-1 text-[13px] font-black leading-tight text-[#071638]">{title}</p>
          <p className="text-[11px] font-semibold leading-tight text-[#63708a]">{note}</p>
        </div>
      </div>
      <div className="mt-4 flex h-6 items-end gap-1 overflow-hidden">
        {[20, 24, 23, 30, 29, 38, 31, 35, 28, 34, 30, 39, 33, 37].map((height, index) => (
          <span
            key={index}
            className={`flex-1 rounded-full bg-gradient-to-t ${toneClass.split(" ").find((part) => part.startsWith("from-")) || "from-[#075cff]"} to-transparent opacity-65`}
            style={{ height: `${height + 22}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function Sidebar({
  counts,
  activeView,
}: {
  counts: { cumar: number; pol: number; zayn: number; maya: number; escalations: number };
  activeView: string;
}) {
  const items = [
    ["🏠", "Overview", "overview", "", "?view=overview"],
    ["🤖", "Cumar", "cumar", counts.cumar, "?view=overview"],
    ["👾", "Pol", "pol", counts.pol, "?view=overview"],
    ["🧡", "Zayn", "zayn", counts.zayn, "?view=overview"],
    ["🌸", "Maya", "maya", counts.maya, "?view=maya"],
    ["👥", "Providers", "providers", "", "?view=overview"],
    ["⚠️", "Escalations", "escalations", counts.escalations, "?view=overview"],
    ["⚙️", "Settings", "settings", "", "?view=overview"],
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[240px] overflow-y-auto bg-[#061638] px-4 py-5 text-white lg:block">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-[28px] shadow-[0_0_0_5px_rgba(0,255,150,0.18)]">🚀</div>
        <div>
          <p className="text-[26px] font-black tracking-[-0.05em]">Quickola</p>
          <p className="text-[12px] font-black text-[#27e878]">OPS Command Centre</p>
        </div>
      </div>

      <nav className="mt-7 space-y-2">
        {items.map(([icon, name, view, count, href]) => {
          const isActive = activeView === view || (activeView === "overview" && view === "overview");

          return (
          <a
            key={String(name)}
            href={String(href)}
            className={`flex items-center justify-between rounded-[15px] px-4 py-2.5 ${isActive ? "bg-[#075cff] shadow-[0_14px_30px_rgba(0,92,255,0.35)]" : "hover:bg-white/8"}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[22px]">{icon}</span>
              <p className="text-[15px] font-black">{name}</p>
            </div>
            {count ? <span className="rounded-full bg-white/14 px-2.5 py-1 text-[12px] font-black">{count}</span> : null}
          </a>
          );
        })}
      </nav>

      <div className="mt-6 rounded-[18px] border border-white/10 bg-white/5 p-4">
        <p className="text-[13px] font-black">🟢 System Status</p>
        <p className="mt-1 text-[12px] font-bold text-[#27e878]">All systems operational</p>
        <div className="mt-5 space-y-3 text-[12px] font-bold">
          {[["Cumar Agent"], ["Pol Agent"], ["Zayn Agent"], ["Maya Agent"]].map(([name]) => (
            <div key={name} className="flex justify-between">
              <span>✅ {name}</span>
              <span className="text-[#27e878]">Online</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/5 p-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[22px]">👤</div>
        <div>
          <p className="text-[15px] font-black">Omar <span className="rounded-full bg-[#075cff] px-2 py-0.5 text-[10px]">Admin</span></p>
          <p className="text-[12px] font-semibold text-white/75">Quickola Admin</p>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-[32px] font-black leading-none tracking-[-0.06em] text-[#071638]">Overview</h1>
        <p className="mt-1 text-[15px] font-semibold text-[#53627d]">Live operations at a glance</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-[48px] w-full items-center gap-3 rounded-[17px] bg-white px-5 text-[#7a869c] shadow-[0_12px_28px_rgba(7,22,56,0.05)] ring-1 ring-[#e4ebf6] sm:w-[360px]">
          <span>⌕</span>
          <span className="text-[14px] font-semibold">Search requests, providers...</span>
        </div>
        <div className="flex h-[48px] items-center gap-3 rounded-[18px] bg-white px-5 text-[14px] font-black shadow-[0_14px_32px_rgba(7,22,56,0.055)] ring-1 ring-[#e4ebf6]">📅 Today, 25 May⌄</div>
        <div className="relative grid h-[48px] w-[48px] place-items-center rounded-full bg-white text-[22px] shadow-[0_14px_32px_rgba(7,22,56,0.055)] ring-1 ring-[#e4ebf6]">
          🔔
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#ef233c] text-[12px] font-black text-white">7</span>
        </div>
      </div>
    </div>
  );
}

async function getOpsData() {
  const supabaseAdmin = getSupabaseAdmin();

  const [requestsResult, businessesResult, matchesResult] = await Promise.all([
    supabaseAdmin
      .from("requests")
      .select("id, service, area, postcode, time_needed, details, phone, email, status, source, created_at, admin_notes, ready_for_pol, cumar_status, pol_status, zayn_status, provider_lane, job_risk, estimated_value, customer_paid_amount, customer_rating, customer_issue, customer_feedback")
      .order("created_at", { ascending: false })
      .limit(60),
    supabaseAdmin
      .from("businesses")
      .select("id, business_name, category, status, active, provider_type, auto_match_enabled")
      .order("created_at", { ascending: false })
      .limit(120),
    supabaseAdmin
      .from("request_matches")
      .select("id, request_id, business_id, status, created_at, provider_reply, rough_range, quoted_price, availability")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (requestsResult.error) console.error("Ops v2 requests error:", requestsResult.error);
  if (businessesResult.error) console.error("Ops v2 businesses error:", businessesResult.error);
  if (matchesResult.error) console.error("Ops v2 matches error:", matchesResult.error);

  return {
    requests: (requestsResult.data || []) as RequestRow[],
    businesses: (businessesResult.data || []) as BusinessRow[],
    matches: (matchesResult.data || []) as MatchRow[],
  };
}

export default async function OpsV2Page({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const { requests, businesses, matches } = await getOpsData();
  const query = await searchParams;
  const activeView = query?.view === "maya" ? "maya" : "overview";
  const mayaBusinesses = businesses.map((business) => ({
    ...business,
    active: business.active ?? null,
  }));

  const newRequests = requests.filter((request) => request.status === "new").length;
  const cumarNeedsInfo = requests.filter((request) =>
    request.status === "needs_customer_info"
    || request.cumar_status === "needs_customer_info"
    || (request.ready_for_pol !== true && !["completed", "completed_unconfirmed", "cancelled", "issue_reported"].includes(request.status || ""))
  ).length;
  const readyForPol = requests.filter((request) => request.ready_for_pol && request.pol_status === "waiting").length;
  const sentToProviders = matches.filter((match) => match.status === "sent").length;
  const providerReplyStatuses = ["accepted", "quoted_rough", "rejected", "needs_more_info", "unclear", "customer_contacted", "customer_no_answer", "customer_unreachable", "in_progress"];
  const providerReplies = matches.filter((match) => providerReplyStatuses.includes(match.status || "")).length;
  const zaynFollowUps = requests.filter((request) =>
    request.zayn_status === "follow_up_needed"
    || ["customer_contacted", "customer_no_answer", "customer_unreachable", "provider_accepted"].includes(request.pol_status || "")
    || ["provider_assigned", "in_progress"].includes(request.status || "")
  ).length;
  const issueReviews = requests.filter((request) =>
    request.status === "issue_reported"
    || request.pol_status === "customer_reported_issue"
    || request.zayn_status === "needs_review"
  ).length;
  const awaitingCustomerConfirmation = requests.filter((request) =>
    request.zayn_status === "confirm_customer_satisfaction"
    || request.pol_status === "provider_marked_completed"
    || request.status === "provider_marked_completed"
  ).length;
  const completedConfirmed = requests.filter((request) =>
    ["completed", "done"].includes(request.status || "") &&
    ["completed_happy", "customer_confirmed_completed"].includes(request.zayn_status || request.pol_status || "") &&
    request.pol_status !== "provider_marked_completed"
  ).length;
  const completedUnconfirmed = requests.filter((request) =>
    request.status === "completed_unconfirmed"
    || request.zayn_status === "completed_unconfirmed"
    || request.pol_status === "customer_no_response"
  ).length;
  const completed = completedConfirmed + completedUnconfirmed;
  const noProviderFailures = requests.filter((request) => request.pol_status === "failed_no_provider" || request.status === "matching_failed").length;
  const missingContact = requests.filter((request) => !request.email && !request.phone).length;
  const highRisk = requests.filter((request) => request.job_risk === "high").length;
  const escalationCount = noProviderFailures + highRisk + missingContact + issueReviews;

  const latestRequests = requests.slice(0, 5);
  const recentMatches = matches.slice(0, 3);
  const requestById = new Map(requests.map((request) => [request.id, request]));
  const businessById = new Map(businesses.map((business) => [business.id, business]));
  const polQueue = matches
    .filter((match) => ["queued", "sent", "needs_more_info", "unclear"].includes(match.status || ""))
    .slice(0, 5);

  const zaynQueue = requests
    .filter((request) =>
      (
        request.zayn_status === "follow_up_needed"
        || ["customer_contacted", "customer_no_answer", "customer_unreachable", "provider_accepted"].includes(request.pol_status || "")
        || ["provider_assigned", "in_progress"].includes(request.status || "")
      )
      && request.status !== "cancelled"
      && request.status !== "issue_reported"
      && request.pol_status !== "customer_reported_issue"
      && request.zayn_status !== "needs_review"
    )
    .slice(0, 5);

  const customerConfirmationQueue = requests
    .filter((request) =>
      request.zayn_status === "confirm_customer_satisfaction"
      || request.pol_status === "provider_marked_completed"
      || request.status === "provider_marked_completed"
    )
    .slice(0, 5);

  const issueReviewQueue = requests
    .filter((request) =>
      request.status === "issue_reported"
      || request.pol_status === "customer_reported_issue"
      || request.zayn_status === "needs_review"
    )
    .slice(0, 5);

  const readyForPolRequests = requests
    .filter((request) => request.ready_for_pol && request.pol_status === "waiting")
    .slice(0, 3);

  const serviceCounts = requests.reduce<Record<string, number>>((acc, request) => {
    const key = label(request.service);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topServices = Object.entries(serviceCounts).slice(0, 5);
  const siteUrl = getSiteUrl();

  return (
    <main className="min-h-screen bg-[#f3f7fc] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:pl-[240px]">
      <Sidebar counts={{ cumar: cumarNeedsInfo, pol: polQueue.length + readyForPol, zayn: zaynFollowUps + awaitingCustomerConfirmation, maya: topServices.length, escalations: escalationCount }} activeView={activeView} />
      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7">
        {activeView === "maya" ? null : (
          <>
            <TopBar />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
              <MetricCard icon="🧎" title="New Requests" value={newRequests} note="Fresh intake" tone="blue" />
              <MetricCard icon="🤖" title="Cumar Needs Info" value={cumarNeedsInfo} note="Incomplete requests" tone="orange" />
              <MetricCard icon="👾" title="Ready for Pol" value={readyForPol} note="Waiting to match" tone="green" />
              <MetricCard icon="✉️" title="Sent to Providers" value={sentToProviders} note="Awaiting replies" tone="purple" />
              <MetricCard icon="🧡" title="Zayn Follow-ups" value={zaynFollowUps} note="Needs action" tone="orange" />
              <MetricCard icon="🔎" title="Awaiting Confirmation" value={awaitingCustomerConfirmation} note="Provider marked done" tone="cyan" />
              <MetricCard icon="☑️" title="Completed" value={completed} note={`${completedConfirmed} confirmed, ${completedUnconfirmed} unconfirmed`} tone="green" />
            </div>
          </>
        )}

        {activeView === "maya" ? (
          <div className="mt-5">
            <MayaGrowthPanel requests={requests} businesses={mayaBusinesses} matches={matches} />
          </div>
        ) : (
        <div className="mt-5 grid items-start gap-5">
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 shadow-[0_16px_38px_rgba(7,22,56,0.055)] sm:p-5">
              <h2 className="text-[19px] font-black tracking-[-0.04em]">Request Pipeline</h2>
              <p className="mt-1 text-[13px] font-semibold text-[#63708a]">Total {requests.length} active requests</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {[
                  ["New", newRequests],
                  ["Cumar", cumarNeedsInfo],
                  ["Ready", readyForPol],
                  ["Queued", polQueue.filter((match) => match.status === "queued").length],
                  ["Sent", sentToProviders],
                  ["Zayn", zaynFollowUps],
                  ["Confirm", awaitingCustomerConfirmation],
                  ["Issues", issueReviews],
                  ["Done", completed],
                ].map(([name, value], index) => (
                  <div key={String(name)} className="flex items-center gap-2">
                    <div className={`min-w-[72px] rounded-full px-3 py-2 text-center ring-1 ${index === 3 ? "bg-[#efe7ff] text-[#6d28d9] ring-[#dccbff]" : "bg-[#f7faff] text-[#24436f] ring-[#dfe7f3]"}`}>
                      <p className="text-[11px] font-black">{name}</p>
                      <p className="mt-1 text-[20px] font-black tracking-[-0.05em]">{value}</p>
                    </div>
                    {index < 8 ? <span className="text-[#b8c3d4]">→</span> : null}
                  </div>
                ))}
              </div>

              <h3 className="mt-5 text-[13px] font-black">Live updates</h3>
              <div className="mt-2 divide-y divide-[#edf2f8]">
                {latestRequests.slice(0, 5).map((request, index) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9f6ff] text-[18px]">{["🤖", "👾", "✉️", "🦊", "✅"][index] || "🤖"}</span>
                      <div>
                        <p className="text-[13px] font-black">{request.pol_status === "customer_contacted" ? "Customer contacted" : request.pol_status === "customer_no_answer" ? "Customer did not answer" : request.pol_status === "customer_unreachable" ? "Customer unreachable" : request.pol_status === "provider_accepted" ? "Provider accepted" : index === 0 ? "Cumar completed a request" : index === 1 ? "Pol matched providers" : index === 2 ? "Provider message sent" : "Zayn follow-up pending"}</p>
                        <p className="text-[12px] font-semibold text-[#63708a]">{label(getDetail(request.details, "Job type"))} · {request.postcode || label(request.area)}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(request.pol_status || request.status)}`}>{label(request.pol_status || request.status)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 shadow-[0_16px_38px_rgba(7,22,56,0.055)] sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-black tracking-[-0.04em]">Pol Queue</h2>
                  <p className="text-[12px] font-semibold text-[#63708a]">Send provider offers and manage replies before Zayn takes over.</p>
                </div>
                <span className="w-fit rounded-full bg-[#efe7ff] px-3 py-1 text-[12px] font-black text-[#6d28d9]">{polQueue.length} active</span>
              </div>

              {readyForPolRequests.length ? (
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  {readyForPolRequests.map((request) => (
                    <div key={request.id} className="rounded-[18px] border border-[#dcebe1] bg-[#f7fcf8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-[#071638]">{label(request.service)}</p>
                          <p className="mt-1 text-[12px] font-bold text-[#63708a]">{request.postcode || label(request.area)} · {label(getDetail(request.details, "Job type"))}</p>
                          <p className="mt-1 text-[12px] font-black text-[#08783f]">Ready for Pol</p>
                        </div>
                        <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-black text-[#08783f]">Waiting</span>
                      </div>

                      <form action={runPolForRequest} className="mt-3">
                        <input type="hidden" name="request_id" value={request.id} />
                        <button type="submit" className="h-10 w-full rounded-[13px] bg-[#08783f] px-4 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(8,120,63,0.16)] transition hover:-translate-y-0.5">
                          Run Pol matching
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {polQueue.length ? polQueue.map((match) => {
                  const request = match.request_id ? requestById.get(match.request_id) : null;
                  const business = match.business_id ? businessById.get(match.business_id) : null;
                  const whatsappLink = extractWhatsappLink(match.provider_reply);
                  const canSend = match.status === "queued";
                  const canOpenWhatsapp = match.status === "sent" && Boolean(whatsappLink);
                  const canRecordReply = ["sent", "unclear", "needs_more_info"].includes(match.status || "");

                  return (
                    <div key={match.id} className="rounded-[18px] border border-[#e7edf6] bg-[#fbfdff] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-[#071638]">{business?.business_name || "Provider not found"}</p>
                          <p className="mt-1 text-[12px] font-bold text-[#63708a]">{label(request?.service)} · {request?.postcode || label(request?.area)}</p>
                          <p className="mt-1 text-[12px] font-semibold text-[#63708a]">{match.rough_range || (match.quoted_price ? `£${match.quoted_price}` : "No price yet")}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(match.status)}`}>{label(match.status)}</span>
                      </div>

                      {canSend ? (
                        <form action={sendPolMatchToProvider} className="mt-3">
                          <input type="hidden" name="request_match_id" value={match.id} />
                          <button type="submit" className="h-10 w-full rounded-[13px] bg-[#075cff] px-4 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(0,92,255,0.18)] transition hover:-translate-y-0.5">
                            Send to provider
                          </button>
                        </form>
                      ) : null}

                      {canOpenWhatsapp ? (
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-3 flex h-10 w-full items-center justify-center rounded-[13px] bg-[#08783f] px-4 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(8,120,63,0.16)] transition hover:-translate-y-0.5">
                          Open WhatsApp message
                        </a>
                      ) : null}

                      {canRecordReply ? (
                        <form action={recordProviderReply} className="mt-3 space-y-2">
                          <input type="hidden" name="request_match_id" value={match.id} />
                          <input name="provider_reply" placeholder="YES £40 TODAY 5PM" className="h-10 w-full rounded-[13px] border border-[#dfe7f2] bg-white px-3 text-[12px] font-bold text-[#071638] outline-none placeholder:text-[#8a96aa] focus:border-[#075cff]" />
                          <button type="submit" className="h-10 w-full rounded-[13px] bg-[#071638] px-4 text-[12px] font-black text-white transition hover:-translate-y-0.5">
                            Save provider reply
                          </button>
                        </form>
                      ) : null}
                    </div>
                  );
                }) : (
                  <div className="rounded-[18px] border border-[#e7edf6] bg-[#fbfdff] p-4 text-[13px] font-bold text-[#63708a]">
                    No active Pol matches yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 shadow-[0_16px_38px_rgba(7,22,56,0.055)] sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-black tracking-[-0.04em]">Zayn Follow-up</h2>
                  <p className="text-[12px] font-semibold text-[#63708a]">Provider accepted/contacted customer. Zayn checks progress before completion.</p>
                </div>
                <span className="w-fit rounded-full bg-[#fff0db] px-3 py-1 text-[12px] font-black text-[#f36b00]">{zaynQueue.length} active</span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {zaynQueue.length ? zaynQueue.map((request) => (
                  <div key={request.id} className="rounded-[18px] border border-[#f2dfaa] bg-[#fffdf7] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-black text-[#071638]">{label(getDetail(request.details, "Job type"))}</p>
                        <p className="mt-1 text-[12px] font-bold text-[#63708a]">{label(request.service)} · {request.postcode || label(request.area)}</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#63708a]">Phone: {request.phone || "Not provided"} · Email: {request.email || "Not provided"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(request.pol_status || request.status)}`}>{label(request.pol_status || request.status)}</span>
                    </div>
                    <div className="mt-3 rounded-[13px] bg-white px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#dfe7f2]">
                      {request.pol_status === "customer_contacted"
                        ? "Provider says they contacted the customer. Wait for provider to mark job outcome."
                        : request.pol_status === "customer_no_answer"
                          ? "Provider says the customer did not answer. Retry customer or send another provider."
                          : request.pol_status === "customer_unreachable"
                            ? "Provider says they cannot reach the customer. Check phone/email before retrying."
                            : "Provider accepted. Waiting for contact/update."}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[18px] border border-[#e7edf6] bg-[#fbfdff] p-4 text-[13px] font-bold text-[#63708a]">
                    No active Zayn follow-ups yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#d7edf3] bg-white p-4 shadow-[0_16px_38px_rgba(7,22,56,0.055)] sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-black tracking-[-0.04em]">Awaiting Customer Confirmation</h2>
                  <p className="text-[12px] font-semibold text-[#63708a]">Provider marked the job done. Customer must confirm before it counts as completed.</p>
                </div>
                <span className="w-fit rounded-full bg-[#e8fbff] px-3 py-1 text-[12px] font-black text-[#0891b2]">{customerConfirmationQueue.length} waiting</span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {customerConfirmationQueue.length ? customerConfirmationQueue.map((request) => {
                  const confirmationUrl = `${siteUrl}/c/customer-confirm/${request.id}`;
                  const confirmationMessage = `Hi, Quickola here. The provider has marked your ${label(getDetail(request.details, "Job type"))} job as completed.\n\nTo help us improve Quickola quality and provider standards, please confirm how the job went here:\n\n${confirmationUrl}\n\nIt takes less than 30 seconds.`;

                  return (
                    <div key={request.id} className="rounded-[18px] border border-[#d7edf3] bg-[#f7fdff] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-black text-[#071638]">{label(getDetail(request.details, "Job type"))}</p>
                          <p className="mt-1 text-[12px] font-bold text-[#63708a]">{label(request.service)} · {request.postcode || label(request.area)}</p>
                          <p className="mt-1 text-[12px] font-semibold text-[#63708a]">Provider amount: {request.estimated_value ? `£${request.estimated_value}` : "Not provided"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(request.zayn_status || request.pol_status || request.status)}`}>{label(request.zayn_status || request.pol_status || request.status)}</span>
                      </div>

                      <div className="mt-3 rounded-[13px] bg-white px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#dfe7f2]">
                        Do not count this as completed yet. Send the customer confirmation link and only close if the customer confirms they are happy.
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <a
                          href={confirmationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 items-center justify-center rounded-[13px] bg-[#0891b2] px-4 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(8,145,178,0.16)] transition hover:-translate-y-0.5"
                        >
                          Open confirmation page
                        </a>
                        {request.phone ? (
                          <a
                            href={`https://wa.me/${request.phone.replace(/\D/g, "")}?text=${encodeURIComponent(confirmationMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-10 items-center justify-center rounded-[13px] bg-[#08783f] px-4 text-[12px] font-black text-white shadow-[0_10px_22px_rgba(8,120,63,0.16)] transition hover:-translate-y-0.5"
                          >
                            Send WhatsApp check
                          </a>
                        ) : (
                          <span className="flex h-10 items-center justify-center rounded-[13px] bg-[#eef4ff] px-4 text-[12px] font-black text-[#63708a] ring-1 ring-[#dfe7f2]">
                            No phone saved
                          </span>
                        )}
                      </div>

                      <div className="mt-3 rounded-[13px] bg-[#f9fcff] p-3 ring-1 ring-[#dfe7f2]">
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#0891b2]">Customer confirmation link</p>
                        <p className="mt-1 break-all text-[12px] font-bold text-[#075cff]">{confirmationUrl}</p>
                      </div>

                      <div className="mt-3 rounded-[13px] bg-white p-3 ring-1 ring-[#dfe7f2]">
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#63708a]">Message to send</p>
                        <textarea
                          readOnly
                          value={confirmationMessage}
                          className="mt-2 min-h-[118px] w-full rounded-[12px] border border-[#e1e8f2] bg-[#fbfdff] px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] outline-none"
                        />
                      </div>

                      <form action={markCompletedUnconfirmed} className="mt-3 rounded-[13px] bg-[#fffdf7] p-3 ring-1 ring-[#f2dfaa]">
                        <input type="hidden" name="request_id" value={request.id} />
                        <input
                          type="hidden"
                          name="note"
                          value="Customer did not respond to the confirmation request. No issue reported before manual close."
                        />
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#8a5a00]">No customer response</p>
                        <p className="mt-1 text-[12px] font-bold leading-relaxed text-[#63708a]">
                          Use this only after you have given the customer enough time to respond and no complaint has come in.
                        </p>
                        <button
                          type="submit"
                          className="mt-3 h-10 w-full rounded-[13px] bg-white px-4 text-[12px] font-black text-[#8a5a00] ring-1 ring-[#f1d48a] transition hover:-translate-y-0.5"
                        >
                          Mark completed unconfirmed
                        </button>
                      </form>
                    </div>
                  );
                }) : (
                  <div className="rounded-[18px] border border-[#e7edf6] bg-[#fbfdff] p-4 text-[13px] font-bold text-[#63708a]">
                    No jobs awaiting customer confirmation.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#ffd4da] bg-white p-4 shadow-[0_16px_38px_rgba(7,22,56,0.055)] sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-black tracking-[-0.04em]">Issues / Needs Review</h2>
                  <p className="text-[12px] font-semibold text-[#63708a]">Customer reported a problem, low rating, or job not completed.</p>
                </div>
                <span className="w-fit rounded-full bg-[#ffe4e8] px-3 py-1 text-[12px] font-black text-[#d4142a]">{issueReviewQueue.length} issue</span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {issueReviewQueue.length ? issueReviewQueue.map((request) => (
                  <div key={request.id} className="rounded-[18px] border border-[#ffd4da] bg-[#fff8f9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-black text-[#071638]">{label(getDetail(request.details, "Job type"))}</p>
                        <p className="mt-1 text-[12px] font-bold text-[#63708a]">{label(request.service)} · {request.postcode || label(request.area)}</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#63708a]">Phone: {request.phone || "Not provided"} · Email: {request.email || "Not provided"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(request.zayn_status || request.pol_status || request.status)}`}>{label(request.zayn_status || request.pol_status || request.status)}</span>
                    </div>
                    <div className="mt-3 rounded-[13px] bg-white px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#ffd4da]">
                      Customer issue: {label(request.customer_issue)} · Rating: {request.customer_rating ? `${request.customer_rating}/5` : "Not provided"} · Paid: {request.customer_paid_amount ? `£${request.customer_paid_amount}` : "Not provided"}
                    </div>
                    {request.customer_feedback ? (
                      <div className="mt-2 rounded-[13px] bg-white px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#ffd4da]">
                        Feedback: {request.customer_feedback}
                      </div>
                    ) : null}
                    <div className="mt-2 rounded-[13px] bg-white px-3 py-2 text-[12px] font-bold leading-relaxed text-[#46536d] ring-1 ring-[#ffd4da]">
                      Action: contact the customer, review the provider, and decide whether to resend another provider or close as unresolved.
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[18px] border border-[#e7edf6] bg-[#fbfdff] p-4 text-[13px] font-bold text-[#63708a]">
                    No customer issues need review.
                  </div>
                )}
              </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-3">
              <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 sm:p-5 shadow-[0_16px_38px_rgba(7,22,56,0.055)]">
                <h2 className="text-[18px] font-black tracking-[-0.04em]">Agent Activity</h2>
                <p className="text-[12px] font-semibold text-[#63708a]">What each agent is doing</p>
                <div className="mt-4 space-y-3">
                  {[
                    ["🤖", "Cumar", "Completing request details", cumarNeedsInfo],
                    ["👾", "Pol", "Matching providers", polQueue.length],
                    ["🧡", "Zayn", "Following up", zaynFollowUps + awaitingCustomerConfirmation],
                    ["🌸", "Maya", "Marketing & growth", topServices.length],
                  ].map(([icon, name, text, count]) => (
                    <div key={String(name)} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef5ff] text-[20px]">{icon}</span>
                        <div>
                          <p className="text-[13px] font-black">{name}</p>
                          <p className="text-[12px] font-semibold text-[#63708a]">{text}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#eaf8ef] px-3 py-1 text-[12px] font-black text-[#08783f]">{count} Active</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 sm:p-5 shadow-[0_16px_38px_rgba(7,22,56,0.055)]">
                <h2 className="text-[18px] font-black tracking-[-0.04em]">Top Services Today</h2>
                <p className="text-[12px] font-semibold text-[#63708a]">By number of requests</p>
                <div className="mt-5 flex items-center gap-5">
                  <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_30%,#f59e0b_30%_58%,#7c3aed_58%_78%,#38bdf8_78%_100%)]">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                      <p className="text-[27px] font-black">{requests.length}</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {topServices.map(([name, count]) => (
                      <div key={name} className="flex justify-between gap-3 text-[12px] font-bold">
                        <span className="truncate"><span className="text-[#22c55e]">●</span> {name}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#e1e8f2] bg-white p-4 sm:p-5 shadow-[0_16px_38px_rgba(7,22,56,0.055)]">
                <h2 className="text-[18px] font-black tracking-[-0.04em]">Provider Replies</h2>
                <p className="text-[12px] font-semibold text-[#63708a]">Summary</p>
                <div className="mt-5 flex items-center gap-5">
                  <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_60%,#ef4444_60%_83%,#f59e0b_83%_93%,#cbd5e1_93%_100%)]">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                      <p className="text-[28px] font-black">{providerReplies || recentMatches.length}</p>
                      <p className="text-[10px] font-bold text-[#63708a]">Total replies</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[12px] font-bold">
                    <p><span className="text-[#22c55e]">●</span> Yes</p>
                    <p><span className="text-[#ef4444]">●</span> No</p>
                    <p><span className="text-[#f59e0b]">●</span> Maybe</p>
                    <p><span className="text-[#94a3b8]">●</span> No reply</p>
                  </div>
                </div>
                <div className="mt-4 rounded-[15px] bg-[#eaf8ef] px-4 py-3 text-[13px] font-black text-[#08783f]">✅ {providerReplies} provider actions recorded</div>
              </section>
            </div>
          </div>
        </div>
        )}
      </section>
    </main>
  );
}