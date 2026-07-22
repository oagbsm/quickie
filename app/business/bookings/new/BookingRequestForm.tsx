"use client";
import { useActionState, useMemo, useState } from "react";
import {
  createBooking,
  joinServiceAreaWaitlist,
  type BookingActionState,
} from "../../actions";
import {
  calculatePilotQuote,
  formatDuration,
  formatMoney,
  pilotPricingConfig,
  type PilotExtra,
  type PilotFrequency,
  type PilotService,
} from "@/lib/business/pricing";
import { getPilotStartTimes } from "@/lib/business/time";
type Property = {
  id: string;
  nickname: string;
  address_line_1: string;
  postcode: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  service_area_status: string;
};
export default function BookingRequestForm({
  properties,
  selected,
  error,
}: {
  properties: Property[];
  selected?: string;
  error?: string;
}) {
  const [step, setStep] = useState(1),
    [propertyId, setPropertyId] = useState(selected || ""),
    [service, setService] = useState<PilotService>("regular_cleaning"),
    [frequency, setFrequency] = useState<PilotFrequency>("one_off"),
    [extras, setExtras] = useState<PilotExtra[]>([]),
    [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submission, formAction, pending] = useActionState<
    BookingActionState,
    FormData
  >(createBooking, { message: "" });
  const property = properties.find((p) => p.id === propertyId),
    outside = property && property.service_area_status !== "eligible",
    quote = useMemo(
      () =>
        property
          ? calculatePilotQuote({
              service,
              frequency,
              propertyType: property.property_type,
              bedrooms: Number(property.bedrooms || 0),
              bathrooms: Number(property.bathrooms || 1),
              extras,
              serviceAreaStatus: property.service_area_status,
            })
          : null,
      [property, service, frequency, extras],
    ),
    availableTimes = quote
      ? getPilotStartTimes(quote.estimatedDurationMinutes)
      : [],
    c =
      "mt-2 min-h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-4 py-3 outline-none focus:border-[#079448] focus:ring-4 focus:ring-[#079448]/10";
  function toggle(extra: PilotExtra) {
    setExtras((current) =>
      current.includes(extra)
        ? current.filter((x) => x !== extra)
        : [...current, extra],
    );
  }
  function next() {
    if (step === 1 && !propertyId) return;
    if (step === 3 && (!date || !time)) return;
    setStep((s) => Math.min(4, s + 1));
  }
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (step !== 4) {
          event.preventDefault();
          next();
        }
      }}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          step !== 4 &&
          event.target instanceof HTMLInputElement
        ) {
          event.preventDefault();
        }
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="rounded-2xl border bg-white p-5 sm:p-7">
        <div className="mb-7 flex gap-2" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`h-2 flex-1 rounded-full ${n <= step ? "bg-[#079448]" : "bg-[#e2e7ed]"}`}
            />
          ))}
        </div>
        <p className="text-xs font-black uppercase tracking-[.12em] text-[#079448]">
          Step {step} of 4
        </p>
        <section hidden={step !== 1}>
          <h2 className="mt-2 text-2xl font-black">
            Choose property and service
          </h2>
          <label className="mt-6 block font-bold">
            Property
            <select
              name="propertyId"
              className={c}
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname}
                  {p.service_area_status !== "eligible"
                    ? " — outside area"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          {outside && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">
              <p className="font-black text-amber-950">
                We’re not yet fulfilling cleans in this postcode.
              </p>
              <p className="mt-1 text-amber-900">
                You can still manage the property here, and we’ll let you know
                when Quickola becomes available in your area.
              </p>
              <button
                formAction={joinServiceAreaWaitlist}
                name="propertyId"
                value={property.id}
                className="mt-3 min-h-11 font-bold text-amber-950 underline"
              >
                Join the service-area waitlist
              </button>
            </div>
          )}
          <fieldset className="mt-6">
            <legend className="font-bold">Cleaning type</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["regular_cleaning", "Regular clean"],
                ["deep_cleaning", "Deep clean"],
                ["end_of_tenancy", "End-of-tenancy"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border p-4 font-black ${service === value ? "border-[#079448] bg-[#edf7f1]" : ""}`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={value}
                    checked={service === value}
                    onChange={() => setService(value as PilotService)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <section hidden={step !== 2}>
          <h2 className="mt-2 text-2xl font-black">Frequency and extras</h2>
          <label className="mt-6 block font-bold">
            Frequency
            <select
              name="recurrence"
              className={c}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as PilotFrequency)}
            >
              <option value="one_off">One-off</option>
              <option value="weekly">Weekly — 10% pilot discount</option>
              <option value="fortnightly">
                Fortnightly — 5% pilot discount
              </option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <fieldset className="mt-6">
            <legend className="font-bold">Optional extras</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(pilotPricingConfig.extras).map(([key, item]) => (
                <label
                  key={key}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 ${extras.includes(key as PilotExtra) ? "border-[#079448] bg-[#edf7f1]" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="extras"
                    value={key}
                    checked={extras.includes(key as PilotExtra)}
                    onChange={() => toggle(key as PilotExtra)}
                    className="h-5 w-5"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <section hidden={step !== 3}>
          <h2 className="mt-2 text-2xl font-black">Choose date and time</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="font-bold">
              Preferred date
              <input
                name="date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={c}
                required
              />
            </label>
            <label className="font-bold">
              Preferred start time
              <select
                name="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={c}
                required
              >
                <option value="" disabled>
                  Select a start time
                </option>
                {availableTimes.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-[#657089]">
                Monday–Saturday. Times shown are UK local time and allow the
                clean to finish by 18:00.
              </span>
            </label>
          </div>
          <label className="mt-6 block font-bold">
            Notes for Quickola
            <textarea
              name="requirements"
              rows={4}
              className={c}
              placeholder="Priorities or anything we should know."
            />
          </label>
        </section>
        <section hidden={step !== 4}>
          <h2 className="mt-2 text-2xl font-black">Review your booking</h2>
          {property && quote && (
            <div className="mt-6 grid gap-4">
              <Review
                label="Property"
                value={`${property.nickname}, ${property.postcode}`}
              />
              <Review label="Service" value={service.replaceAll("_", " ")} />
              <Review
                label="Frequency"
                value={frequency.replaceAll("_", " ")}
              />
              <Review label="Date and time" value={`${date} at ${time}`} />
              <Review
                label="Estimated duration"
                value={formatDuration(quote.estimatedDurationMinutes)}
              />
              <div className="rounded-xl bg-[#f5f7f8] p-4">
                {quote.breakdown.map((line) => (
                  <div
                    key={line.key}
                    className="flex justify-between py-1 text-sm"
                  >
                    <span>{line.label}</span>
                    <strong>
                      {line.amountPence
                        ? formatMoney(line.amountPence)
                        : "Included"}
                    </strong>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t pt-3 text-xl font-black">
                  <span>
                    {quote.requiresManualReview
                      ? "Estimated range"
                      : "Booking total"}
                  </span>
                  <span>
                    {quote.requiresManualReview
                      ? `${formatMoney(quote.estimatedPricePence)}–${formatMoney(quote.estimatedPriceMaxPence || quote.estimatedPricePence)}`
                      : formatMoney(quote.estimatedPricePence)}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-[#edf7f1] p-4 text-sm">
                <p className="font-black">
                  {quote.requiresManualReview
                    ? "Non-standard request"
                    : "Calculated booking total"}
                </p>
                <p className="mt-1">
                  {quote.requiresManualReview
                    ? "We will confirm your final price before work begins."
                    : "This total is calculated from the property, service, frequency and extras shown above. Your appointment is confirmed separately."}
                </p>
              </div>
            </div>
          )}
        </section>
        {(error || submission.message) && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800"
          >
            {submission.message ||
              (error === "outside_area"
                ? "We’re not yet fulfilling cleans in this postcode. You can still manage the property here, and we’ll let you know when Quickola becomes available in your area."
                : "Please check the booking details and try again.")}
          </p>
        )}
        <div className="mt-7 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="min-h-11 rounded-xl border px-5 font-black"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={
                Boolean(outside) ||
                (step === 1 && !propertyId) ||
                (step === 3 && (!date || !time))
              }
              className="min-h-11 flex-1 rounded-xl bg-[#071638] px-5 font-black text-white disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                !quote || Boolean(outside) || pending || !idempotencyKey
              }
              className="min-h-11 flex-1 rounded-xl bg-[#079448] px-5 font-black text-white disabled:opacity-40"
            >
              {pending
                ? "Submitting request…"
                : quote?.requiresManualReview
                  ? "Send request for price review"
                  : `Submit booking request for ${formatMoney(quote?.estimatedPricePence || 0)}`}
            </button>
          )}
        </div>
      </div>
      <aside className="h-fit rounded-2xl bg-[#071638] p-5 text-white lg:sticky lg:top-24">
        <p className="text-xs font-black uppercase tracking-[.12em] text-[#4bd35f]">
          Booking summary
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <Summary
            label="Property"
            value={property?.nickname || "Not selected"}
          />
          <Summary label="Service" value={service.replaceAll("_", " ")} />
          <Summary
            label="Date"
            value={date && time ? `${date} · ${time}` : "Not selected"}
          />
          <Summary label="Frequency" value={frequency.replaceAll("_", " ")} />
          <Summary
            label="Duration"
            value={quote ? formatDuration(quote.estimatedDurationMinutes) : "—"}
          />
        </dl>
        <div className="mt-5 border-t border-white/15 pt-5">
          <p className="text-sm text-white/60">
            {quote?.requiresManualReview
              ? "Estimated range"
              : "Estimated price"}
          </p>
          <p className="mt-1 text-3xl font-black">
            {quote
              ? quote.requiresManualReview
                ? `${formatMoney(quote.estimatedPricePence)}–${formatMoney(quote.estimatedPriceMaxPence || quote.estimatedPricePence)}`
                : formatMoney(quote.estimatedPricePence)
              : "—"}
          </p>
        </div>
      </aside>
    </form>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/55">{label}</dt>
      <dd className="font-bold capitalize">{value}</dd>
    </div>
  );
}
function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#788398]">
        {label}
      </p>
      <p className="mt-1 font-black capitalize">{value}</p>
    </div>
  );
}
