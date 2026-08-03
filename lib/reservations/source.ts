export type ReservationSourceConnection = {
  provider: "airbnb" | "booking_com" | "vrbo" | "expedia" | "other";
  display_name: string | null;
  last_successful_sync_at: string | null;
  sync_status?: "never_synced" | "syncing" | "healthy" | "attention_required" | "disabled";
  open_issue_types?: string[];
  open_overlap_count?: number;
  open_rejected_conflicts?: Array<{
    startAt: string | null;
    endAt: string | null;
  }>;
} | null;

export function reservationSourceLabel(
  source: string,
  connection: ReservationSourceConnection,
) {
  if (source === "manual") return "Manual";
  if (!connection) return "Calendar";
  return (
    connection.display_name ||
    {
      airbnb: "Airbnb",
      booking_com: "Booking.com",
      vrbo: "Vrbo",
      expedia: "Expedia",
      other: "Calendar",
    }[connection.provider]
  );
}
