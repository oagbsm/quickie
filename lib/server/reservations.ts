import "server-only";

import { requireBusinessUser } from "@/lib/business/auth";
import { formatBusinessDateTime } from "@/lib/business/time";
import {
  UUID_PATTERN,
  type ReservationFormSource,
  validateReservationInput,
} from "@/lib/reservations/validation";

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
  external_reservation_id: string;
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
};

export type ReservationDetail = ReservationRecord & {
  property: ReservationProperty;
  turnover: ReservationTurnover | null;
  events: ReservationEventRecord[];
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
): Promise<ReservationListItem[]> {
  const { supabase, accountId } = await requireBusinessUser();
  const now = new Date().toISOString();
  let query = supabase
    .from("reservations")
    .select(
      "id,account_id,property_id,source,external_reservation_id,guest_name,guest_count,check_in_at,check_out_at,status,source_updated_at,cancelled_at,created_at,updated_at,properties(id,nickname,postcode)",
    )
    .eq("account_id", accountId);
  if (view === "cancelled") query = query.eq("status", "cancelled");
  if (view === "upcoming")
    query = query.neq("status", "cancelled").gte("check_out_at", now);
  if (view === "past")
    query = query.neq("status", "cancelled").lt("check_out_at", now);
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
        .not("reservation_id", "is", null),
    ]);
  if (error) throw new Error(`reservations_query_failed:${error.code}`);
  if (turnoverError)
    throw new Error(`reservation_turnovers_query_failed:${turnoverError.code}`);
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
      "id,account_id,property_id,source,external_reservation_id,guest_name,guest_count,check_in_at,check_out_at,status,source_updated_at,cancelled_at,created_at,updated_at,properties(id,nickname,postcode,default_checkout_time,default_checkin_time,estimated_turnover_minutes)",
    )
    .eq("id", reservationId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw new Error(`reservation_query_failed:${error.code}`);
  if (!data) return null;
  const [turnoverResult, eventsResult] = await Promise.all([
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
  ]);
  if (turnoverResult.error)
    throw new Error(`reservation_turnover_query_failed:${turnoverResult.error.code}`);
  if (eventsResult.error)
    throw new Error(`reservation_events_query_failed:${eventsResult.error.code}`);
  const related = Array.isArray(data.properties)
    ? data.properties[0]
    : data.properties;
  if (!related) return null;
  return {
    ...data,
    property: related,
    turnover: (turnoverResult.data as ReservationTurnover | null) || null,
    events: (eventsResult.data || []) as ReservationEventRecord[],
  } as ReservationDetail;
}
