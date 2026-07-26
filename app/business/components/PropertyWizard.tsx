"use client";
import { useEffect, useRef, useState } from "react";
import PendingButton from "@/app/components/PendingButton";
import { addProperty } from "../actions";
import AddressLookup from "./AddressLookup";

const field =
  "mt-1 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const labels = [
  "Property details",
  "Turnover timings",
  "Guest-ready standard",
  "Checklist review",
  "Review",
];
const checklist = [
  "Entry and initial inspection",
  "Bedrooms and linen",
  "Bathrooms",
  "Kitchen",
  "Living areas",
  "Consumables and waste",
  "Damage check",
  "Final presentation",
  "Keys and security",
  "Completion evidence",
];
export default function PropertyWizard({ error, defaults }: { error?: string; defaults?: { checkout: string; checkin: string; duration: number } }) {
  const [step, setStep] = useState(0),
    [custom, setCustom] = useState<string[]>([]),
    [summary, setSummary] = useState<Record<string, string>>({});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const raw = localStorage.getItem("quickola-property-draft");
    if (!raw || !ref.current) return;
    const saved = JSON.parse(raw);
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
  }, []);
  useEffect(() => {
    const warning = (e: BeforeUnloadEvent) => {
      if (step > 0 && step < 4) e.preventDefault();
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
    setSummary(out);
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
    setStep((s) => Math.min(4, s + 1));
    scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <form
      ref={ref}
      action={addProperty}
      encType="multipart/form-data"
      onSubmit={() => localStorage.removeItem("quickola-property-draft")}
      className="mx-auto max-w-4xl"
    >
      <ol
        aria-label="Property creation progress"
        className="mb-7 grid grid-cols-5 gap-2"
      >
        {labels.map((x, i) => (
          <li key={x} aria-current={i === step ? "step" : undefined}>
            <div
              className={`h-1.5 rounded-full ${i <= step ? "bg-[#2d67b2]" : "bg-[#dfe4eb]"}`}
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
      <div className="rounded-xl bg-white p-5 shadow-sm sm:p-8">
        <section data-step="0" hidden={step !== 0}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 1 OF 5</p>
          <h2 className="mt-1 text-2xl font-extrabold">Property details</h2>
          <div className="mt-6 grid gap-5">
            <AddressLookup />
            <label className="font-bold">
              Property image <small className="font-normal">(optional)</small>
              <input
                className={field}
                name="propertyImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Property name
                <input className={field} name="nickname" required />
              </label>
              <label className="font-bold">
                Property type
                <select
                  className={field}
                  name="propertyType"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="house">House</option>
                  <option value="flat">Flat or apartment</option>
                  <option value="serviced_apartment">Serviced apartment</option>
                  <option value="cottage">Cottage</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <label className="font-bold">
              Full address
              <input
                className={field}
                name="addressLine1"
                autoComplete="address-line1"
                required
              />
            </label>
            <label className="font-bold">Address line 2 <small className="font-normal">(optional)</small><input className={field} name="addressLine2" autoComplete="address-line2" /></label>
            <input type="hidden" name="county" /><input type="hidden" name="country" value="United Kingdom" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Town or city
                <input className={field} name="city" required />
              </label>
              <label className="font-bold">
                Postcode
                <input
                  className={field}
                  name="postcode"
                  autoComplete="postal-code"
                  pattern="[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}"
                  title="Enter a valid UK postcode, for example SL1 1AA"
                  required
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Bedrooms
                <input
                  className={field}
                  name="bedrooms"
                  type="number"
                  min="0"
                  required
                />
              </label>
              <label className="font-bold">
                Bathrooms
                <input
                  className={field}
                  name="bathrooms"
                  type="number"
                  min="0"
                  step=".5"
                  required
                />
              </label>
            </div>
          </div>
        </section>
        <section data-step="1" hidden={step !== 1}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 2 OF 5</p>
          <h2 className="mt-1 text-2xl font-extrabold">Turnover timings</h2>
          <div className="mt-6 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="font-bold">
                Default checkout
                <input
                  className={field}
                  name="defaultCheckoutTime"
                  type="time"
                  defaultValue={defaults?.checkout || "11:00"}
                  required
                />
              </label>
              <label className="font-bold">
                Default check-in
                <input
                  className={field}
                  name="defaultCheckinTime"
                  type="time"
                  defaultValue={defaults?.checkin || "15:00"}
                  required
                />
              </label>
              <label className="font-bold">
                Estimated minutes
                <input
                  className={field}
                  name="estimatedTurnoverMinutes"
                  type="number"
                  min="15"
                  step="15"
                  defaultValue={defaults?.duration || 180}
                  required
                />
              </label>
            </div>
            <label className="font-bold">
              Access instructions
              <textarea className={field} name="accessNotes" rows={3} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Key or lockbox instructions
                <textarea className={field} name="keyInstructions" rows={2} />
              </label>
              <label className="font-bold">
                Key-return instructions
                <textarea
                  className={field}
                  name="keyReturnInstructions"
                  rows={2}
                />
              </label>
            </div>
            <label className="font-bold">
              Parking or floor/lift information
              <textarea className={field} name="floorLiftNotes" rows={2} />
            </label>
          </div>
        </section>
        <section data-step="2" hidden={step !== 2}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 3 OF 5</p>
          <h2 className="mt-1 text-2xl font-extrabold">Guest-ready standard</h2>
          <div className="mt-6 grid gap-5">
            <label className="font-bold">
              Bed setup
              <textarea className={field} name="bedConfiguration" rows={2} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">
                Linen instructions
                <textarea className={field} name="linenRequirements" rows={2} />
              </label>
              <label className="font-bold">
                Towel requirements
                <textarea className={field} name="towelRequirements" rows={2} />
              </label>
              <label className="font-bold">
                Waste instructions
                <textarea className={field} name="wasteInstructions" rows={2} />
              </label>
              <label className="font-bold">
                Consumables instructions
                <textarea
                  className={field}
                  name="consumablesInstructions"
                  rows={2}
                />
              </label>
            </div>
            <label className="flex min-h-11 items-center gap-3 font-bold">
              <input
                name="sofaBedRequired"
                type="checkbox"
                className="h-5 w-5"
              />
              Prepare sofa bed
            </label>
            <label className="font-bold">
              Guest-ready notes
              <textarea className={field} name="cleaningNotes" rows={3} />
            </label>
            <label className="max-w-xs font-bold">
              Required completion photos
              <input
                className={field}
                name="requiredCompletionPhotos"
                type="number"
                min="0"
                max="50"
                defaultValue="4"
                required
              />
            </label>
          </div>
        </section>
        <section data-step="3" hidden={step !== 3}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 4 OF 5</p>
          <h2 className="mt-1 text-2xl font-extrabold">Checklist review</h2>
          <p className="mt-2 text-[#657089]">
            A practical STR checklist will be created. Advanced rules remain
            editable from the property page.
          </p>
          <ul className="mt-5 divide-y rounded-lg bg-[#f4f6f9] px-4">
            {checklist.map((x) => (
              <li className="py-3 font-bold" key={x}>
                {x}
              </li>
            ))}
            {custom.map((x, i) => (
              <li className="flex items-center justify-between py-3" key={i}>
                {x}
                <button
                  type="button"
                  onClick={() => setCustom((v) => v.filter((_, n) => n !== i))}
                  className="min-h-10 text-sm font-bold text-red-700"
                >
                  Remove
                </button>
                <input type="hidden" name="extraChecklistTask" value={x} />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              id="custom-task"
              className={field}
              placeholder="Add a property-specific task"
            />
            <button
              type="button"
              className="mt-1 min-h-12 shrink-0 rounded-lg border px-4 font-bold"
              onClick={() => {
                const el =
                  document.querySelector<HTMLInputElement>("#custom-task");
                if (el?.value.trim()) {
                  setCustom((v) => [...v, el.value.trim()]);
                  el.value = "";
                  el.focus();
                }
              }}
            >
              Add task
            </button>
          </div>
        </section>
        <section data-step="4" hidden={step !== 4}>
          <p className="text-sm font-extrabold text-[#2d67b2]">STEP 5 OF 5</p>
          <h2 className="mt-1 text-2xl font-extrabold">Review and create</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold text-[#657089]">Property</dt>
              <dd className="mt-1 text-lg font-extrabold">
                {summary.nickname || "—"}
              </dd>
              <dd>
                {summary.addressLine1}, {summary.city}, {summary.postcode}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-[#657089]">
                Turnover window
              </dt>
              <dd className="mt-1 font-bold">
                {summary.defaultCheckoutTime}–{summary.defaultCheckinTime}
              </dd>
              <dd>{summary.estimatedTurnoverMinutes} minutes</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-[#657089]">Evidence</dt>
              <dd>{summary.requiredCompletionPhotos} completion photos</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-[#657089]">Checklist</dt>
              <dd>Default checklist + {custom.length} custom tasks</dd>
            </div>
          </dl>
        </section>
      </div>
      <input type="hidden" name="addressLine2" />
      <input
        type="hidden"
        name="accessMethod"
        value="Key safe or owner-arranged access"
      />
      <div className="mt-5 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="min-h-12 rounded-lg border px-5 font-bold disabled:invisible"
        >
          Back
        </button>
        {step < 4 ? (
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
