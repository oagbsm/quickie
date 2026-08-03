import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatBusinessDateTime } from "@/lib/business/time";
import type { ReservationSourceConnection } from "@/lib/reservations/source";
import {
  UUID_PATTERN,
  type ReservationFormSource,
  validateReservationInput,
} from "@/lib/reservations/validation";

type ReservationIssueRow = { connection_id: string; issue_type: string; metadata?: Record<string, unknown> | null };

async function listOpenReservationIssues(client: SupabaseClient, connectionIds: string[]) {
  const withMetadata = await client
    .from("reservation_sync_issues")
    .select("connection_id,issue_type,metadata")
    .in("connection_id", connectionIds)
    .eq("issue_status", "open");
  if (!withMetadata.error) return (withMetadata.data || []) as ReservationIssueRow[];
  if (withMetadata.error.code !== "42703") throw new Error(`reservation_source_issues_query_failed:${withMetadata.error.code}`);
  console.warn("reservation_issue_metadata_unavailable", { operation: "list_reservations", connectionCount: connectionIds.length, code: withMetadata.error.code });
  const legacy = await client
    .from("reservation_sync_issues")
    .select("connection_id,issue_type")
    .in("connection_id", connectionIds)
    .eq("issue_status", "open");
  if (legacy.error) throw new Error(`reservation_source_issues_query_failed:${legacy.error.code}`);
  return ((legacy.data || []) as ReservationIssueRow[]).map((issue) => ({ ...issue, metadata: {} }));
}

export type ReservationMutationResult = {
  reservationId: string;
  turnoverId: string;
  created: boolean;
  changed: boolean;
};

export type ReservationProperty = {
  id: string;
  nickname: string;
  postcode: string;
  default_checkout_time: string;
  default_checkin_time: string;
  estimated_turnover_minutes: number;
};

export type ReservationTurnover = {
  id: string;
  reservation_id: string;
  property_id: string;
  turnover_date: string;
  guest_checkout_at: string;
  access_start_at: string;
  window_end_at: string;
  next_checkin_at: string | null;
  status: string;
  creation_source: string;
  requires_attention: boolean;
  cancelled_at: string | null;
  updated_at: string;
};

export type ReservationRecord = {
  id: string;
  account_id: string;
  property_id: string;
  source: string;
  source_connection_id: string | null;
  guest_name: string | null;
  guest_count: number | null;
  check_in_at: string;
  check_out_at: string;
  status: string;
  source_updated_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationEventRecord = {
  id: string;
  sequence: number;
  reservation_id: string;
  turnover_id: string | null;
  event_type: string;
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  metadata: Record<string, unknown>;
  actor_user_id: string | null;
  created_at: string;
};

export type ReservationListItem = ReservationRecord & {
  property: Pick<ReservationProperty, "id" | "nickname" | "postcode">;
  turnover: ReservationTurnover | null;
  sourceConnection: ReservationSourceConnection;
};

export type ReservationDetail = ReservationRecord & {
  property: ReservationProperty;
  turnover: ReservationTurnover | null;
  events: ReservationEventRecord[];
  sourceConnection: ReservationSourceConnection;
  conflictingReservations: Array<Pick<ReservationRecord, "id" | "source" | "source_connection_id" | "check_in_at" | "check_out_at"> & { sourceConnection: ReservationSourceConnection }>;
};

export class ReservationServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ReservationServiceError";
  }
}

const messages: Record<string, string> = {
  authentication_required: "Sign in again to continue.",
  forbidden: "You do not have permission to manage this reservation.",
  property_not_found: "Select an active property in your business.",
  reservation_not_found: "That reservation could not be found.",
  reservation_not_manual: "Only manual reservations can be changed here.",
  reservation_cancelled: "A cancelled reservation cannot be edited.",
  invalid_date_range: "Check-out must be after check-in.",
  invalid_guest_count: "Guest count must be a positive whole number.",
  invalid_reservation_input: "Review the reservation details and try again.",
  invalid_request_key: "This form has expired. Refresh the page and try again.",
  idempotency_conflict: "This submission was already used with different details.",
  reservation_overlap:
    "This reservation overlaps with an existing reservation for this property.",
  linked_turnover_not_found: "The linked turnover could not be found.",
  linked_turnover_cancelled: "The linked turnover is already cancelled.",
  linked_turnover_property_change_locked:
    "The property cannot be changed after turnover work has started.",
  invalid_turnover_window: "The property turnover window is invalid.",
};

