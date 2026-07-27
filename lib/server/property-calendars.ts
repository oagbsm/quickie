import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatBusinessDateTime } from "@/lib/business/time";
import { parseCalendar } from "@/lib/calendar/parser";
import type {
  CalendarProvider,
  CalendarSyncSummary,
  NormalizedCalendarEvent,
} from "@/lib/calendar/types";
import {
  CalendarFetchError,
  fetchCalendarText,
} from "@/lib/server/calendar-fetch";
import {
  calendarUrlFingerprint,
  decryptCalendarUrl,
  encryptCalendarUrl,
  maskCalendarUrl,
} from "@/lib/server/calendar-secrets";
import {
  assertSafeCalendarDestination,
  validateCalendarUrl,
  type CalendarFetchDependencies,
} from "@/lib/calendar/safe-fetch-core";

export type SafeCalendarConnection = {
  id: string;
  property_id: string;
  provider: CalendarProvider;
  display_name: string | null;
  masked_calendar_url: string;
  is_active: boolean;
  sync_status: "never_synced" | "syncing" | "healthy" | "attention_required" | "disabled";
  last_sync_started_at: string | null;
  last_successful_sync_at: string | null;
  last_sync_completed_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  consecutive_failure_count: number;
  last_sync_summary: Partial<CalendarSyncSummary>;
  imported_reservation_count: number;
  open_issue_count: number;
  open_issues: Array<{
    id: string;
    issue_type: string;
    safe_message: string;
  }>;
};

type ClaimedConnection = {
  id: string;
  account_id: string;
  property_id: string;
  provider: CalendarProvider;
  encrypted_url: string;
  default_checkin_time: string;
  default_checkout_time: string;
  last_feed_fingerprint: string | null;
  active_reservation_count: number;
};

export class PropertyCalendarError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "PropertyCalendarError";
  }
}

const providerNames: Record<CalendarProvider, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "Vrbo",
  other: "Calendar",
};

const safeErrors: Record<string, string> = {
  invalid_calendar_url: "Enter a valid calendar URL.",
  unsupported_protocol: "Calendar URLs must use HTTPS.",
  calendar_address_blocked: "This calendar address cannot be connected.",
  calendar_unavailable: "The calendar could not be reached. Existing reservations were not changed.",
  calendar_timeout: "The calendar took too long to respond. Existing reservations were not changed.",
  calendar_too_large: "The calendar feed is too large to import safely.",
  calendar_content_type: "The supplied URL did not return a calendar feed.",
  calendar_redirect_limit: "The calendar redirected too many times.",
  invalid_calendar_format: "The supplied feed is not a valid calendar.",
  suspicious_empty_feed: "The calendar returned no usable reservations. Existing reservations were not changed.",
  duplicate_calendar_connection: "This calendar is already connected to the property.",
  calendar_sync_in_progress: "This calendar is already syncing.",
  calendar_connection_not_found: "That reservation source could not be found.",
  calendar_connection_disabled: "Enable this reservation source before syncing.",
  reservation_overlap: "This reservation overlaps another booking for this property.",
};

function safeError(error: unknown) {
  if (error instanceof PropertyCalendarError) return error;
  if (error instanceof CalendarFetchError)
    return new PropertyCalendarError(error.code, safeErrors[error.code]);
  const raw = error instanceof Error ? error.message : "calendar_sync_failed";
  const code = Object.keys(safeErrors).find((candidate) => raw.includes(candidate));
  return new PropertyCalendarError(
    code || "calendar_sync_failed",
    code
      ? safeErrors[code]
      : "The calendar could not be synchronised. Existing reservations were not changed.",
  );
}

async function rpc<T>(
  client: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw safeError(new Error(`${error.code || ""}:${error.message}`));
  return data as T;
}

