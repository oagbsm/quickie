"use client";

import { useState } from "react";

const fieldClass = "h-12 w-full rounded-xl border border-[#dce4ed] px-3 outline-none focus:border-[#079448] focus:ring-3 focus:ring-[#079448]/10";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[11px] font-black uppercase tracking-[.08em] text-[#647087]">{children} *</span>;
}

export default function CommercialQuoteForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "").trim();
    const lead = {
      name: value("name"), business: value("business"), email: value("email"),
      phone: value("phone").replace(/\s/g, ""), postcode: value("postcode").toUpperCase(),
      serviceCategory: value("serviceCategory"), propertyType: value("propertyType"),
      sites: value("sites"), frequency: value("frequency"), startDate: value("startDate"),
      contactPreference: value("contactPreference"), details: value("details"),
    };

    if (lead.name.length < 2 || lead.business.length < 2) return setError("Enter your name and business name.");
    if (!/^\S+@\S+\.\S+$/.test(lead.email)) return setError("Enter a valid work email address.");
    if (!/^(?:\+44|0)(?:7\d{9}|\d{9,10})$/.test(lead.phone)) return setError("Enter a valid UK contact number.");
    if (!/^SL[1-6][A-Z]?\s?\d[A-Z]{2}$/.test(lead.postcode)) return setError("Enter a valid Slough or nearby SL postcode.");
    if (!lead.sites || Number(lead.sites) < 1) return setError("Enter the number of sites or properties.");
    if (!lead.startDate) return setError("Choose an approximate start date.");
    if (lead.details.length < 20) return setError("Tell us a little more about the properties and work required.");

    const notes = `Service: ${lead.serviceCategory}\nNumber of units/sites: ${lead.sites}\nPreferred start: ${lead.startDate}\nPreferred contact: ${lead.contactPreference}\n${lead.details}`;
    setStatus("sending");

    try {
      const response = await fetch("/api/cumar-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          service: "commercial-cleaning", service_label: `Commercial: ${lead.serviceCategory}`,
          postcode: lead.postcode, customer_phone: lead.phone, phone: lead.phone, notes,
          service_details: { ...lead, numberOfUnits: lead.sites, notes },
          price_inputs: { serviceCategory: lead.serviceCategory, propertyType: lead.propertyType, sites: lead.sites, frequency: lead.frequency },
          price_confidence: "requires_contract_quote",
          price_driver_summary: `${lead.serviceCategory} · ${lead.propertyType} · ${lead.sites} unit(s)/site(s) · ${lead.frequency}`,
          quote_stage: "commercial_contract_enquiry", needs_followup: true,
          source: "commercial_cleaning_page", source_page: "/commercial-cleaning",
          provider_lane: "cleaning", job_size: "commercial", job_risk: "low", website: value("website"),
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("The enquiry service is temporarily unavailable.");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not send your request.");
      setStatus("sent");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send your request.");
      setStatus("idle");
    }
  }

  if (status === "sent") return <div className="w-full rounded-[24px] border border-[#cce8d5] bg-[#f2fbf5] p-8 text-center text-[#071638]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#079448] text-xl text-white">✓</span><h2 className="mt-4 text-[30px] font-black tracking-[-.04em]">Thanks—we have your request.</h2><p className="mx-auto mt-3 max-w-[500px] text-[15px] font-semibold leading-7 text-[#536079]">Our contracts manager will review your requirements and be in touch shortly to discuss the right property services plan.</p></div>;

  return <form onSubmit={submit} noValidate className="w-full rounded-[24px] border border-[#e0e7ee] bg-white p-5 text-[#071638] shadow-[0_20px_60px_rgba(7,22,56,.08)] sm:p-7">
    <h2 className="text-[28px] font-black tracking-[-.04em]">Request a contract quote</h2>
    <p className="mt-2 text-[13px] font-semibold text-[#68738a]">Tell our contracts manager enough to recommend the right next step.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label><FieldLabel>Name</FieldLabel><input name="name" autoComplete="name" className={fieldClass} /></label>
      <label><FieldLabel>Business name</FieldLabel><input name="business" autoComplete="organization" className={fieldClass} /></label>
      <label><FieldLabel>Work email</FieldLabel><input name="email" type="email" autoComplete="email" className={fieldClass} /></label>
      <label><FieldLabel>Phone</FieldLabel><input name="phone" type="tel" autoComplete="tel" className={fieldClass} /></label>
      <label><FieldLabel>Main postcode</FieldLabel><input name="postcode" autoComplete="postal-code" className={`${fieldClass} uppercase`} /></label>
      <label><FieldLabel>Units / sites</FieldLabel><input name="sites" type="number" min="1" className={fieldClass} /></label>
      <label><FieldLabel>Service required</FieldLabel><select name="serviceCategory" className={fieldClass}><option>Recurring cleaning</option><option>One-off commercial cleaning</option><option>Handyman work</option><option>Gardening</option><option>Painting</option><option>Property maintenance</option><option>Multiple services</option></select></label>
      <label><FieldLabel>Property type</FieldLabel><select name="propertyType" className={fieldClass}><option>Office</option><option>Managed properties</option><option>Airbnb portfolio</option><option>Communal building</option><option>Retail premises</option><option>Other</option></select></label>
      <label><FieldLabel>Frequency</FieldLabel><select name="frequency" className={fieldClass}><option>Daily</option><option>Several times a week</option><option>Weekly</option><option>Between guest stays</option><option>One-off</option><option>Not sure yet</option></select></label>
      <label><FieldLabel>Preferred start</FieldLabel><input name="startDate" type="date" className={fieldClass} /></label>
      <label className="sm:col-span-2"><FieldLabel>Preferred contact</FieldLabel><select name="contactPreference" className={fieldClass}><option>Phone call</option><option>WhatsApp</option><option>Email</option></select></label>
    </div>
    <label className="mt-4 block"><FieldLabel>Requirements</FieldLabel><textarea name="details" minLength={20} maxLength={3000} rows={4} placeholder="Include approximate size, access, current arrangement and any important requirements." className="w-full rounded-xl border border-[#dce4ed] p-3 outline-none focus:border-[#079448]" /></label>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-[12px] font-black text-red-700">{error}</p>}
    <button disabled={status === "sending"} className="mt-5 h-13 rounded-xl bg-[#079448] px-7 text-[14px] font-black text-white disabled:opacity-50">{status === "sending" ? "Sending…" : "Request Contract Quote →"}</button>
    <p className="mt-3 text-[11px] font-semibold text-[#7a8598]">All fields are required. We use these details only to respond to this enquiry.</p>
  </form>;
}
