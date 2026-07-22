"use client";
import { useActionState, useState } from "react";
import { submitBusinessEnquiry, type EnquiryState } from "./actions";

export default function BusinessEnquiryForm() {
  const [key] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitBusinessEnquiry,
    { message: "" },
  );
  const input =
    "mt-2 min-h-12 w-full rounded-xl border border-[#d8e0e8] bg-white px-4 py-3 font-semibold outline-none transition focus:border-[#079448] focus:ring-4 focus:ring-[#079448]/10";
  return (
    <form
      action={action}
      aria-describedby="enquiry-guidance"
      className="grid gap-5 rounded-2xl border border-[#e0e7e3] bg-white p-5 shadow-[0_18px_48px_rgba(7,22,56,.08)] sm:p-8"
    >
      <input type="hidden" name="idempotencyKey" value={key} />
      <input
        name="website"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div>
        <p className="eyebrow">Access request</p>
        <h2 className="mt-2 text-[1.75rem] font-extrabold tracking-[-.03em]">
          Your business details
        </h2>
        <p
          id="enquiry-guidance"
          className="mt-2 text-sm leading-6 text-[#657089]"
        >
          Required fields are marked. Everything else can be discussed later.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            className={input}
            name="name"
            autoComplete="name"
            required
            minLength={2}
          />
        </Field>
        <Field label="Business or organisation">
          <input
            className={input}
            name="organisation"
            autoComplete="organization"
            required
            minLength={2}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Work email" hint="Provide an email or phone number">
          <input
            className={input}
            name="email"
            type="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" hint="Provide an email or phone number">
          <input className={input} name="phone" type="tel" autoComplete="tel" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation type">
          <select
            className={input}
            name="customerType"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select one
            </option>
            <option value="letting_agent">Letting agent</option>
            <option value="property_manager">Property manager</option>
            <option value="airbnb_operator">Airbnb operator</option>
            <option value="serviced_accommodation">
              Serviced accommodation
            </option>
            <option value="portfolio_landlord">Portfolio landlord</option>
            <option value="office_business">Office or business</option>
            <option value="block_manager">Block or communal manager</option>
            <option value="commercial_operator">Commercial premises</option>
            <option value="other">Other organisation</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Main postcode or operating area">
          <input
            className={input}
            name="area"
            autoComplete="postal-code"
            required
            placeholder="e.g. SL1 or Slough"
          />
        </Field>
        <Field label="Cleaning required">
          <select
            className={input}
            name="cleaningType"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select one
            </option>
            <option value="recurring_property">
              Recurring property cleaning
            </option>
            <option value="airbnb_turnover">Airbnb turnovers</option>
            <option value="end_of_tenancy">End-of-tenancy</option>
            <option value="office">Office cleaning</option>
            <option value="communal_area">Communal areas</option>
            <option value="deep_clean">Managed-property deep cleaning</option>
            <option value="property_turnaround">Property turnaround</option>
            <option value="mixed">Several cleaning types</option>
          </select>
        </Field>
      </div>
      <Field label="Operational notes" optional>
        <textarea
          className={input}
          name="notes"
          rows={4}
          placeholder="Access, turnaround windows, site requirements or anything else useful."
        />
      </Field>
      <p className="text-xs leading-5 text-[#657089]">
        By submitting, you agree that Quickola may contact you about this
        enquiry. We’ll review your service area and requirements before
        confirming any work. See our{" "}
        <a href="/privacy-policy" className="font-bold underline">
          privacy policy
        </a>
        .
      </p>
      {state.message && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800"
        >
          {state.message}
        </p>
      )}
      <button
        disabled={pending || !key}
        className="min-h-12 rounded-xl bg-[#079448] px-6 font-black text-white transition hover:bg-[#087f40] focus:outline-none focus:ring-4 focus:ring-[#079448]/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending request…" : "Request business access"}
      </button>
      <p className="text-center text-sm font-semibold text-[#526078]">
        We usually respond within one business day.
      </p>
    </form>
  );
}
function Field({
  label,
  optional = false,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}{" "}
      {optional && (
        <span className="font-normal text-[#657089]">(optional)</span>
      )}
      {hint && (
        <span className="mt-1 block text-xs font-normal text-[#657089]">
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}
