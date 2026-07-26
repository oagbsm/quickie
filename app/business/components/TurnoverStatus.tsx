import { turnoverStatusLabels, type TurnoverStatus } from "@/lib/turnovers/status";

const tones: Record<string, string> = {
  ready: "border-emerald-700 bg-emerald-700 text-white",
  action_required: "border-red-700 bg-red-700 text-white",
  declined: "border-red-700 bg-red-700 text-white",
  unassigned: "border-amber-500 bg-amber-400 text-amber-950",
  awaiting_response: "border-amber-500 bg-amber-400 text-amber-950",
  accepted: "border-blue-700 bg-blue-700 text-white",
  en_route: "border-blue-700 bg-blue-700 text-white",
  arrived: "border-blue-700 bg-blue-700 text-white",
  in_progress: "border-blue-700 bg-blue-700 text-white",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function TurnoverStatus({ status }: { status: string }) {
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-extrabold ${tones[status] || "border-blue-200 bg-blue-50 text-blue-800"}`}>
    {turnoverStatusLabels[status as TurnoverStatus] || status.replaceAll("_", " ")}
  </span>;
}
