import { turnoverStatusLabels, type TurnoverStatus } from "@/lib/turnovers/status";

const tones: Record<string, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  action_required: "border-red-200 bg-red-50 text-red-800",
  declined: "border-red-200 bg-red-50 text-red-800",
  unassigned: "border-amber-200 bg-amber-50 text-amber-900",
  awaiting_response: "border-amber-200 bg-amber-50 text-amber-900",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function TurnoverStatus({ status }: { status: string }) {
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-extrabold ${tones[status] || "border-blue-200 bg-blue-50 text-blue-800"}`}>
    {turnoverStatusLabels[status as TurnoverStatus] || status.replaceAll("_", " ")}
  </span>;
}
