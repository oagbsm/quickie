"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PendingButton from "@/app/components/PendingButton";
import { addProperty } from "../actions";
import AddressLookup from "./AddressLookup";
import { ONBOARDING_BEDROOMS } from "@/lib/business/property-validation";

const field =
  "mt-1 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const labels = [
  "Property details",
  "Connect calendar",
];
const providerNames: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "Vrbo",
  expedia: "Expedia",
  other: "Other calendar",
};
const providerOptions = [
  { value: "airbnb", label: "Airbnb", helper: "Paste your Airbnb private iCal link." },
  { value: "booking_com", label: "Booking.com", helper: "Paste your Booking.com calendar link." },
  { value: "vrbo", label: "Vrbo", helper: "Paste your Vrbo calendar link." },
  { value: "expedia", label: "Expedia", helper: "Paste your Expedia calendar link." },
  { value: "other", label: "Other calendar", helper: "Paste your private iCal calendar link." },
] as const;

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </svg>
  );
}
export default function PropertyWizard({ error, addressLookupEnabled = false }: { error?: string; addressLookupEnabled?: boolean }) {
  const [step, setStep] = useState(0);
  const [reservationSource, setReservationSource] = useState("");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!error && localStorage.getItem("quickola-property-submit") === "1") {
      localStorage.removeItem("quickola-property-draft");
      localStorage.removeItem("quickola-property-submit");
      return;
    }
    const raw = localStorage.getItem("quickola-property-draft");
    if (!raw || !ref.current) return;
    const saved = JSON.parse(raw);
    setReservationSource(saved.reservationProvider || "");
    for (const el of Array.from(ref.current.elements)) {
      if (
        (el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement) &&
        el.type !== "file" &&
        saved[el.name] !== undefined
      )
        el.value = saved[el.name];
    }
  }, [error]);
  useEffect(() => {
    const warning = (e: BeforeUnloadEvent) => {
      if (step > 0 && step < labels.length - 1) e.preventDefault();
    };
    addEventListener("beforeunload", warning);
    return () => removeEventListener("beforeunload", warning);
  }, [step]);
  function save() {
    if (!ref.current) return;
    const out: Record<string, string> = {};
    new FormData(ref.current).forEach((v, k) => {
      if (typeof v === "string") out[k] = v;
    });
    localStorage.setItem("quickola-property-draft", JSON.stringify(out));
  }
  function next() {
    const invalid = ref.current
      ?.querySelector<HTMLElement>(`[data-step="${step}"]`)
      ?.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(":invalid");
    if (invalid) {
      invalid.focus();
      invalid.reportValidity();
      return;
    }
    save();
    setStep((s) => Math.min(labels.length - 1, s + 1));
    scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <form
      ref={ref}
      action={addProperty}
      onSubmit={() => localStorage.setItem("quickola-property-submit", "1")}
      className="mx-auto max-w-4xl"
    >
      <ol
        aria-label="Property creation progress"
        className="mb-5 grid grid-cols-2 gap-1.5 sm:mb-7 sm:gap-2"
      >
        {labels.map((x, i) => (
          <li key={x} aria-current={i === step ? "step" : undefined}>
            <div
              className={`h-1.5 rounded-full ${i < step ? "bg-[#2d67b2]" : i === step ? "bg-[#071f49] ring-2 ring-[#2d67b2]/20" : "bg-[#dfe4eb]"}`}
            />
            <span
              className={`mt-2 hidden text-xs font-bold sm:block ${i === step ? "text-[#071f49]" : "text-[#748096]"}`}
            >
              {i + 1}. {x}
            </span>
          </li>
        ))}
      </ol>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 font-bold text-red-800"
        >
          {error === "duplicate" ? "A property with this address already exists in your workspace." : error === "required" ? "Enter all required fields and a valid UK postcode." : "The property could not be saved. Review the information and try again."}
        </p>
      )}
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-8">
        <section data-step="0" hidden={step !== 0}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 1 OF 2</p>
          <h2 className="mt-1 text-2xl font-extrabold">Property details</h2>
          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-5">
            {addressLookupEnabled && <AddressLookup />}
            <label className="font-bold">
              Property name
              <input className={field} name="nickname" placeholder="e.g. Harbour View Apartment" required />
            </label>
            <label className="font-bold">
              Full address
              <input
                className={field}
                name="addressLine1"
                autoComplete="address-line1"
                required
              />
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
                required
              />
            </label>
            <label className="font-bold">
              Bedrooms
              <select className={field} name="bedrooms" defaultValue="" required>
                <option value="" disabled>Select bedrooms</option>
                {ONBOARDING_BEDROOMS.map((value) => (
                  <option key={value} value={value}>
                    {value === "0" ? "Studio" : value === "5" ? "5+" : value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section data-step="1" hidden={step !== 1}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 2 OF 2</p>
          <h2 className="mt-1 text-2xl font-extrabold">Connect your booking calendar</h2>
          <p className="mt-2 text-[#657089]">
            Automatically keep Quickola updated when bookings change.
          </p>
          <div className="mt-5 grid gap-5">
            <fieldset>
              <legend className="font-bold">Where do your bookings come from?</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {providerOptions.map((option) => (
                  <label
                    key={option.value}
                    className="box-border flex h-[66px] w-full cursor-pointer items-center justify-center rounded-lg border border-[#cfd7e3] bg-white p-2 text-sm font-bold transition hover:bg-[#f8fafc] focus-within:ring-4 focus-within:ring-[#2d67b2]/15 sm:h-[68px] has-[:checked]:border-[#2d67b2] has-[:checked]:bg-[#eef4fc]"
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="reservationProvider"
                      value={option.value}
                      aria-label={option.label}
                      required
                      checked={reservationSource === option.value}
                      onChange={(event) => setReservationSource(event.target.value)}
                    />
                    {option.value === "airbnb" && <span className="flex h-[42px] w-full max-w-[148px] items-center justify-center overflow-hidden"><Image src="/icons/airbnb.png" alt="" aria-hidden="true" width={115} height={42} className="h-auto max-h-[42px] w-auto max-w-[115px] object-contain object-center" style={{ maxWidth: "100%" }} /></span>}
                    {option.value === "booking_com" && <span className="flex h-[42px] w-full max-w-[148px] items-center justify-center overflow-hidden"><Image src="/icons/booking.jpg" alt="" aria-hidden="true" width={148} height={38} className="h-auto max-h-[38px] w-auto max-w-[148px] object-contain object-center" style={{ maxWidth: "100%" }} /></span>}
                    {option.value === "vrbo" && <span className="flex h-[42px] w-full max-w-[148px] items-center justify-center overflow-hidden"><Image src="/icons/vrbo.png" alt="" aria-hidden="true" width={115} height={42} className="h-auto max-h-[42px] w-auto max-w-[115px] object-contain object-center" style={{ maxWidth: "100%" }} /></span>}
                    {option.value === "expedia" && <span className="flex h-[42px] w-full max-w-[148px] items-center justify-center overflow-hidden"><Image src="/icons/expedia.png" alt="" aria-hidden="true" width={115} height={42} className="h-auto max-h-[42px] w-auto max-w-[115px] object-contain object-center" style={{ maxWidth: "100%" }} /></span>}
                    {option.value === "other" && <span className="flex items-center gap-2"><CalendarIcon /><span>{option.label}</span></span>}
                  </label>
                ))}
              </div>
              <label className="mt-2 flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 text-sm font-bold focus-within:ring-4 focus-within:ring-[#2d67b2]/15 has-[:checked]:border-[#2d67b2] has-[:checked]:bg-[#eef4fc] has-[:checked]:text-[#071f49]">
                <input
                  className="sr-only"
                  type="radio"
                  name="reservationProvider"
                  value="connect_later"
                  required
                  checked={reservationSource === "connect_later"}
                  onChange={(event) => setReservationSource(event.target.value)}
                />
                Connect later
              </label>
            </fieldset>
            {reservationSource && reservationSource !== "connect_later" && (
              <div>
                <label className="font-bold">
                  {`Connect your ${providerNames[reservationSource] || "booking"} calendar`}
                  <input
                    className={field}
                    type="url"
                    name="reservationCalendarUrl"
                    autoComplete="off"
                    placeholder="https://…"
                    required
                  />
                </label>
                <p className="mt-1 text-xs text-[#657089]">
                  {providerOptions.find((option) => option.value === reservationSource)?.helper}
                </p>
                <p className="mt-3 text-sm text-[#657089]">
                  Quickola uses your calendar to create and update turnovers automatically when reservations change.
                </p>
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-bold text-[#2d67b2]">Where do I find this?</summary>
                  <p className="mt-2 text-[#657089]">
                    Open your booking platform&apos;s calendar settings, copy its private iCal or calendar link, then paste it here.
                  </p>
                </details>
              </div>
            )}
          </div>
        </section>
      </div>
      <div className="mt-5 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="min-h-12 rounded-lg border px-5 font-bold disabled:invisible"
        >
          Back
        </button>
        {step < labels.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="min-h-12 rounded-lg bg-[#071f49] px-6 font-extrabold text-white"
          >
            Continue
          </button>
        ) : (
          <PendingButton
            idle="Create property"
            pending="Creating property…"
            className="min-h-12 rounded-lg bg-[#071f49] px-6 font-extrabold text-white"
          />
        )}
      </div>
    </form>
  );
}
