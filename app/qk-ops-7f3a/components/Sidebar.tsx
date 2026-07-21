import type { AdminTab } from "../types";
import Image from "next/image";
import Link from "next/link";

function NavButton({
  active,
  label,
  count,
  href,
}: {
  active: boolean;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`flex h-11 items-center justify-between rounded-[13px] px-4 text-[14px] font-black transition ${
        active
          ? "bg-[#071638] text-white shadow-[0_12px_28px_rgba(7,22,56,0.16)]"
          : "bg-white text-[#44506a] ring-1 ring-[#e1e6ee] hover:-translate-y-0.5 hover:text-[#071638] hover:ring-[#cbd3df]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`grid min-w-8 place-items-center rounded-full px-2 py-1 text-[12px] font-black ${
          active ? "bg-white/14 text-white" : "bg-[#f4f7fb] text-[#071638]"
        }`}
      >
        {count}
      </span>
    </a>
  );
}

function StatusLink({
  active,
  label,
  count,
  href,
}: {
  active: boolean;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`flex h-9 items-center justify-between rounded-[11px] px-3 text-[13px] font-black transition ${
        active
          ? "bg-[#071638] text-white"
          : "bg-white text-[#657089] ring-1 ring-[#e1e6ee] hover:text-[#071638] hover:ring-[#cbd3df]"
      }`}
    >
      <span>{label}</span>
      <span className={active ? "text-white" : "text-[#071638]"}>{count}</span>
    </a>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[15px] border border-[#e1e6ee] bg-white p-3 shadow-[0_10px_24px_rgba(7,22,56,0.035)]">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">{label}</p>
      <p className="mt-1 text-[23px] font-black leading-none tracking-[-0.04em] text-[#071638]">{value}</p>
    </div>
  );
}

export default function Sidebar({
  activeTab,
  activeStatus,
  requestCount,
  businessCount,
  newRequestCount,
  matchedRequestCount,
  completedRequestCount,
  cancelledRequestCount,
  pendingBusinessCount,
}: {
  activeTab: AdminTab;
  activeStatus: string;
  requestCount: number;
  businessCount: number;
  newRequestCount: number;
  matchedRequestCount: number;
  completedRequestCount: number;
  cancelledRequestCount: number;
  pendingBusinessCount: number;
}) {
  return (
    <aside className="w-full border-b border-[#dfe5ee] bg-[#f7f9fb] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
      <Link href="/" className="flex items-center gap-3" aria-label="Quickola homepage">
        <Image
          src="/quickola/logo-mark.png"
          alt="Quickola"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="text-[24px] font-black leading-none tracking-[-0.05em] text-[#071638]">Quickola</p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#08783f]">Ops panel</p>
        </div>
      </Link>

      <nav className="mt-5 grid gap-2">
        <NavButton active={activeTab === "requests"} label="Requests" count={requestCount} href="/qk-ops-7f3a?tab=requests" />
        <NavButton active={activeTab === "businesses"} label="Providers" count={businessCount} href="/qk-ops-7f3a?tab=businesses" />
        <a href="/qk-ops-7f3a/business-portal" className="flex h-11 items-center rounded-[13px] bg-white px-4 text-[14px] font-black text-[#44506a] ring-1 ring-[#e1e6ee] hover:text-[#071638]">Business portal</a>
      </nav>

      {activeTab === "requests" ? (
        <div className="mt-4 rounded-[18px] border border-[#e1e6ee] bg-white p-3">
          <p className="px-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#657089]">Request status</p>
          <div className="mt-3 grid gap-2">
            <StatusLink active={!activeStatus} label="All" count={requestCount} href="/qk-ops-7f3a?tab=requests" />
            <StatusLink active={activeStatus === "new"} label="New" count={newRequestCount} href="/qk-ops-7f3a?tab=requests&status=new" />
            <StatusLink active={activeStatus === "matched"} label="Matched" count={matchedRequestCount} href="/qk-ops-7f3a?tab=requests&status=matched" />
            <StatusLink active={activeStatus === "completed" || activeStatus === "done"} label="Completed" count={completedRequestCount} href="/qk-ops-7f3a?tab=requests&status=completed" />
            <StatusLink active={activeStatus === "cancelled"} label="Cancelled" count={cancelledRequestCount} href="/qk-ops-7f3a?tab=requests&status=cancelled" />
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
        <StatPill label="New requests" value={newRequestCount} />
        <StatPill label="Pending providers" value={pendingBusinessCount} />
      </div>

      <div className="mt-4 rounded-[17px] border border-[#d8eddd] bg-[#f1faf4] p-4 text-[12px] font-bold leading-[1.55] text-[#08783f]">
        Check request → contact providers → get customer permission → share contact details.
      </div>
    </aside>
  );
}
