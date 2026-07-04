"use client";

import { useState } from "react";

type SeoCleaningEnquiryFormProps = {
  canonical: string;
  area?: string;
};

function inferCleanType(canonical: string) {
  if (canonical.includes("regular-cleaner")) return "regular-clean";
  if (canonical.includes("deep-cleaning")) return "deep-clean";
  if (canonical.includes("end-of-tenancy")) return "end-of-tenancy";
  if (canonical.includes("airbnb-cleaning")) return "airbnb-short-let";
  if (canonical.includes("after-builders")) return "after-builders";
  return "regular-clean";
}

function inferPostcodePlaceholder(area?: string) {
  const areaName = (area || "").toLowerCase();

  if (areaName.includes("langley")) return "SL3 8AA";
  if (areaName.includes("wexham")) return "SL2 5RX";
  if (areaName.includes("cippenham")) return "SL1 5AA";
  if (areaName.includes("upton")) return "SL1 2AA";
  if (areaName.includes("chalvey")) return "SL1 2XX";
  if (areaName.includes("burnham")) return "SL1 7AA";
  if (areaName.includes("farnham royal")) return "SL2 3AA";

  return "SL1 1AA";
}

function normalisePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

function formatPostcode(value: string) {
  const clean = normalisePostcode(value);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
}

function isValidSlPostcode(value: string) {
  return /^SL[1-6][A-Z]?\s?\d[A-Z]{2}$/i.test(value.trim());
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

export default function SeoCleaningEnquiryForm({
  canonical,
  area,
}: SeoCleaningEnquiryFormProps) {
  const [cleanType, setCleanType] = useState(inferCleanType(canonical));
  const [bedrooms, setBedrooms] = useState("2-bed");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postcodePlaceholder = inferPostcodePlaceholder(area);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formattedPostcode = formatPostcode(postcode);
    const cleanedPhone = cleanPhone(phone);

    if (!isValidSlPostcode(formattedPostcode)) {
      setError("Enter a valid Slough SL postcode, for example SL2 5RX.");
      return;
    }

    if (cleanedPhone.length < 10) {
      setError("Enter a valid phone number so Quickola can contact you.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const serviceDetails = {
      cleanType,
      bedrooms,
      postcode: formattedPostcode,
      phone: cleanedPhone,
      notes,
      area: area || "Slough",
      sourcePage: canonical,
    };

    try {
      const response = await fetch("/api/cumar-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          service: "cleaner",
          service_label: "Cleaner",
          postcode: formattedPostcode,
          collection_postcode: formattedPostcode,
          delivery_postcode: null,
          customer_phone: cleanedPhone,
          phone: cleanedPhone,
          quote_amount: null,
          service_details: serviceDetails,
          price_inputs: {
            cleanType,
            bedrooms,
            postcode: formattedPostcode,
            phone: cleanedPhone,
          },
          price_confidence: bedrooms === "not-sure" ? "low" : "high",
          price_driver_summary: [cleanType, bedrooms, formattedPostcode]
            .filter(Boolean)
            .join(" → "),
          quote_stage: "cleaner_enquiry",
          needs_followup: true,
          source: "seo_cleaning_enquiry",
          source_page: canonical,
          cumar_mode: process.env.NEXT_PUBLIC_CUMAR_MODE || "rules",
          provider_lane: "cleaning",
          clean_type: cleanType,
          clean_frequency: null,
          job_size: bedrooms || "normal",
          job_risk: "low",
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("The enquiry route did not return JSON. Check /api/cumar-intake.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not send your cleaner request.");
      }

      setSuccessMessage("Request sent. Quickola will check cleaner availability.");
      setPostcode("");
      setPhone("");
      setNotes("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="request"
      onSubmit={handleSubmit}
      className="scroll-mt-[88px] rounded-[28px] border border-[#dfe8ef] bg-white p-5 shadow-[0_22px_60px_rgba(7,22,56,0.10)] sm:p-6"
    >
      <div className="text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#08783f]">
          Cleaner request
        </p>
        <h2 className="mt-2 text-[28px] font-black leading-[1.06] tracking-[-0.045em] text-[#071638]">
          Request a cleaner
        </h2>
        <p className="mt-2 text-[15px] font-semibold leading-[1.5] text-[#607089]">
          Send your details and Quickola will check cleaner availability in Slough.
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Clean type
          </span>
          <select
            name="cleanType"
            value={cleanType}
            onChange={(event) => setCleanType(event.target.value)}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            <option value="regular-clean">Regular clean</option>
            <option value="deep-clean">Deep clean</option>
            <option value="end-of-tenancy">End of tenancy</option>
            <option value="airbnb-short-let">Airbnb / short-let</option>
            <option value="after-builders">After builders</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Property size
          </span>
          <select
            name="bedrooms"
            value={bedrooms}
            onChange={(event) => setBedrooms(event.target.value)}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            <option value="studio">Studio</option>
            <option value="1-bed">1 bedroom</option>
            <option value="2-bed">2 bedroom</option>
            <option value="3-bed">3 bedroom</option>
            <option value="4-bed-plus">4+ bedroom</option>
            <option value="not-sure">Not sure</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Slough postcode
          </span>
          <input
            name="postcode"
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            required
            placeholder={`e.g. ${postcodePlaceholder}`}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black uppercase text-[#071638] outline-none transition placeholder:normal-case placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Phone number
          </span>
          <input
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 07347 962272"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Notes optional
          </span>
          <input
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. tomorrow morning, bring products, oven needed"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-[14px] bg-[#fff3f3] px-4 py-3 text-[13px] font-black text-[#d93025]">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-[14px] bg-[#eef9f1] px-4 py-3 text-[13px] font-black text-[#08783f]">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 flex h-[60px] w-full items-center justify-center rounded-[16px] bg-[#079940] text-[17px] font-black text-white shadow-[0_18px_34px_rgba(7,153,64,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#a8d8ba]"
      >
        {isSubmitting ? "Sending..." : "Request a cleaner →"}
      </button>

      <p className="mt-4 text-center text-[12px] font-semibold leading-[1.45] text-[#607089]">
        No payment. Quickola will use your number to follow up about this cleaning request.
      </p>
    </form>
  );
}
