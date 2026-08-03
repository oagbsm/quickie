import type { CalendarProvider } from "@/lib/calendar/types";

export type RejectedImportConflict = {
  issueId: string;
  anchorId: string;
  provider: CalendarProvider;
  connectionId: string;
  startAt: string | null;
  endAt: string | null;
  conflictingReservation?: {
    id: string;
    provider: CalendarProvider;
    startAt: string;
    endAt: string;
  };
};
