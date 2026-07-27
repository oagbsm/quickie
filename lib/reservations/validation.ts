import { londonLocalToUtc } from "../business/time.ts";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReservationInput = {
  propertyId: string;
  guestName: string | null;
  guestCount: number | null;
  checkInAt: string;
  checkOutAt: string;
};

export type ReservationField =
  | "propertyId"
  | "guestName"
  | "guestCount"
  | "checkInDate"
  | "checkInTime"
  | "checkOutDate"
  | "checkOutTime";

export type ReservationFieldErrors = Partial<Record<ReservationField, string>>;

export type ReservationValidationResult =
  | { ok: true; value: ReservationInput }
  | { ok: false; message: string; fieldErrors: ReservationFieldErrors };

export type ReservationFormSource = {
  propertyId?: unknown;
  guestName?: unknown;
  guestCount?: unknown;
  checkInDate?: unknown;
  checkInTime?: unknown;
  checkOutDate?: unknown;
  checkOutTime?: unknown;
};

const value = (input: unknown) =>
  typeof input === "string" ? input.trim() : "";

export function validateReservationInput(
  source: ReservationFormSource,
): ReservationValidationResult {
  const propertyId = value(source.propertyId);
  const guestName = value(source.guestName);
  const guestCountText = value(source.guestCount);
  const checkInDate = value(source.checkInDate);
  const checkInTime = value(source.checkInTime);
  const checkOutDate = value(source.checkOutDate);
  const checkOutTime = value(source.checkOutTime);
  const fieldErrors: ReservationFieldErrors = {};

  if (!UUID_PATTERN.test(propertyId))
    fieldErrors.propertyId = "Select a valid property.";
  if (guestName.length > 160)
    fieldErrors.guestName = "Guest name must be 160 characters or fewer.";

  let guestCount: number | null = null;
  if (guestCountText) {
    guestCount = Number(guestCountText);
    if (!Number.isInteger(guestCount) || guestCount <= 0 || guestCount > 1000)
      fieldErrors.guestCount = "Guest count must be a positive whole number.";
  }

  if (!checkInDate) fieldErrors.checkInDate = "Enter the check-in date.";
  if (!checkInTime) fieldErrors.checkInTime = "Enter the check-in time.";
  if (!checkOutDate) fieldErrors.checkOutDate = "Enter the check-out date.";
  if (!checkOutTime) fieldErrors.checkOutTime = "Enter the check-out time.";

  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  if (checkInDate && checkInTime) {
    try {
      checkIn = londonLocalToUtc(checkInDate, checkInTime);
    } catch {
      fieldErrors.checkInTime =
        "Enter a valid London local time. This time may not exist when the clocks change.";
    }
  }
  if (checkOutDate && checkOutTime) {
    try {
      checkOut = londonLocalToUtc(checkOutDate, checkOutTime);
    } catch {
      fieldErrors.checkOutTime =
        "Enter a valid London local time. This time may not exist when the clocks change.";
    }
  }
  if (checkIn && checkOut && checkOut <= checkIn)
    fieldErrors.checkOutDate = "Check-out must be after check-in.";

  if (Object.keys(fieldErrors).length || !checkIn || !checkOut)
    return {
      ok: false,
      message: "Review the highlighted reservation details.",
      fieldErrors,
    };

  return {
    ok: true,
    value: {
      propertyId,
      guestName: guestName || null,
      guestCount,
      checkInAt: checkIn.toISOString(),
      checkOutAt: checkOut.toISOString(),
    },
  };
}

export function reservationSourceFromForm(form: FormData): ReservationFormSource {
  return {
    propertyId: form.get("propertyId"),
    guestName: form.get("guestName"),
    guestCount: form.get("guestCount"),
    checkInDate: form.get("checkInDate"),
    checkInTime: form.get("checkInTime"),
    checkOutDate: form.get("checkOutDate"),
    checkOutTime: form.get("checkOutTime"),
  };
}