function overlapMessage(details?: string) {
  if (!details) return messages.reservation_overlap;
  try {
    const conflict = JSON.parse(details) as Record<string, unknown>;
    if (
      typeof conflict.check_in_at !== "string" ||
      typeof conflict.check_out_at !== "string"
    )
      return messages.reservation_overlap;
    const checkIn = formatBusinessDateTime(conflict.check_in_at);
    const checkOut = formatBusinessDateTime(conflict.check_out_at);
    return `${messages.reservation_overlap} The existing stay runs from ${checkIn} to ${checkOut}.`;
  } catch {
    return messages.reservation_overlap;
  }
}

function serviceError(
  error: { message?: string; code?: string; details?: string } | null,
) {
  const raw = error?.message || "reservation_operation_failed";
  if (raw.includes("reservation_overlap"))
    return new ReservationServiceError(
      "reservation_overlap",
      overlapMessage(error?.details),
    );
  const code = Object.keys(messages).find((candidate) => raw.includes(candidate));
  return new ReservationServiceError(
    code || "reservation_operation_failed",
    code ? messages[code] : "The reservation could not be saved. Try again.",
  );
}

function mutationResult(data: unknown): ReservationMutationResult {
  if (!data || typeof data !== "object")
    throw new ReservationServiceError(
      "reservation_operation_failed",
      "The reservation could not be saved. Try again.",
    );
  const row = data as Record<string, unknown>;
  if (
    typeof row.reservation_id !== "string" ||
    typeof row.turnover_id !== "string"
  )
    throw new ReservationServiceError(
      "reservation_operation_failed",
      "The reservation could not be saved. Try again.",
    );
  return {
    reservationId: row.reservation_id,
    turnoverId: row.turnover_id,
    created: row.created === true,
    changed: row.changed === true,
  };
}

function validatedPayload(source: ReservationFormSource) {
  const validation = validateReservationInput(source);
  if (!validation.ok)
    throw new ReservationServiceError("validation", validation.message);
  return {
    property_id: validation.value.propertyId,
    guest_name: validation.value.guestName,
    guest_count: validation.value.guestCount,
    check_in_at: validation.value.checkInAt,
    check_out_at: validation.value.checkOutAt,
  };
}

export async function createManualReservation(
  source: ReservationFormSource,
  requestKey: string,
) {
  const { supabase } = await requireBusinessUser();
  const payload = validatedPayload(source);
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(requestKey))
    throw new ReservationServiceError(
      "invalid_request_key",
      messages.invalid_request_key,
    );
  const { data, error } = await supabase.rpc("create_manual_reservation", {
    request_key: requestKey,
    payload,
  });
  if (error) throw serviceError(error);
  return mutationResult(data);
}

export async function updateManualReservation(
  reservationId: string,
  source: ReservationFormSource,
) {
  if (!UUID_PATTERN.test(reservationId))
    throw new ReservationServiceError(
      "reservation_not_found",
      messages.reservation_not_found,
    );
  const { supabase } = await requireBusinessUser();
  const payload = validatedPayload(source);
  const { data, error } = await supabase.rpc("update_manual_reservation", {
    target_reservation: reservationId,
    payload,
  });
  if (error) throw serviceError(error);
  return mutationResult(data);
}

export async function cancelManualReservation(reservationId: string) {
  if (!UUID_PATTERN.test(reservationId))
    throw new ReservationServiceError(
      "reservation_not_found",
      messages.reservation_not_found,
    );
  const { supabase } = await requireBusinessUser();
  const { data, error } = await supabase.rpc("cancel_manual_reservation", {
    target_reservation: reservationId,
  });
  if (error) throw serviceError(error);
  return mutationResult(data);
}

export async function syncTurnoverForReservation(reservationId: string) {
  if (!UUID_PATTERN.test(reservationId))
    throw new ReservationServiceError(
      "reservation_not_found",
      messages.reservation_not_found,
    );
  const { supabase } = await requireBusinessUser();
  const { data, error } = await supabase.rpc(
    "server_sync_turnover_for_reservation",
    { target_reservation: reservationId },
  );
  if (error) throw serviceError(error);
  return mutationResult(data);
}