export async function listPropertyCalendarConnections(propertyId: string) {
  const { supabase, accountId } = await requireBusinessUser();
  const { data, error } = await supabase
    .from("property_calendar_connections_safe")
    .select(
      "id,property_id,provider,display_name,masked_calendar_url,is_active,sync_status,last_sync_started_at,last_successful_sync_at,last_sync_completed_at,last_error_code,last_error_message,consecutive_failure_count,last_sync_summary",
    )
    .eq("property_id", propertyId)
    .eq("account_id", accountId)
    .order("created_at");
  if (error) throw new Error(`calendar_connections_query_failed:${error.code}`);
  const ids = (data || []).map((row) => row.id);
  if (!ids.length) return [] as SafeCalendarConnection[];
  const [reservationResult, issueResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("source_connection_id")
      .in("source_connection_id", ids)
      .neq("status", "cancelled"),
    supabase
      .from("reservation_sync_issues")
      .select("id,connection_id,issue_type,safe_message")
      .in("connection_id", ids)
      .eq("issue_status", "open"),
  ]);
  if (reservationResult.error)
    throw new Error(`calendar_reservations_query_failed:${reservationResult.error.code}`);
  if (issueResult.error)
    throw new Error(`calendar_issues_query_failed:${issueResult.error.code}`);
  const reservations = reservationResult.data;
  const issues = issueResult.data;
  return (data || []).map((row) => ({
    ...row,
    imported_reservation_count: (reservations || []).filter(
      (reservation) => reservation.source_connection_id === row.id,
    ).length,
    open_issue_count: (issues || []).filter(
      (issue) => issue.connection_id === row.id,
    ).length,
    open_issues: (issues || [])
      .filter((issue) => issue.connection_id === row.id)
      .map(({ id, issue_type, safe_message }) => ({
        id,
        issue_type,
        safe_message,
      })),
  })) as SafeCalendarConnection[];
}

export async function createPropertyCalendarConnection(input: {
  propertyId: string;
  provider: CalendarProvider;
  displayName: string;
  calendarUrl: string;
}) {
  const { supabase } = await requireBusinessUser();
  const url = validateCalendarUrl(input.calendarUrl);
  await assertSafeCalendarDestination(url);
  return rpc<string>(supabase, "create_property_calendar_connection", {
    target_property: input.propertyId,
    selected_provider: input.provider,
    selected_display_name: input.displayName,
    encrypted_url: encryptCalendarUrl(url.toString()),
    url_fingerprint: calendarUrlFingerprint(url.toString()),
    masked_url: maskCalendarUrl(url.toString()),
  });
}

export async function managePropertyCalendarConnection(input: {
  connectionId: string;
  action: "rename" | "disable" | "enable" | "replace_url" | "remove";
  displayName?: string;
  calendarUrl?: string;
}) {
  const { supabase } = await requireBusinessUser();
  let encryptedUrl: string | null = null;
  let fingerprint: string | null = null;
  let maskedUrl: string | null = null;
  if (input.action === "replace_url") {
    const url = validateCalendarUrl(input.calendarUrl || "");
    await assertSafeCalendarDestination(url);
    encryptedUrl = encryptCalendarUrl(url.toString());
    fingerprint = calendarUrlFingerprint(url.toString());
    maskedUrl = maskCalendarUrl(url.toString());
  }
  await rpc(supabase, "manage_property_calendar_connection", {
    target_connection: input.connectionId,
    requested_action: input.action,
    next_display_name: input.displayName || null,
    next_encrypted_url: encryptedUrl,
    next_url_fingerprint: fingerprint,
    next_masked_url: maskedUrl,
  });
}

async function recordIssue(
  client: SupabaseClient,
  connectionId: string,
  issueType: string,
  uidHash: string | null,
  message: string,
) {
  await rpc(client, "record_calendar_sync_issue", {
    target_connection: connectionId,
    selected_issue_type: issueType,
    uid_hash: uidHash,
    message,
  });
}

async function resolveIssue(
  client: SupabaseClient,
  connectionId: string,
  issueType: string,
  uidHash: string | null,
) {
  await rpc(client, "resolve_calendar_sync_issue", {
    target_connection: connectionId,
    selected_issue_type: issueType,
    uid_hash: uidHash,
  });
}

async function complete(
  client: SupabaseClient,
  connectionId: string,
  input: {
    successful: boolean;
    status: "healthy" | "attention_required";
    errorCode?: string;
    message?: string;
    feedFingerprint?: string;
    summary?: CalendarSyncSummary;
  },
) {
  await rpc(client, "complete_property_calendar_sync", {
    target_connection: connectionId,
    was_successful: input.successful,
    next_status: input.status,
    error_code: input.errorCode || null,
    safe_error_message: input.message || null,
    feed_fingerprint: input.feedFingerprint || null,
    result_summary: input.summary || {},
  });
}

function eventPayload(event: NormalizedCalendarEvent) {
  return {
    external_uid: event.externalUid,
    check_in_at: event.checkInAt,
    check_out_at: event.checkOutAt,
    status: event.status,
    fingerprint: event.fingerprint,
    sequence: event.sequence,
    external_last_modified_at: event.externalLastModifiedAt,
  };
}

