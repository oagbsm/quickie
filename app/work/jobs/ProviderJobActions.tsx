"use client";

import { useState } from "react";
import { sendProviderJobMessage, submitWorkOffer } from "@/app/work/actions";

type Offer = { id: string; status: string; amount_pence: number | null } | null;

export default function ProviderJobActions({ jobId, offer, error, canOperate = true }: { jobId: string; offer: Offer; error?: string; canOperate?: boolean }) {
  const [panel, setPanel] = useState<"question" | "quote" | null>(null);
  const [amount, setAmount] = useState("");
  const [availability, setAvailability] = useState("flexible");
  const isAccepted = !!offer && ["selected", "accepted"].includes(offer.status);
  const canQuote = !offer || ["withdrawn", "declined", "expired"].includes(offer.status);
  const formattedAmount = amount ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(Number(amount)) : "";

  return <div className="mt-7 border-t border-[#e9edf1] pt-6">
    {offer ? <div className="rounded-2xl bg-[#f5fbf6] p-5">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">Your quote</p>
      <p className="mt-2 text-2xl font-black">{offer.amount_pence == null ? "Quote submitted" : `£${(offer.amount_pence / 100).toFixed(2).replace(/\.00$/, "")}`}</p>
      <p className="mt-1 font-bold capitalize text-[#526078]">{offer.status.replaceAll("_", " ")}</p>
      {!isAccepted && offer.status !== "withdrawn" && <p className="mt-3 text-sm leading-6 text-[#526078]">The customer can review your quote and message you here.</p>}
    </div> : <div>
      <h2 className="text-xl font-black">Ready to help?</h2>
      <p className="mt-2 text-sm leading-6 text-[#657089]">Ask a question first, or send a clear price and availability.</p>
    </div>}

    {!canOperate && <div className="mt-5 rounded-2xl bg-[#fff8e8] p-5 text-sm leading-6 text-[#6c5530]"><p className="font-black text-[#8a5a00]">Finish your provider setup to send quotes.</p><p className="mt-1">Complete your profile photo, provider terms, Quickola review and payout setup.</p></div>}
    {canOperate && <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={() => setPanel(panel === "question" ? null : "question")} aria-expanded={panel === "question"} className="min-h-12 rounded-xl border-2 border-[#167d3c] px-5 font-black text-[#167d3c]">{offer ? "Message customer" : "Ask a question"}</button>
      {canQuote && <button type="button" onClick={() => setPanel(panel === "quote" ? null : "quote")} aria-expanded={panel === "quote"} className="min-h-12 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Send a quote</button>}
    </div>}

    {panel === "question" && <form action={sendProviderJobMessage} className="mt-5 grid gap-3 rounded-2xl border border-[#dbe1ea] bg-[#fbfcfd] p-4 sm:p-5">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="text-sm font-black text-[#061b3f]">Your question or message<textarea name="body" required maxLength={4000} placeholder="Ask anything useful about the job…" className="mt-2 min-h-28 w-full rounded-xl border border-[#dbe1ea] bg-white p-3 font-normal" /></label>
      <button className="min-h-11 rounded-xl bg-[#061b3f] px-4 font-black text-white">Send message</button>
    </form>}

    {panel === "quote" && <form action={submitWorkOffer} className="mt-5 grid gap-4 rounded-2xl border border-[#dbe1ea] bg-[#fbfcfd] p-4 sm:p-5">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="text-sm font-black">Your price (£)<input name="amount" type="number" min="1" max="100000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] bg-white px-4 font-normal" /></label>
      <fieldset><legend className="text-sm font-black">When are you available?</legend><div className="mt-2 grid grid-cols-2 gap-2"><label className="rounded-xl border border-[#dbe1ea] bg-white p-3 text-sm font-bold"><input className="mr-2" type="radio" name="availabilityMode" value="today" checked={availability === "today"} onChange={() => setAvailability("today")} />Today</label><label className="rounded-xl border border-[#dbe1ea] bg-white p-3 text-sm font-bold"><input className="mr-2" type="radio" name="availabilityMode" value="tomorrow" checked={availability === "tomorrow"} onChange={() => setAvailability("tomorrow")} />Tomorrow</label><label className="rounded-xl border border-[#dbe1ea] bg-white p-3 text-sm font-bold"><input className="mr-2" type="radio" name="availabilityMode" value="choose_date" checked={availability === "choose_date"} onChange={() => setAvailability("choose_date")} />Choose date</label><label className="rounded-xl border border-[#dbe1ea] bg-white p-3 text-sm font-bold"><input className="mr-2" type="radio" name="availabilityMode" value="flexible" checked={availability === "flexible"} onChange={() => setAvailability("flexible")} />Flexible</label></div></fieldset>
      {availability === "choose_date" && <label className="text-sm font-black">Preferred date<input name="scheduledDate" type="date" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] bg-white px-4" /></label>}
      <label className="text-sm font-black">Note for the customer <span className="font-normal text-[#657089]">(optional)</span><textarea name="message" maxLength={4000} placeholder="Add anything they should know about your quote…" className="mt-2 min-h-24 w-full rounded-xl border border-[#dbe1ea] bg-white p-3 font-normal" /></label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error === "locked" ? "This job is no longer accepting quotes." : "We couldn’t send your quote. Please try again."}</p>}
      <button className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">{formattedAmount ? `Send ${formattedAmount} quote` : "Send quote"}</button>
    </form>}
  </div>;
}
