import type { Metadata } from "next";
import Link from "next/link";
import Header from "./homepagecomponents/Header";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Managed business cleaning platform in Slough | Quickola",
  description: "Add properties, request one-off or recurring cleans and track every booking. Quickola manages cleaner assignment and coordination across Slough.",
  alternates: { canonical: "/" },
};

const capabilities = [
  ["Property records", "Keep addresses, access notes and cleaning instructions ready for the next request."],
  ["Flexible requests", "Request one-off or recurring cleans with the date, arrival window and requirements in one brief."],
  ["Managed assignment", "Quickola checks suitability and assigns fulfilment; customers do not browse a cleaner directory."],
  ["Booking visibility", "Follow requested, confirmed, assigned, in-progress and completed work from your account."],
  ["Operational detail", "See assignment and arrival information when available, without chasing separate message threads."],
  ["Central history", "Review past and upcoming cleans against the property they belong to."],
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#071638]">
      <Header />
      <main id="main-content">
        <section className="overflow-hidden bg-[#071a3b] px-5 py-16 text-white sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#66dd78]">Managed business cleaning</p>
              <h1 className="mt-5 max-w-3xl text-[clamp(2.8rem,7vw,4.75rem)] font-black leading-[.98] tracking-[-.055em]">Manage every property clean in one place.</h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/78">Add your properties, request one-off or recurring cleans and follow every booking from request to completion. Quickola handles cleaner assignment and operational coordination.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/business/enquire" className="inline-flex min-h-12 items-center justify-center rounded-[.65rem] bg-[#66dd78] px-6 font-black text-[#071a3b]">Request business access</Link>
                <Link href="/how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-[.65rem] border border-white/35 px-6 font-black">See how it works</Link>
              </div>
              <p className="mt-5 text-sm font-bold text-white/66">Controlled service currently available in Slough. Every enquiry is reviewed for operational fit.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section aria-label="Service principles" className="border-b border-[#dfe6eb] px-5 py-6 sm:px-8">
          <div className="mx-auto grid max-w-[1200px] gap-3 text-sm font-extrabold sm:grid-cols-3">
            <p>Managed assignment by Quickola</p><p>Secure business accounts</p><p>Focused Slough service area</p>
          </div>
        </section>

        <section className="px-5 py-18 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="eyebrow">The operational problem</p>
            <div className="mt-4 grid gap-7 lg:grid-cols-2">
              <h2 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">Cleaning coordination gets harder with every address.</h2>
              <div className="grid gap-4 text-base leading-7 text-[#526078]">
                <p>Bookings spread across messages and spreadsheets. Property details have to be explained again. Teams chase assignment, arrival and completion updates.</p>
                <p>Quickola keeps the operational record together and manages fulfilment around it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f2f5f3] px-5 py-18 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">One clear route from property details to completion.</h2>
            <ol className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
              {[["01","Add properties","Save each address, access notes and cleaning instructions."],["02","Request cleans","Choose a one-off or recurring requirement and send the operational brief."],["03","Quickola assigns","We review the request and assign a suitable cleaner when confirmed."],["04","Track completion","Follow the booking status and retain a central service history."]].map(([n,h,p]) => <li key={n} className="border-t-2 border-[#071638] pt-5"><p className="text-xs font-black text-[#08783f]">{n}</p><h3 className="mt-4 text-xl font-black">{h}</h3><p className="mt-2 text-sm leading-6 text-[#526078]">{p}</p></li>)}
            </ol>
            <Link href="/how-it-works" className="mt-9 inline-flex font-black text-[#08783f] underline decoration-2 underline-offset-4">Understand the full process</Link>
          </div>
        </section>

        <section className="px-5 py-18 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="eyebrow">The platform</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">The working detail stays with the booking.</h2>
            <div className="mt-10 grid border-y border-[#d8e0e5] md:grid-cols-2">
              {capabilities.map(([h,p],i) => <article key={h} className={`py-6 md:px-7 ${i%2===0?"md:border-r":""} ${i<4?"border-b border-[#d8e0e5]":""}`}><h3 className="text-xl font-black">{h}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#526078]">{p}</p></article>)}
            </div>
            <Link href="/product" className="mt-9 inline-flex font-black text-[#08783f] underline decoration-2 underline-offset-4">Explore the managed cleaning platform</Link>
          </div>
        </section>

        <section className="bg-[#071a3b] px-5 py-18 text-white sm:px-8 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="eyebrow !text-[#66dd78]">Solutions</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Built for teams responsible for places, not household browsing.</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-white/15 lg:grid-cols-3">
              {[["Letting agents & property managers","Coordinate move-in, move-out and repeat cleaning across multiple addresses.","/solutions/letting-agents"],["Airbnb & serviced accommodation","Keep turnaround requirements and timing visible for repeat properties.","/solutions/airbnb"],["Offices & commercial properties","Set regular schedules, site instructions and access notes in one operational record.","/solutions/offices"]].map(([h,p,href]) => <article key={h} className="bg-[#0b244c] p-7"><h3 className="text-2xl font-black">{h}</h3><p className="mt-3 leading-7 text-white/72">{p}</p><Link href={href} className="mt-6 inline-flex font-black text-[#66dd78]">View solution <span aria-hidden="true">&nbsp;→</span></Link></article>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-18 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div><p className="eyebrow">Operational trust</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em]">Clear controls, not invented promises.</h2></div>
            <dl className="grid gap-6 sm:grid-cols-2">{[["Managed assignment","Quickola checks service area and suitability before assignment."],["Controlled availability","A request is not described as confirmed until it has been reviewed."],["Central instructions","Property and access information stays in the protected customer account."],["Human oversight","Quickola remains responsible for operational coordination through the booking lifecycle."]].map(([t,d])=><div key={t} className="border-t border-[#bfcbd2] pt-4"><dt className="font-black">{t}</dt><dd className="mt-2 text-sm leading-6 text-[#526078]">{d}</dd></div>)}</dl>
          </div>
        </section>

        <section className="bg-[#eaf4ed] px-5 py-16 sm:px-8">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-4xl font-black tracking-[-.04em]">Request business access.</h2><p className="mt-3 max-w-2xl leading-7 text-[#526078]">Tell us about your properties and cleaning requirements. We will review whether the controlled Slough service is suitable.</p></div>
            <Link href="/business/enquire" className="button-primary shrink-0 px-6">Request business access</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProductPreview() {
  return <figure className="rounded-[1.5rem] bg-white p-3 text-[#071638] shadow-[0_28px_70px_rgba(0,0,0,.3)]" aria-label="Illustration of the Quickola customer platform">
    <div className="rounded-xl border border-[#dbe3e8]">
      <div className="flex items-center justify-between border-b border-[#dbe3e8] p-4"><div><p className="text-[.68rem] font-black tracking-[.14em] text-[#08783f]">PRODUCT PREVIEW</p><p className="mt-1 font-black">Cleaning overview</p></div><span className="rounded-md bg-[#eaf4ed] px-2.5 py-2 text-xs font-black text-[#08783f]">Demo</span></div>
      <div className="grid gap-3 p-4 sm:grid-cols-3"><Preview label="Properties" value="Saved records"/><Preview label="Upcoming" value="Requested cleans"/><Preview label="Attention" value="Clear next steps"/></div>
      <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-[#dbe3e8]"><div className="grid grid-cols-[1fr_auto] gap-4 bg-[#f5f7f6] px-4 py-3 text-xs font-black text-[#526078]"><span>Booking</span><span>Status</span></div>{[["Property turnaround","Assignment managed"],["Recurring site clean","Request received"],["Completed clean","History retained"]].map(([a,b])=><div key={a} className="grid grid-cols-[1fr_auto] gap-4 border-t border-[#e5eaed] px-4 py-3 text-sm"><span className="font-bold">{a}</span><span className="text-right text-xs font-black text-[#08783f]">{b}</span></div>)}</div>
    </div><figcaption className="px-2 pt-2 text-xs text-[#6b7588]">Illustrative interface using neutral demonstration content.</figcaption>
  </figure>;
}
function Preview({label,value}:{label:string;value:string}) { return <div className="rounded-lg bg-[#f2f5f3] p-3"><p className="text-xs font-bold text-[#657089]">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
