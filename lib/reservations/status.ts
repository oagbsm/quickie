export const reservationStatuses = [
  "confirmed",
  "cancelled",
  "completed",
] as const;

export type ReservationStatus = (typeof reservationStatuses)[number];

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};
