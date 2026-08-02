"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addOnboardingProperty,
  type OnboardingPropertyState,
} from "../actions";
import { ONBOARDING_BEDROOMS } from "@/lib/business/property-validation";

const field =
  "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const initialState: OnboardingPropertyState = { errors: {} };

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="min-h-12 w-full rounded-lg bg-[#071f49] font-extrabold text-white disabled:opacity-60"
    >
      {pending ? "Saving property…" : "Continue"}
    </button>
  );
}

export default function PropertyBasicsForm() {
  const [state, formAction] = useActionState(
    addOnboardingProperty,
    initialState,
  );
  const errors = state.errors;

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-4 rounded-xl border border-[#e1e6ee] bg-white p-4 shadow-sm sm:mt-6 sm:gap-5 sm:p-7"
    >
      <input type="hidden" name="returnTo" value="onboarding" />
      {Object.keys(errors).length > 0 && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800"
        >
          Check the highlighted fields and try again.
        </p>
      )}

      <label className="font-bold">
        Property name
        <input
          className={field}
          name="nickname"
          placeholder="e.g. Harbour View Apartment"
          aria-invalid={Boolean(errors.nickname)}
          aria-describedby={errors.nickname ? "nickname-error" : undefined}
          required
        />
        <ErrorText id="nickname-error" message={errors.nickname} />
      </label>

      <label className="font-bold">
        Full address
        <input
          className={field}
          name="addressLine1"
          autoComplete="address-line1"
          aria-invalid={Boolean(errors.addressLine1)}
          aria-describedby={errors.addressLine1 ? "address-error" : undefined}
          required
        />
        <ErrorText id="address-error" message={errors.addressLine1} />
      </label>

      <label className="font-bold">
        Postcode
        <input
          className={field}
          name="postcode"
          autoComplete="postal-code"
          autoCapitalize="characters"
          inputMode="text"
          placeholder="SL1 1AA"
          pattern="[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}"
          title="Enter a valid UK postcode, for example SL1 1AA"
          aria-invalid={Boolean(errors.postcode)}
          aria-describedby={errors.postcode ? "postcode-error" : undefined}
          required
        />
        <ErrorText id="postcode-error" message={errors.postcode} />
      </label>

      <label className="font-bold">
        Bedrooms
        <select
          className={field}
          name="bedrooms"
          defaultValue=""
          aria-invalid={Boolean(errors.bedrooms)}
          aria-describedby={errors.bedrooms ? "bedrooms-error" : undefined}
          required
        >
          <option value="" disabled>Select bedrooms</option>
          {ONBOARDING_BEDROOMS.map((value) => (
            <option key={value} value={value}>
              {value === "0" ? "Studio" : value === "5" ? "5+" : value}
            </option>
          ))}
        </select>
        <ErrorText id="bedrooms-error" message={errors.bedrooms} />
      </label>

      <p className="text-sm font-semibold text-[#657089]">
        You can edit these details later.
      </p>
      <SubmitButton />
    </form>
  );
}
