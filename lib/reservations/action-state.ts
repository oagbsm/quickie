import type {
  ReservationField,
  ReservationFieldErrors,
} from "./validation.ts";

export type ReservationActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: ReservationFieldErrors;
};

export const initialReservationActionState: ReservationActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export function reservationErrorState(
  message: string,
  fieldErrors: ReservationFieldErrors = {},
): ReservationActionState {
  return { status: "error", message, fieldErrors };
}

export function reservationSuccessState(
  message = "",
): ReservationActionState {
  return { status: "success", message, fieldErrors: {} };
}

export function reservationFieldError(
  state: ReservationActionState | null | undefined,
  name: ReservationField,
): string | undefined {
  const value = state?.fieldErrors?.[name];
  if (Array.isArray(value)) {
    const messages = value.filter(
      (message): message is string =>
        typeof message === "string" && message.trim().length > 0,
    );
    return messages.length ? messages.join(" ") : undefined;
  }
  return typeof value === "string" && value.trim() ? value : undefined;
}
