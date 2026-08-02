"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addOnboardingProperty,
  type OnboardingPropertyState,
} from "../actions";
import {
  ONBOARDING_BATHROOMS,
  ONBOARDING_BEDROOMS,
  ONBOARDING_PROPERTY_TYPES,
} from "@/lib/business/property-validation";

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
      {pending ? "Saving property…" : "Continue to turnover standard"}
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
      <input type="hidden" name="addressLine2" value="" />
      <input type="hidden" name="accessMethod" value="Owner-arranged access" />

      {Object.keys(errors).length > 0 && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800"
        >
          Check the highlighted fields and try again.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-bold">
          Property name
          <input
            className={field}
            name="nickname"
            placeholder="Harbour View Apartment"
            aria-invalid={Boolean(errors.nickname)}
            aria-describedby={errors.nickname ? "nickname-error" : undefined}
            required
          />
          <ErrorText id="nickname-error" message={errors.nickname} />
        </label>
        <label className="font-bold">
          Property type
          <select
            className={field}
            name="propertyType"
            defaultValue=""
            aria-invalid={Boolean(errors.propertyType)}
            aria-describedby={errors.propertyType ? "property-type-error" : undefined}
            required
          >
            <option value="" disabled>
              Select type
            </option>
            {ONBOARDING_PROPERTY_TYPES.map((value) => (
              <option key={value} value={value}>
                {value === "flat"
                  ? "Apartment / Flat"
                  : value === "airbnb"
                    ? "Studio"
                    : value === "serviced_apartment"
                      ? "Serviced apartment"
                      : value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <ErrorText id="property-type-error" message={errors.propertyType} />
        </label>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-bold">
          Town or city
          <input
            className={field}
            name="city"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "city-error" : undefined}
            required
          />
          <ErrorText id="city-error" message={errors.city} />
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            <option value="" disabled>
              Select bedrooms
            </option>
            {ONBOARDING_BEDROOMS.map((value) => (
              <option key={value} value={value}>
                {value === "0" ? "Studio" : value === "5" ? "5+" : value}
              </option>
            ))}
          </select>
          <ErrorText id="bedrooms-error" message={errors.bedrooms} />
        </label>
        <label className="font-bold">
          Bathrooms
          <select
            className={field}
            name="bathrooms"
            defaultValue=""
            aria-invalid={Boolean(errors.bathrooms)}
            aria-describedby={errors.bathrooms ? "bathrooms-error" : undefined}
            required
          >
            <option value="" disabled>
              Select bathrooms
            </option>
            {ONBOARDING_BATHROOMS.map((value) => (
              <option key={value} value={value}>
                {value === "5" ? "5+" : value}
              </option>
            ))}
          </select>
          <ErrorText id="bathrooms-error" message={errors.bathrooms} />
        </label>
      </div>

      <p className="text-sm font-semibold text-[#657089]">
        You can edit these details later.
      </p>
      <SubmitButton />
    </form>
  );
}
