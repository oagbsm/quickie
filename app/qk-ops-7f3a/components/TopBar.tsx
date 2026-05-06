import type { AdminTab } from "../types";

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "green" | "blue" | "red" | "neutral";
}) {
  const toneClass = {
    green: "border-[#bfe8cb] bg-[#effcf3] text-[#08783f]",
    blue: "border-[#cbdcf7] bg-[#eef6ff] text-[#1954a6]",
    red: "border-[#ffd1d1] bg-[#fff1f1] text-[#b42318]",
    neutral: "border-[#dfe5ee] bg-white text-[#071638]",
  }[tone];

  return (
    <div className={`flex h-10 items-center gap-2 rounded-[13px] border px-3 ${toneClass}`}>
      <span className="text-[17px] font-black leading-none tracking-[-0.04em]">{value}</span>
      <span className="text-[12px] font-black uppercase tracking-[0.06em]">{label}</span>
    </div>
  );
}

export default function TopBar({
  activeTab,
  businessCount,
  newRequestCount,
  matchedRequestCount,
  doneRequestCount,
  approvedBusinessCount,
  pendingBusinessCount,
}: {
  activeTab: AdminTab;
  requestCount: number;
  businessCount: number;
  newRequestCount: number;
  contactedRequestCount: number;
  matchedRequestCount: number;
  doneRequestCount: number;
  approvedBusinessCount: number;
  pendingBusinessCount: number;
}) {
  const isRequests = activeTab === "requests";

  return (
    <section className="rounded-[20px] border border-[#dfe5ee] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(7,22,56,0.035)] sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#08783f]">
            Quickola operations
          </p>
          <h1 className="mt-1 text-[26px] font-black leading-[1.05] tracking-[-0.05em] text-[#071638] sm:text-[32px]">
            {isRequests ? "Requests" : "Providers"}
          </h1>
          <p className="mt-1 max-w-[720px] text-[13px] font-semibold leading-[1.45] text-[#657089]">
            {isRequests
              ? "See customers, postcode, job details, matches and status in one place."
              : "Manage provider supply, services, locations, approval status and notes."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isRequests ? (
            <>
              <MiniStat label="New" value={newRequestCount} tone="green" />
              <MiniStat label="Matched" value={matchedRequestCount} tone="blue" />
              <MiniStat label="Completed" value={doneRequestCount} />
            </>
          ) : (
            <>
              <MiniStat label="Providers" value={businessCount} />
              <MiniStat label="Approved" value={approvedBusinessCount} tone="green" />
              <MiniStat label="Pending" value={pendingBusinessCount} tone="blue" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}