export async function syncPropertyCalendar(
  connectionId: string,
  client?: SupabaseClient,
  dependencies: CalendarFetchDependencies = {},
) {
  const authenticated = client ? null : await requireBusinessUser();
  const database = client || authenticated!.supabase;
  let claimed: ClaimedConnection;
  try {
    claimed = await rpc<ClaimedConnection>(
      database,
      "claim_property_calendar_sync",
      { target_connection: connectionId },
    );
  } catch (error) {
    throw safeError(error);
  }
  const summary: CalendarSyncSummary = {
    imported: 0,
    updated: 0,
    cancelled: 0,
    unchanged: 0,
    conflicts: 0,
  };
  try {
    const calendarText = await fetchCalendarText(
      decryptCalendarUrl(claimed.encrypted_url),
      dependencies,
    );
    const feedFingerprint = createHash("sha256")
      .update(calendarText)
      .digest("hex");
    const parsed = parseCalendar(calendarText, {
      connectionId: claimed.id,
      provider: claimed.provider,
      defaultCheckInTime: String(claimed.default_checkin_time).slice(0, 5),
      defaultCheckOutTime: String(claimed.default_checkout_time).slice(0, 5),
    });
    if (!parsed.events.length) {
      await recordIssue(
        database,
        connectionId,
        "suspicious_empty_feed",
        null,
        safeErrors.suspicious_empty_feed,
      );
      await complete(database, connectionId, {
        successful: false,
        status: "attention_required",
        errorCode: "suspicious_empty_feed",
        message: safeErrors.suspicious_empty_feed,
      });
      return { status: "attention_required" as const, summary };
    }
    const suspiciousTruncation =
      claimed.active_reservation_count >= 5 &&
      parsed.events.length * 4 < claimed.active_reservation_count;
    if (suspiciousTruncation)
      await recordIssue(
        database,
        connectionId,
        "suspicious_empty_feed",
        null,
        "The calendar returned substantially fewer reservations than expected. Missing reservations were left unchanged.",
      );
    for (const issue of parsed.issues)
      await recordIssue(
        database,
        connectionId,
        "invalid_event",
        issue.externalUidHash,
        issue.safeMessage,
      );
    for (const event of parsed.events) {
      const uidHash = createHash("sha256").update(event.externalUid).digest("hex");
      try {
        const result = await rpc<{ action: keyof CalendarSyncSummary }>(
          database,
          "reconcile_ical_reservation",
          { target_connection: connectionId, event_payload: eventPayload(event) },
        );
        if (result.action in summary) summary[result.action] += 1;
        await resolveIssue(
          database,
          connectionId,
          "overlap_conflict",
          uidHash,
        ).catch(() => undefined);
      } catch (error) {
        const handled = safeError(error);
        if (handled.code !== "reservation_overlap")
          throw error;
        summary.conflicts += 1;
        await recordIssue(
          database,
          connectionId,
          "overlap_conflict",
          uidHash,
          `${event.safeDisplayTitle} from ${formatBusinessDateTime(event.checkInAt)} to ${formatBusinessDateTime(event.checkOutAt)} overlaps another reservation.`,
        );
      }
    }
    if (!suspiciousTruncation) {
      await Promise.all([
        resolveIssue(database, connectionId, "suspicious_empty_feed", null),
        resolveIssue(database, connectionId, "calendar_unavailable", null),
        resolveIssue(database, connectionId, "sync_failure", null),
      ]).catch(() => undefined);
    }
    if (!parsed.issues.length && !suspiciousTruncation) {
      const missingCancelled = await rpc<number>(
        database,
        "finalize_ical_missing_reservations",
        {
          target_connection: connectionId,
          seen_uids: parsed.events.map((event) => event.externalUid),
        },
      );
      summary.cancelled += missingCancelled;
    }
    const attention =
      parsed.issues.length > 0 || summary.conflicts > 0 || suspiciousTruncation;
    await complete(database, connectionId, {
      successful: true,
      status: attention ? "attention_required" : "healthy",
      feedFingerprint,
      summary,
    });
    return {
      status: attention ? ("attention_required" as const) : ("healthy" as const),
      summary,
    };
  } catch (error) {
    const handled = safeError(error);
    await complete(database, connectionId, {
      successful: false,
      status: "attention_required",
      errorCode: handled.code,
      message: handled.message,
    }).catch(() => undefined);
    await recordIssue(
      database,
      connectionId,
      handled.code === "calendar_unavailable" ? "calendar_unavailable" : "sync_failure",
      null,
      handled.message,
    ).catch(() => undefined);
    throw handled;
  }
}

export function calendarProviderName(provider: CalendarProvider) {
  return providerNames[provider];
}
