import {
  reservationErrorState,
  reservationSuccessState,
  type ReservationActionState,
} from "./action-state.ts";
import {
  validateReservationInput,
  type ReservationFormSource,
} from "./validation.ts";

export type ReservationActionOutcome<T> =
  | { ok: true; state: ReservationActionState; value: T }
  | { ok: false; state: ReservationActionState };

export async function executeReservationMutation<T>(
  mutate: () => Promise<T>,
  errorMessage: (error: unknown) => string,
): Promise<ReservationActionOutcome<T>> {
  try {
    const value = await mutate();
    return { ok: true, state: reservationSuccessState(), value };
  } catch (error) {
    return { ok: false, state: reservationErrorState(errorMessage(error)) };
  }
}

export async function executeReservationSubmission<T>(
  source: ReservationFormSource,
  submit: () => Promise<T>,
  errorMessage: (error: unknown) => string,
): Promise<ReservationActionOutcome<T>> {
  const validation = validateReservationInput(source);
  if (!validation.ok) {
    return {
      ok: false,
      state: reservationErrorState(
        validation.message,
        validation.fieldErrors,
      ),
    };
  }
  return executeReservationMutation(submit, errorMessage);
}
