export type CleanerLifecycle = {
  key: string;
  label: string;
  primaryAction?: { label: string; nextStatus: string };
  checklistActive: boolean;
  terminal: boolean;
};

const states: Record<string, CleanerLifecycle> = {
  awaiting_response: { key: "assigned", label: "Assigned", primaryAction: { label: "Accept", nextStatus: "accepted" }, checklistActive: false, terminal: false },
  accepted: { key: "accepted", label: "Accepted", primaryAction: { label: "I’m en route", nextStatus: "en_route" }, checklistActive: false, terminal: false },
  en_route: { key: "en_route", label: "En route", primaryAction: { label: "I’ve arrived", nextStatus: "arrived" }, checklistActive: false, terminal: false },
  arrived: { key: "arrived", label: "Arrived", primaryAction: { label: "Start cleaning", nextStatus: "in_progress" }, checklistActive: false, terminal: false },
  in_progress: { key: "in_progress", label: "In progress", primaryAction: { label: "Complete clean", nextStatus: "evidence_submitted" }, checklistActive: true, terminal: false },
  action_required: { key: "action_required", label: "Action required", checklistActive: true, terminal: false },
  ready: { key: "property_ready", label: "Property ready", checklistActive: false, terminal: true },
  evidence_submitted: { key: "property_ready", label: "Property ready", checklistActive: false, terminal: true },
};

export function getCleanerLifecycle(status: string): CleanerLifecycle {
  return states[status] || { key: "unavailable", label: "Not available", checklistActive: false, terminal: true };
}

const priority: Record<string, number> = { in_progress: 0, action_required: 1, arrived: 2, en_route: 3, accepted: 4, awaiting_response: 5 };
export function selectRelevantCleanerJobs<T extends { status: string; access_start_at?: string | null }>(items: T[]) {
  const jobs = items.filter((item) => priority[item.status] !== undefined).sort((a, b) => (priority[a.status] - priority[b.status]) || (new Date(a.access_start_at || 0).getTime() - new Date(b.access_start_at || 0).getTime()));
  return { primary: jobs[0] || null, secondary: jobs.slice(1) };
}
