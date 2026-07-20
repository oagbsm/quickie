import type { Metadata } from "next";
import Link from "next/link";
import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = { title: "Trust & Safety | Quickola Property Services", description: "How Quickola protects customers and delivers safe, dependable cleaning services in Slough." };
const cards = [
  ["Clear pricing", "Your visit price is calculated from the recommended cleaning time, selected extras and disclosed fees before you continue."],
  ["Prepared for your property", "Access, parking, pets, condition and priorities are collected in advance so the cleaning team arrives informed."],
  ["Respectful service", "We expect professional conduct, care around belongings and clear communication throughout every Quickola clean."],
  ["Secure booking", "Booking details are used to arrange and deliver your clean. Payment and personal information are handled securely."],
  ["Issue support", "If something is not right, contact Quickola directly. We review service concerns and work with you toward a fair resolution."],
  ["No surprise changes", "Any material change to time or cost must be explained and agreed before additional work proceeds."],
];
export default function TrustSafetyPage() { return <main className="min-h-screen bg-white text-[#071638]"><Header /><section className="bg-[#061a3d] px-5 pb-20 pt-28 text-white sm:px-8 lg:pt-40"><div className="mx-auto max-w-[1080px]"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#4bd35f]">Trust & safety</p><h1 className="mt-4 max-w-[760px] text-[44px] font-black leading-[.98] tracking-[-.05em] sm:text-[66px]">Your property deserves care you can count on.</h1><p className="mt-5 max-w-[650px] text-[17px] font-semibold leading-7 text-white/72">Quickola is responsible for the cleaning service you book with us—from clear pricing and arrival details to support after the visit.</p></div></section><section className="px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-[1080px] gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map(([title,text]) => <article key={title} className="rounded-[22px] border border-[#e1e8ef] p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eff9f2] font-black text-[#079448]">✓</span><h2 className="mt-5 text-[21px] font-black tracking-[-.03em]">{title}</h2><p className="mt-2 text-[14px] font-semibold leading-6 text-[#667188]">{text}</p></article>)}</div><div className="mx-auto mt-12 flex max-w-[1080px] flex-col items-start justify-between gap-5 rounded-[22px] bg-[#f4f8f5] p-7 sm:flex-row sm:items-center"><div><h2 className="text-[24px] font-black">Need help with a booking?</h2><p className="mt-1 text-[14px] font-semibold text-[#667188]">Tell us what happened and include your booking details.</p></div><Link href="/contact" className="rounded-xl bg-[#079448] px-6 py-4 text-[14px] font-black text-white">Contact Quickola →</Link></div></section><Footer /></main>; }
