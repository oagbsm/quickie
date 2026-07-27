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
  reservationSourceFromForm,
  type ReservationFieldErrors,
  validateReservationInput,
} from "@/lib/reservations/validation";

export type ReservationActionState = {
  message: string;
  fieldErrors: ReservationFieldErrors;
};

export const initialReservationActionState: ReservationActionState = {
  message: "",
  fieldErrors: {},
};

function expectedError(error: unknown): ReservationActionState {
  if (error instanceof ReservationServiceError)
    return { message: error.message, fieldErrors: {} };
  console.warn(
    JSON.stringify({
      event: "reservation_action_failed",
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  return {
    message: "The reservation could not be saved. Try again.",
    fieldErrors: {},
  };
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
  const validation = validateReservationInput(source);
  if (!validation.ok)
    return {
      message: validation.message,
      fieldErrors: validation.fieldErrors,
    };
  let result;
  try {
    result = await createManualReservation(
      source,
      String(form.get("requestKey") || ""),
    );
  } catch (error) {
    return expectedError(error);
  }
  revalidateReservationRoutes(result.reservationId);
  redirect(`/business/reservations/${result.reservationId}?created=1`);
}

export async function updateReservationAction(
  reservationId: string,
  _previous: ReservationActionState,
  form: FormData,
): Promise<ReservationActionState> {
  const source = reservationSourceFromForm(form);
  const validation = validateReservationInput(source);
  if (!validation.ok)
    return {
      message: validation.message,
      fieldErrors: validation.fieldErrors,
    };
  let result;
  try {
    result = await updateManualReservation(reservationId, source);
  } catch (error) {
    return expectedError(error);
  }
  revalidateReservationRoutes(result.reservationId);
  redirect(
    `/business/reservations/${result.reservationId}?${result.changed ? "updated=1" : "unchanged=1"}`,
  );
}

export async function cancelReservationAction(
  reservationId: string,
  form: FormData,
) {
  void form;
  let result;
  try {
    result = await cancelManualReservation(reservationId);
  } catch (error) {
    const state = expectedError(error);
    redirect(
      `/business/reservations/${reservationId}?error=${encodeURIComponent(state.message)}`,
    );
  }
  revalidateReservationRoutes(result.reservationId);
  redirect(`/business/reservations/${result.reservationId}?cancelled=1`);
}
