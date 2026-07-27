"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelManualReservation,
  createManualReservation,
  ReservationServiceError,
  updateManualReservation,
} from "@/lib/server/reservations";
import {
  executeReservationMutation,
  executeReservationSubmission,
} from "@/lib/reservations/action-execution";
import type { ReservationActionState } from "@/lib/reservations/action-state";
import { reservationSourceFromForm } from "@/lib/reservations/validation";

function expectedErrorMessage(error: unknown): string {
  if (error instanceof ReservationServiceError)
    return error.message;
  console.warn(
    JSON.stringify({
      event: "reservation_action_failed",
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  return "The reservation could not be saved. Try again.";
}

function revalidateReservationRoutes(id: string) {
  revalidatePath("/business/dashboard");
  revalidatePath("/business/properties");
  revalidatePath("/business/reservations");
  revalidatePath(`/business/reservations/${id}`);
  revalidatePath("/business/turnovers");
}

export async function createReservationAction(
  _previous: ReservationActionState,
  form: FormData,
): Promise<ReservationActionState> {
  const source = reservationSourceFromForm(form);
  const outcome = await executeReservationSubmission(
    source,
    () => createManualReservation(
      source,
      String(form.get("requestKey") || ""),
    ),
    expectedErrorMessage,
  );
  if (!outcome.ok) return outcome.state;
  const result = outcome.value;
  revalidateReservationRoutes(result.reservationId);
  redirect(`/business/reservations/${result.reservationId}?created=1`);
}

export async function updateReservationAction(
  reservationId: string,
  _previous: ReservationActionState,
  form: FormData,
): Promise<ReservationActionState> {
  const source = reservationSourceFromForm(form);
  const outcome = await executeReservationSubmission(
    source,
    () => updateManualReservation(reservationId, source),
    expectedErrorMessage,
  );
  if (!outcome.ok) return outcome.state;
  const result = outcome.value;
  revalidateReservationRoutes(result.reservationId);
  redirect(
    `/business/reservations/${result.reservationId}?${result.changed ? "updated=1" : "unchanged=1"}`,
  );
}

export async function cancelReservationAction(
  reservationId: string,
  _previous: ReservationActionState,
  form: FormData,
): Promise<ReservationActionState> {
  void form;
  const outcome = await executeReservationMutation(
    () => cancelManualReservation(reservationId),
    expectedErrorMessage,
  );
  if (!outcome.ok) return outcome.state;
  const result = outcome.value;
  revalidateReservationRoutes(result.reservationId);
  redirect(`/business/reservations/${result.reservationId}?cancelled=1`);
}
