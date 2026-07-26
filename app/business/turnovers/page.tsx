import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import TurnoverStatus from "../components/TurnoverStatus";

type Row = { id: string; turnover_date: string; access_start_at: string; next_checkin_at: string; cleaning_type: string; status: string; properties: { nickname: string; postcode: string } | { nickname: string; postcode: string }[] | null; assignments: Array<{ status: string; workers: { display_name: string } | { display_name: string }[] | null }> };
const related = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase, accountId } = await requireBusinessUser();
  const { status } = await searchParams;
  let query = supabase.from("work_items").select("id,turnover_date,access_start_at,next_checkin_at,cleaning_type,status,properties(nickname,postcode),assignments(status,workers(display_name))").eq("account_id", accountId).order("access_start_at");
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const rows = (data || []) as Row[];
  return <div className="mx-auto max-w-[1240px]">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-extrabold text-[#2d67b2]">OPERATIONS</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Turnovers</h1><p className="mt-2 text-[#657089]">Every guest changeover, response and readiness decision.</p></div><Link href="/business/turnovers/new" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] px-5 font-extrabold text-white">Create turnover</Link></header>
    <nav aria-label="Turnover filters" className="mt-6 flex flex-wrap gap-2">{[["All",""],["Unassigned","unassigned"],["Awaiting response","awaiting_response"],["Action required","action_required"],["Ready","ready"]].map(([label,value]) => <Link key={label} href={value ? `/business/turnovers?status=${value}` : "/business/turnovers"} className={`min-h-10 rounded-lg border px-3 py-2 text-sm font-bold ${status === value || (!status && !value) ? "border-[#071f49] bg-[#071f49] text-white" : "bg-white"}`}>{label}</Link>)}</nav>
    <div className="mt-5 overflow-hidden rounded-xl border border-[#dfe4eb] bg-white">
      {rows.length ? <div className="divide-y divide-[#e7ebf0]">{rows.map(row => { const property = related(row.properties); const assignment = row.assignments?.find(a => ["pending","accepted"].includes(a.status)); const worker = related(assignment?.workers || null); return <Link href={`/business/turnovers/${row.id}`} key={row.id} className="grid gap-3 p-4 outline-none hover:bg-[#f8fafc] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2d67b2]/25 sm:grid-cols-[110px_minmax(180px,1fr)_160px_150px_24px] sm:items-center sm:p-5">
        <div><p className="text-xs font-bold text-[#748096]">DATE</p><p className="font-extrabold">{new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short"}).format(new Date(row.turnover_date))}</p><p className="text-sm text-[#657089]">{new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit"}).format(new Date(row.access_start_at))}</p></div>
        <div><p className="font-extrabold">{property?.nickname || "Property"}</p><p className="mt-1 text-sm text-[#657089]">{property?.postcode} · {row.cleaning_type.replaceAll("_"," ")}</p></div>
        <div><p className="text-xs font-bold text-[#748096]">CLEANER</p><p className="mt-1 text-sm font-bold">{worker?.display_name || "Not assigned"}</p></div>
        <TurnoverStatus status={row.status} /><span aria-hidden="true" className="text-xl text-[#718096]">›</span>
      </Link>})}</div> : <div className="p-10 text-center"><h2 className="text-xl font-extrabold">No turnovers yet</h2><p className="mt-2 text-[#657089]">Create a turnover to coordinate the next guest changeover.</p><Link href="/business/turnovers/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white">Create turnover</Link></div>}
    </div>
  </div>;
}
