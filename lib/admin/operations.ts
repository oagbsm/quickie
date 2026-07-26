import {
  currentAssignment,
  turnoverActionReason,
} from "@/lib/turnovers/presentation";

export type AdminWorkItem = {
  status: string;
  turnover_date: string;
  access_start_at: string;
  next_checkin_at: string;
  readiness_result?: { blocking_reasons?: string[] } | null;
  assignments?: Array<{
    status: string;
    assigned_at?: string;
    workers: unknown;
  }>;
  operational_issues?: Array<{ status: string; blocking: boolean }>;
};

export function checkInCountdown(value: string, now = new Date()) {
  const minutes = Math.round(
    (new Date(value).getTime() - now.getTime()) / 60_000,
  );
  if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
  if (minutes < 60) return `${minutes}m to check-in`;
  if (minutes < 1440)
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m to check-in`;
  return `${Math.ceil(minutes / 1440)}d to check-in`;
}

export function adminRisk(item: AdminWorkItem, now = new Date()) {
  const terminal = ["ready", "cancelled"].includes(item.status);
  if (terminal)
    return {
      level: item.status === "ready" ? "ready" : "neutral",
      reason: turnoverActionReason(item),
    };
  const blocking = item.operational_issues?.some(
    (issue) => issue.blocking && !["resolved", "closed"].includes(issue.status),
  );
  if (blocking)
    return { level: "critical", reason: "Blocking issue before check-in" };
  const minutes =
    (new Date(item.next_checkin_at).getTime() - now.getTime()) / 60_000;
  if (
    new Date(item.access_start_at) < now &&
    ["accepted", "awaiting_response", "unassigned"].includes(item.status)
  )
    return { level: "critical", reason: "Cleaner has not arrived" };
  if (["unassigned", "declined", "action_required"].includes(item.status))
    return {
      level: minutes < 360 ? "critical" : "high",
      reason: turnoverActionReason(item),
    };
  if (item.status === "awaiting_response")
    return {
      level: minutes < 1440 ? "high" : "medium",
      reason: "Cleaner acceptance pending",
    };
  if (item.status === "evidence_submitted")
    return { level: "medium", reason: "Evidence awaiting readiness decision" };
  return { level: "normal", reason: turnoverActionReason(item) };
}

export function adminCleaner(item: AdminWorkItem) {
  const assignment = currentAssignment(item.assignments);
  const worker = assignment?.workers;
  return {
    assignment,
    worker: (Array.isArray(worker) ? worker[0] : worker) as
      | { display_name?: string; mobile?: string; email?: string }
      | null
      | undefined,
  };
}

export const riskTone: Record<string, string> = {
  critical: "border-red-700 bg-red-700 text-white",
  high: "border-orange-500 bg-orange-100 text-orange-950",
  medium: "border-amber-400 bg-amber-100 text-amber-950",
  ready: "border-emerald-700 bg-emerald-700 text-white",
  normal: "border-blue-300 bg-blue-50 text-blue-900",
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
};
