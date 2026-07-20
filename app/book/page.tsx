import Link from "next/link";
import { redirect } from "next/navigation";
import { calculateCleaningQuote } from "@/lib/cleaningPricing";
import BookingDetailsForm from "./BookingDetailsForm";

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const raw = await searchParams;
  if (!/^SL[1-6][A-Z]?\s?\d[A-Z]{2}$/i.test(raw.postcode || "")) redirect("/#booking");
  const calculated = calculateCleaningQuote({
    service: raw.service || "Domestic clean", frequency: raw.frequency || "One-off",
    property: raw.property || "House", floor: raw.floor || "Ground / lift",
    bedrooms: Number(raw.bedrooms), bathrooms: Number(raw.bathrooms),
    condition: raw.condition || "Tidy — just needs a clean", lastClean: raw.lastClean || "Cleaned regularly",
    extras: (raw.extras || "").split(", ").filter((value) => value && value !== "None"),
    parking: raw.parking || "Free / driveway",
  });
  const quote: Record<string, string> = { ...raw, hours: String(calculated.hours), price: String(calculated.price) };

  return <main className="min-h-screen bg-[#f4f7f5] px-5 py-8 text-[#071638] sm:py-10">
    <div className="mx-auto max-w-[900px]">
      <Link href="/#booking" className="text-[14px] font-black">← Edit estimate</Link>
      <div className="mt-6 grid overflow-hidden rounded-[26px] bg-white shadow-[0_20px_60px_rgba(7,22,56,.1)] lg:grid-cols-[1fr_300px]">
        <section className="p-6 sm:p-9">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#079448]">Final details</p>
          <h1 className="mt-2 text-[34px] font-black tracking-[-.04em]">Complete your booking</h1>
          <p className="mt-2 text-[14px] font-semibold text-[#667188]">Choose an arrival time that fits the full clean and tell us how to prepare.</p>
          <BookingDetailsForm quote={quote} />
        </section>
        <aside className="bg-[#061a3d] p-6 text-white sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#4bd35f]">Booking summary</p>
          <dl className="mt-6 space-y-4 text-[13px] font-bold text-white/65">
            {[["Service", quote.service], ["Property", `${quote.bedrooms || "—"} bed · ${quote.bathrooms || "—"} bath`], ["Extras", quote.extras || "None"], ["Postcode", quote.postcode], ["Duration", `${quote.hours} hours`]].map(([label, value]) => <div className="flex justify-between gap-3" key={label}><dt>{label}</dt><dd className="max-w-[160px] text-right text-white">{value || "—"}</dd></div>)}
          </dl>
          <div className="my-6 border-t border-white/15" />
          <div className="flex items-end justify-between"><span className="text-[13px] font-black">Visit price</span><span className="text-[38px] font-black">£{quote.price}</span></div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-white/55">Your price is recalculated securely from the booking details.</p>
        </aside>
      </div>
    </div>
  </main>;
}
