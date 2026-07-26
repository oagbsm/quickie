export const turnoverStatuses = [
  "draft",
  "unassigned",
  "awaiting_response",
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "evidence_submitted",
  "action_required",
  "ready",
  "declined",
  "cancelled",
] as const;

export type TurnoverStatus = (typeof turnoverStatuses)[number];

export const turnoverStatusLabels: Record<TurnoverStatus, string> = {
  draft: "Draft",
  unassigned: "Unassigned",
  awaiting_response: "Awaiting response",
  accepted: "Accepted",
  en_route: "Cleaner en route",
  arrived: "Arrived",
  in_progress: "In progress",
  evidence_submitted: "Evidence submitted",
  action_required: "Action required",
  ready: "Property ready",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const legalTurnoverTransitions: Record<TurnoverStatus, TurnoverStatus[]> = {
  draft: ["unassigned", "awaiting_response", "cancelled"],
  unassigned: ["awaiting_response", "cancelled"],
  awaiting_response: ["accepted", "declined", "cancelled"],
  accepted: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["evidence_submitted", "action_required", "cancelled"],
  evidence_submitted: ["action_required", "ready", "cancelled"],
  action_required: ["in_progress", "ready", "cancelled"],
  ready: [],
  declined: ["unassigned", "awaiting_response", "cancelled"],
  cancelled: [],
};

export function canTransitionTurnover(from: string, to: string) {
  return turnoverStatuses.includes(from as TurnoverStatus) &&
    turnoverStatuses.includes(to as TurnoverStatus) &&
    legalTurnoverTransitions[from as TurnoverStatus].includes(to as TurnoverStatus);
}

export function turnoverWindowMinutes(checkout: Date, checkin: Date) {
  return Math.floor((checkin.getTime() - checkout.getTime()) / 60_000);
}

export function hasTurnoverWindowRisk(
  checkout: Date,
  checkin: Date,
  estimatedMinutes: number,
) {
  return turnoverWindowMinutes(checkout, checkin) < estimatedMinutes;
}
