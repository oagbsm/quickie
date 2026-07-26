import { formatDisplayName } from "@/lib/display-name";

export type ActivityPresentationEvent = {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  work_item_id?: string | null;
  metadata?: Record<string, unknown> | null;
  properties?: { nickname?: string | null } | { nickname?: string | null }[] | null;
  workers?: { display_name?: string | null } | { display_name?: string | null }[] | null;
  work_items?: {
    properties?: { nickname?: string | null } | { nickname?: string | null }[] | null;
    assignments?: Array<{ status?: string; workers?: { display_name?: string | null } | { display_name?: string | null }[] | null }>;
  } | Array<{
    properties?: { nickname?: string | null } | { nickname?: string | null }[] | null;
    assignments?: Array<{ status?: string; workers?: { display_name?: string | null } | { display_name?: string | null }[] | null }>;
  }> | null;
};

const one = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function activityContext(event: ActivityPresentationEvent) {
  const item = one(event.work_items);
  const property = one(event.properties) || one(item?.properties);
  const directWorker = one(event.workers);
  const assignment = item?.assignments?.find((entry) =>
    ["accepted", "pending"].includes(entry.status || ""),
  ) || item?.assignments?.[0];
  const worker = directWorker || one(assignment?.workers);
  return {
    propertyName: formatDisplayName(property?.nickname),
    workerName: formatDisplayName(worker?.display_name),
  };
}

export function formatActivityEvent(event: ActivityPresentationEvent) {
  const { propertyName, workerName } = activityContext(event);
  const cleaner = workerName || "Cleaner";
  const property = propertyName || "the turnover";
  const titleByType: Record<string, string> = {
    cleaner_assigned: workerName ? `${cleaner} was assigned` : "Cleaner was assigned",
    assignment_created: workerName ? `${cleaner} was assigned` : "Cleaner was assigned",
    assignment_accepted: `${cleaner} accepted the ${propertyName ? `${propertyName} turnover` : "turnover"}`,
    turnover_accepted: `${cleaner} accepted the ${propertyName ? `${propertyName} turnover` : "turnover"}`,
    assignment_declined: `${cleaner} declined the ${propertyName ? `${propertyName} turnover` : "turnover"}`,
    turnover_declined: `${cleaner} declined the ${propertyName ? `${propertyName} turnover` : "turnover"}`,
    turnover_en_route: `${cleaner} is on the way${propertyName ? ` to ${propertyName}` : ""}`,
    turnover_arrived: `${cleaner} arrived${propertyName ? ` at ${propertyName}` : ""}`,
    turnover_in_progress: propertyName ? `Cleaning started at ${propertyName}` : "Cleaning started",
    turnover_evidence_submitted: propertyName ? `Completion evidence was submitted for ${propertyName}` : "Completion evidence was submitted",
    evidence_submitted: propertyName ? `Completion evidence was submitted for ${propertyName}` : "Completion evidence was submitted",
    readiness_evaluated: event.metadata?.ready
      ? `${propertyName || "The property"} was marked ready`
      : `${propertyName || "The turnover"} still needed completion evidence`,
    turnover_ready: `${propertyName || "The property"} was marked ready`,
    property_ready: `${propertyName || "The property"} was marked ready`,
    assignment_cancelled: propertyName ? `Cleaner assignment for ${propertyName} was cancelled` : "Cleaner assignment was cancelled",
    issue_reported: propertyName ? `An issue was reported at ${propertyName}` : "An issue was reported",
    issue_resolved: propertyName ? `An issue at ${propertyName} was resolved` : "An issue was resolved",
    turnover_cancelled: propertyName ? `${propertyName} turnover was cancelled` : "Turnover was cancelled",
    turnover_created: propertyName ? `${propertyName} turnover was added` : "Turnover was added",
  };
  const raw = event.description || "Activity updated";
  let title = titleByType[event.event_type];
  if (!title && /status changed to accepted/i.test(raw)) title = `${cleaner} accepted the ${propertyName ? `${propertyName} turnover` : "turnover"}`;
  if (!title && /status changed to en route/i.test(raw)) title = `${cleaner} is on the way${propertyName ? ` to ${propertyName}` : ""}`;
  if (!title && /status changed to arrived/i.test(raw)) title = `${cleaner} arrived${propertyName ? ` at ${propertyName}` : ""}`;
  if (!title && /readiness check found outstanding/i.test(raw)) title = `${propertyName || "The turnover"} still needed completion evidence`;
  if (!title && /property marked ready/i.test(raw)) title = `${propertyName || "The property"} was marked ready`;
  if (!title) title = raw.replaceAll("_", " ");
  const titleIncludesProperty = propertyName && title.toLowerCase().includes(propertyName.toLowerCase());
  const titleIncludesWorker = workerName && title.toLowerCase().includes(workerName.toLowerCase());
  return {
    title,
    context: titleIncludesProperty ? (titleIncludesWorker ? "" : workerName) : propertyName || workerName,
  };
}

export function collapseActivityEvents<T extends ActivityPresentationEvent>(events: T[], retryWindowMs = 60_000) {
  return events.filter((event, index) => {
    const previous = events[index - 1];
    if (!previous) return true;
    const eventContext = activityContext(event);
    const previousContext = activityContext(previous);
    return !(
      previous.event_type === event.event_type &&
      previous.work_item_id === event.work_item_id &&
      eventContext.workerName === previousContext.workerName &&
      eventContext.propertyName === previousContext.propertyName &&
      JSON.stringify(previous.metadata || {}) === JSON.stringify(event.metadata || {}) &&
      Math.abs(new Date(previous.created_at).getTime() - new Date(event.created_at).getTime()) <= retryWindowMs
    );
  });
}