export async function listReservationProperties(): Promise<
  ReservationProperty[]
> {
  const { supabase, accountId } = await requireBusinessUser();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,nickname,postcode,default_checkout_time,default_checkin_time,estimated_turnover_minutes",
    )
    .eq("account_id", accountId)
    .eq("status", "active")
    .order("nickname");
  if (error) throw new Error(`reservation_properties_query_failed:${error.code}`);
  return (data || []) as ReservationProperty[];
}

export async function listReservations(
  view: "upcoming" | "past" | "cancelled",
  propertyId?: string,
): Promise<ReservationListItem[]> {
  const { supabase, accountId } = await requireBusinessUser();
  const now = new Date().toISOString();
  let query = supabase
    .from("reservations")
    .select(
      "id,account_id,property_id,source,source_connection_id,guest_name,guest_count,check_in_at,check_out_at,status,source_updated_at,cancelled_at,created_at,updated_at,properties(id,nickname,postcode)",
    )
    .eq("account_id", accountId);
  if (view === "cancelled") query = query.eq("status", "cancelled");
  if (view === "upcoming")
    query = query.neq("status", "cancelled").gte("check_out_at", now);
  if (view === "past")
    query = query.neq("status", "cancelled").lt("check_out_at", now);
  if (propertyId) query = query.eq("property_id", propertyId);
  const [{ data, error }, { data: turnovers, error: turnoverError }] =
    await Promise.all([
      query.order(view === "past" ? "check_out_at" : "check_in_at", {
        ascending: view !== "past",
      }),
      supabase
        .from("work_items")
        .select(
          "id,reservation_id,property_id,turnover_date,guest_checkout_at,access_start_at,window_end_at,next_checkin_at,status,creation_source,requires_attention,cancelled_at,updated_at",
        )
        .eq("account_id", accountId)
        .not("reservation_id", "is", null)
        .match(propertyId ? { property_id: propertyId } : {}),
    ]);
  if (error) throw new Error(`reservations_query_failed:${error.code}`);
  if (turnoverError)
    throw new Error(`reservation_turnovers_query_failed:${turnoverError.code}`);
  const connectionIds = [...new Set((data || []).flatMap((row) =>
    row.source_connection_id ? [row.source_connection_id] : [],
  ))];
  const [{ data: connections, error: connectionError }, issues] = await Promise.all([
    connectionIds.length
      ? supabase
          .from("property_calendar_connections_safe")
          .select("id,provider,display_name,last_successful_sync_at,sync_status")
          .in("id", connectionIds)
      : Promise.resolve({ data: [], error: null }),
    connectionIds.length ? listOpenReservationIssues(supabase, connectionIds) : Promise.resolve([] as ReservationIssueRow[]),
  ]);
  if (connectionError)
    throw new Error(`reservation_sources_query_failed:${connectionError.code}`);
  const connectionById = new Map((connections || []).map((row) => [row.id, row]));
  const issueByConnection = new Map<string, string[]>();
  const rejectedConflictByConnection = new Map<string, Array<{ startAt: string | null; endAt: string | null }>>();
  for (const issue of issues || []) {
    const current = issueByConnection.get(issue.connection_id) || [];
    current.push(issue.issue_type);
    issueByConnection.set(issue.connection_id, current);
    if (issue.issue_type === "overlap_conflict") {
      const metadata = (issue.metadata || {}) as Record<string, unknown>;
      const rejected = rejectedConflictByConnection.get(issue.connection_id) || [];
      rejected.push({
        startAt: typeof metadata.attempted_start_at === "string" ? metadata.attempted_start_at : null,
        endAt: typeof metadata.attempted_end_at === "string" ? metadata.attempted_end_at : null,
      });
      rejectedConflictByConnection.set(issue.connection_id, rejected);
    }
  }
  const byReservation = new Map(
    ((turnovers || []) as ReservationTurnover[]).map((item) => [
      item.reservation_id,
      item,
    ]),
  );
  return (data || []).map((row) => {
    const related = Array.isArray(row.properties)
      ? row.properties[0]
      : row.properties;
    return {
      ...row,
      property: related,
      turnover: byReservation.get(row.id) || null,
      sourceConnection: row.source_connection_id
        ? (() => {
            const connection = connectionById.get(row.source_connection_id);
            if (!connection) return null;
            const openIssueTypes = issueByConnection.get(row.source_connection_id) || [];
            return {
              ...connection,
              open_issue_types: openIssueTypes,
              open_overlap_count: openIssueTypes.filter((type) => type === "overlap_conflict").length,
              open_rejected_conflicts: rejectedConflictByConnection.get(row.source_connection_id) || [],
            } as ReservationSourceConnection;
          })()
        : null,
    } as ReservationListItem;
  });
}

