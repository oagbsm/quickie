import {
  reservationStatusLabels,
  type ReservationStatus as Status,
} from "@/lib/reservations/status";

const tones: Record<string, string> = {
  confirmed: "border-blue-100 bg-blue-50 text-blue-800",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-800",
};

export default function ReservationStatus({ status }: { status: string }) {
  return (
    <span
      className={`portal-pill border ${tones[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}
    >
      {reservationStatusLabels[status as Status] || status.replaceAll("_", " ")}
    </span>
  );
}
