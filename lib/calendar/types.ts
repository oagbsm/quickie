export type CalendarProvider = "airbnb" | "booking_com" | "vrbo" | "expedia" | "other";

export type NormalizedCalendarEvent = {
  connectionId: string;
  externalUid: string;
  provider: CalendarProvider;
  checkInAt: string;
  checkOutAt: string;
  status: "confirmed" | "cancelled";
  sequence: number | null;
  externalLastModifiedAt: string | null;
  fingerprint: string;
  safeDisplayTitle: string;
  recurrenceId: string | null;
  rawSourceStatus: string | null;
};

export type CalendarParseIssue = {
  code: "missing_uid" | "invalid_date" | "invalid_range" | "duplicate_uid";
  safeMessage: string;
  externalUidHash: string | null;
};

export type CalendarParseResult = {
  events: NormalizedCalendarEvent[];
  issues: CalendarParseIssue[];
  eventCount: number;
};

export type CalendarSyncSummary = {
  imported: number;
  updated: number;
  cancelled: number;
  unchanged: number;
  conflicts: number;
};