export async function getReservationDetail(
  reservationId: string,
): Promise<ReservationDetail | null> {
  if (!UUID_PATTERN.test(reservationId)) return null;
  const { supabase, accountId } = await requireBusinessUser();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id,account_id,property_id,source,source_connection_id,guest_name,guest_count,check_in_at,check_out_at,status,source_updated_at,cancelled_at,created_at,updated_at,properties(id,nickname,postcode,default_checkout_time,default_checkin_time,estimated_turnover_minutes)",
    )
    .eq("id", reservationId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw new Error(`reservation_query_failed:${error.code}`);
  if (!data) return null;
  const [turnoverResult, eventsResult, conflictResult] = await Promise.all([
    supabase
      .from("work_items")
      .select(
        "id,reservation_id,property_id,turnover_date,guest_checkout_at,access_start_at,window_end_at,next_checkin_at,status,creation_source,requires_attention,cancelled_at,updated_at",
      )
      .eq("account_id", accountId)
      .eq("reservation_id", reservationId)
      .maybeSingle(),
    supabase
      .from("reservation_events")
      .select(
        "id,sequence,reservation_id,turnover_id,event_type,previous_values,new_values,metadata,actor_user_id,created_at",
      )
      .eq("account_id", accountId)
      .eq("reservation_id", reservationId)
      .order("sequence", { ascending: true }),
    data.status === "cancelled"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("reservations")
          .select("id,source,source_connection_id,check_in_at,check_out_at")
          .eq("account_id", accountId)
          .eq("property_id", data.property_id)
          .neq("id", reservationId)
          .neq("status", "cancelled")
          .lt("check_in_at", data.check_out_at)
          .gt("check_out_at", data.check_in_at)
          .order("check_in_at", { ascending: true }),
  ]);
  if (turnoverResult.error)
    throw new Error(`reservation_turnover_query_failed:${turnoverResult.error.code}`);
  if (eventsResult.error)
    throw new Error(`reservation_events_query_failed:${eventsResult.error.code}`);
  if (conflictResult.error)
    throw new Error(`reservation_conflicts_query_failed:${conflictResult.error.code}`);
  const conflictConnectionIds = [...new Set((conflictResult.data || []).flatMap((row) => row.source_connection_id ? [row.source_connection_id] : []))];
  const conflictConnectionsResult = conflictConnectionIds.length
    ? await supabase
        .from("property_calendar_connections_safe")
        .select("id,provider,display_name,last_successful_sync_at,sync_status")
        .in("id", conflictConnectionIds)
    : { data: [], error: null };
  if (conflictConnectionsResult.error)
    throw new Error(`reservation_conflict_sources_query_failed:${conflictConnectionsResult.error.code}`);
  const conflictConnectionById = new Map((conflictConnectionsResult.data || []).map((row) => [row.id, row]));
  const sourceConnectionResult = data.source_connection_id
    ? await supabase
        .from("property_calendar_connections_safe")
        .select("provider,display_name,last_successful_sync_at,sync_status")
        .eq("id", data.source_connection_id)
        .maybeSingle()
    : { data: null, error: null };
  if (sourceConnectionResult.error)
    throw new Error(`reservation_source_query_failed:${sourceConnectionResult.error.code}`);
  const related = Array.isArray(data.properties)
    ? data.properties[0]
    : data.properties;
  if (!related) return null;
  return {
    ...data,
    property: related,
    turnover: (turnoverResult.data as ReservationTurnover | null) || null,
    events: (eventsResult.data || []) as ReservationEventRecord[],
    sourceConnection:
      (sourceConnectionResult.data as ReservationSourceConnection) || null,
    conflictingReservations: (conflictResult.data || []).map((row) => ({
      ...row,
      sourceConnection: row.source_connection_id
        ? (conflictConnectionById.get(row.source_connection_id) as ReservationSourceConnection) || null
        : null,
    })),
  } as ReservationDetail;
}
