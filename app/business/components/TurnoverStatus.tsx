import { getOperatorState } from "@/lib/turnovers/operator-lifecycle";

const tones: Record<string, string> = {
  ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
  action_required: "border-red-100 bg-red-50 text-red-800",
  declined: "border-red-100 bg-red-50 text-red-800",
  unassigned: "border-amber-100 bg-amber-50 text-amber-900",
  awaiting_response: "border-amber-100 bg-amber-50 text-amber-900",
  accepted: "border-blue-100 bg-blue-50 text-blue-800",
  en_route: "border-blue-100 bg-blue-50 text-blue-800",
  arrived: "border-blue-100 bg-blue-50 text-blue-800",
  in_progress: "border-blue-100 bg-blue-50 text-blue-800",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function TurnoverStatus({ status }: { status: string }) {
  return <span className={`portal-pill border ${tones[status] || "border-blue-100 bg-blue-50 text-blue-800"}`}>
    {status === "unassigned" ? "Needs cleaner" : getOperatorState(status).label}
  </span>;
}
