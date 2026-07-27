export type ReservationSourceConnection = {
  provider: "airbnb" | "booking_com" | "vrbo" | "other";
  display_name: string | null;
  last_successful_sync_at: string | null;
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
      other: "Calendar",
    }[connection.provider]
  );
}
