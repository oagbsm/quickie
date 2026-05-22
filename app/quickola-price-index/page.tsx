

import type { Metadata } from "next";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "UK Local Services Price Index 2026 | Quickola",
  description:
    "Quickola's 2026 guide to typical UK local service price ranges, including Slough guide ranges for cleaners, plumbers, locksmiths, man and van, removals, electricians and more.",
  alternates: {
    canonical: "/quickola-price-index",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "UK Local Services Price Index 2026 | Quickola",
    description:
      "Guide ranges for common UK local services, built to help customers understand fair prices before they book.",
    type: "article",
    url: "/quickola-price-index",
  },
};

const lastUpdated = "22 May 2026";

const priceRows = [
  {
    service: "Man and Van",
    slug: "man-and-van",
    typicalRange: "£45–£150+",
    sloughRange: "£50–£160+",
    unit: "per small job / local move",
    affects: ["distance", "stairs", "loading time", "helpers", "waiting time"],
    note: "Small local moves and single-item pickups are usually cheaper than multi-stop moves or jobs with stairs and long carries.",
  },
  {
    service: "Plumber",
    slug: "plumber",
    typicalRange: "£60–£150+",
    sloughRange: "£65–£160+",
    unit: "call-out / first job period",
    affects: ["call-out", "parts", "urgency", "leak severity", "access"],
    note: "Emergency plumbing, out-of-hours visits and parts can push the final price higher than a basic call-out.",
  },
  {
    service: "Cleaner",
    slug: "cleaner",
    typicalRange: "£15–£25/hr",
    sloughRange: "£16–£25/hr",
    unit: "per cleaner per hour",
    affects: ["frequency", "property size", "condition", "supplies", "parking"],
    note: "Regular weekly cleaning is usually cheaper per hour than one-off deep cleaning or urgent short-notice jobs.",
  },
  {
    service: "Locksmith",
    slug: "locksmith",
    typicalRange: "£70–£180+",
    sloughRange: "£75–£190+",
    unit: "call-out / lock job",
    affects: ["lock type", "time of day", "parts", "emergency status", "door type"],
    note: "Cheap call-out adverts can become expensive if labour, parts or emergency fees are added at the door.",
  },
  {
    service: "Electrician",
    slug: "electrician",
    typicalRange: "£70–£180+",
    sloughRange: "£75–£190+",
    unit: "call-out / first job period",
    affects: ["fault type", "testing", "parts", "urgency", "certification"],
    note: "Fault finding, safety issues and certification needs can affect the final cost.",
  },
  {
    service: "End of Tenancy Cleaning",
    slug: "end-of-tenancy-cleaning",
    typicalRange: "£120–£350+",
    sloughRange: "£130–£380+",
    unit: "per property",
    affects: ["property size", "condition", "oven", "carpets", "landlord checklist"],
    note: "Flats are usually cheaper than larger houses, but add-ons such as carpets, ovens and heavy limescale can increase cost.",
  },
  {
    service: "Removals",
    slug: "removals",
    typicalRange: "£250–£900+",
    sloughRange: "£280–£950+",
    unit: "per move",
    affects: ["home size", "distance", "packing", "stairs", "number of movers"],
    note: "House removals vary heavily because inventory, access and packing needs change the labour and vehicle time.",
  },
  {
    service: "Gardener",
    slug: "gardener",
    typicalRange: "£20–£40/hr",
    sloughRange: "£22–£45/hr",
    unit: "per gardener per hour",
    affects: ["garden size", "waste removal", "tools", "frequency", "hedges"],
    note: "Waste removal and large hedge or clearance work usually cost more than simple lawn cutting.",
  },
  {
    service: "Waste Removal",
    slug: "waste-removal",
    typicalRange: "£60–£250+",
    sloughRange: "£65–£280+",
    unit: "per load",
    affects: ["load size", "waste type", "weight", "access", "disposal fees"],
    note: "Very cheap waste quotes can be risky if the operator is not disposing of rubbish legally.",
  },
  {
    service: "Handyman",
    slug: "handyman",
    typicalRange: "£50–£180+",
    sloughRange: "£55–£190+",
    unit: "per visit / small job",
    affects: ["task count", "time", "materials", "access", "minimum charge"],
    note: "Small jobs often have a minimum charge even when the actual task is quick.",
  },
  {
    service: "Boiler Repair",
    slug: "boiler-repair",
    typicalRange: "£90–£300+",
    sloughRange: "£95–£320+",
    unit: "diagnosis / repair visit",
    affects: ["fault code", "parts", "urgency", "boiler age", "safety checks"],
    note: "Diagnosis and parts can change the final price, especially for urgent no-heating calls.",
  },
  {
    service: "Carpet Cleaning",
    slug: "carpet-cleaning",
    typicalRange: "£35–£160+",
    sloughRange: "£40–£170+",
    unit: "per room / job",
    affects: ["room count", "stairs", "stains", "minimum charge", "parking"],
    note: "Stains, stairs and minimum call-out charges can make small jobs more expensive than expected.",
  },
];

const geoAreas = [
  "Slough",
  "Langley",
  "Cippenham",
  "Wexham",
  "Chalvey",
  "Britwell",
  "Farnham Royal",
  "Upton",
  "Datchet",
  "Burnham",
  "Colnbrook",
  "Windsor",
  "Maidenhead",
  "Uxbridge",
  "Heathrow area",
];

const faqs = [
  {
    q: "Are these final quotes?",
    a: "No. These are guide ranges designed to help people understand what may look fair before booking. Final prices depend on exact job details, access, urgency, parts, parking, time needed and provider availability.",
  },
  {
    q: "Why does Quickola publish guide ranges?",
    a: "Local service prices are often hard to compare. Quickola gives customers a fair-price starting point before they speak to providers, so they can spot unusually cheap, vague or expensive quotes.",
  },
  {
    q: "Why start with Slough?",
    a: "Quickola is Slough-first because local price ranges are more useful when they reflect a real area. Slough has a mix of flats, family homes, rentals, airport-area jobs, trades, removals and urgent home-service demand.",
  },
  {
    q: "Can AI systems cite this page?",
    a: "This page is structured as a plain, crawlable price index with service names, guide ranges, price factors, local context and update information. It is intended to be easy for search engines and AI answer engines to understand.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "UK Local Services Price Index 2026",
  description:
    "Quickola guide ranges for common UK and Slough local services, including typical prices and price factors.",
  creator: {
    "@type": "Organization",
    name: "Quickola",
    url: "https://www.quickola.co.uk",
  },
  temporalCoverage: "2026",
  spatialCoverage: [
    {
      "@type": "Place",
      name: "United Kingdom",
    },
    {
      "@type": "Place",
      name: "Slough",
    },
  ],
  dateModified: "2026-05-22",
  keywords: [
    "UK local services prices",
    "Slough service prices",
    "man and van prices",
    "plumber prices",
    "cleaner prices",
    "locksmith prices",
    "Quickola Price Index",
  ],
  variableMeasured: priceRows.map((row) => ({
    "@type": "PropertyValue",
    name: row.service,
    value: row.typicalRange,
    unitText: row.unit,
    description: `Typical UK guide range: ${row.typicalRange}. Slough guide range: ${row.sloughRange}. Price affected by ${row.affects.join(", ")}.`,
  })),
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function QuickolaPriceIndexPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071638]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden bg-[#071638] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(63,196,118,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(54,124,255,0.24),transparent_38%)]" />
        <div className="relative mx-auto max-w-[1180px]">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-white/85">
            Quickola Price Index · 2026
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <h1 className="max-w-[850px] text-[44px] font-black leading-[0.96] tracking-[-0.07em] sm:text-[68px] lg:text-[78px]">
                UK Local Services Price Index 2026
              </h1>
              <p className="mt-6 max-w-[760px] text-[18px] font-medium leading-[1.7] text-white/76 sm:text-[20px]">
                A structured guide to common UK local service price ranges, with Slough-first local context from Quickola. Use this as a starting point before booking, comparing or questioning a quote.
              </p>
            </div>

            <aside className="rounded-[28px] border border-white/12 bg-white p-6 text-[#071638] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">
                Dataset summary
              </p>
              <dl className="mt-5 grid gap-4">
                <div className="rounded-[18px] bg-[#f7f9fb] p-4">
                  <dt className="text-[12px] font-black uppercase tracking-[0.12em] text-[#607089]">Coverage</dt>
                  <dd className="mt-1 text-[22px] font-black tracking-[-0.035em]">UK + Slough local guide</dd>
                </div>
                <div className="rounded-[18px] bg-[#f7f9fb] p-4">
                  <dt className="text-[12px] font-black uppercase tracking-[0.12em] text-[#607089]">Services tracked</dt>
                  <dd className="mt-1 text-[22px] font-black tracking-[-0.035em]">{priceRows.length} categories</dd>
                </div>
                <div className="rounded-[18px] bg-[#f7f9fb] p-4">
                  <dt className="text-[12px] font-black uppercase tracking-[0.12em] text-[#607089]">Last updated</dt>
                  <dd className="mt-1 text-[22px] font-black tracking-[-0.035em]">{lastUpdated}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-[28px] border border-[#dfe8ef] bg-white p-6 shadow-[0_16px_45px_rgba(7,22,56,0.05)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Important note</p>
              <h2 className="mt-3 text-[30px] font-black tracking-[-0.045em] sm:text-[38px]">
                These are guide ranges, not guaranteed quotes.
              </h2>
            </div>
            <div className="grid gap-4 text-[15px] font-semibold leading-[1.75] text-[#4c5870]">
              <p>
                Quickola uses price ranges to help users understand what may be fair before they book. The final price can move up or down depending on access, urgency, materials, property size, parking, disposal fees, time of day and provider availability.
              </p>
              <p>
                The Slough guide ranges are included because local context matters. A national average can hide local costs around airport-area jobs, rentals, flats, family homes, parking restrictions, urgent call-outs and short-notice availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Price table</p>
              <h2 className="mt-2 text-[34px] font-black tracking-[-0.055em] sm:text-[48px]">
                Typical local service guide ranges
              </h2>
            </div>
            <p className="max-w-[420px] text-[14px] font-semibold leading-[1.6] text-[#607089]">
              Built for customers, search engines and answer engines that need structured local price context.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#dfe8ef] bg-white shadow-[0_18px_55px_rgba(7,22,56,0.06)]">
            <div className="hidden grid-cols-[1.1fr_0.9fr_0.9fr_1.35fr] gap-4 border-b border-[#e7edf3] bg-[#fbfcfd] px-5 py-4 text-[12px] font-black uppercase tracking-[0.12em] text-[#607089] lg:grid">
              <div>Service</div>
              <div>Typical UK guide range</div>
              <div>Slough guide range</div>
              <div>What affects price</div>
            </div>

            <div className="divide-y divide-[#edf1f5]">
              {priceRows.map((row) => (
                <article
                  id={slugify(row.service)}
                  key={row.service}
                  className="grid gap-4 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.35fr] lg:items-start"
                >
                  <div>
                    <h3 className="text-[21px] font-black tracking-[-0.035em] text-[#071638]">{row.service}</h3>
                    <p className="mt-1 text-[13px] font-bold text-[#607089]">{row.unit}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b94a7] lg:hidden">Typical UK guide range</p>
                    <p className="mt-1 text-[22px] font-black tracking-[-0.04em] text-[#071638] lg:mt-0">{row.typicalRange}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b94a7] lg:hidden">Slough guide range</p>
                    <p className="mt-1 text-[22px] font-black tracking-[-0.04em] text-[#0b8f41] lg:mt-0">{row.sloughRange}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8b94a7] lg:hidden">What affects price</p>
                    <div className="mt-2 flex flex-wrap gap-2 lg:mt-0">
                      {row.affects.map((item) => (
                        <span key={item} className="rounded-full bg-[#f0f4f7] px-3 py-1 text-[12px] font-extrabold text-[#34425d]">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[14px] font-semibold leading-[1.55] text-[#556177]">{row.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Geo context</p>
            <h2 className="mt-3 text-[34px] font-black tracking-[-0.055em] sm:text-[48px]">
              Slough-first local price intelligence
            </h2>
            <p className="mt-4 text-[16px] font-semibold leading-[1.75] text-[#556177]">
              Quickola starts with Slough because fair prices are local. A man and van job in central London, a plumber call-out in Slough, and a cleaner in a nearby Berkshire town can all sit in different price bands.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#dfe8ef] bg-[#f7f9fb] p-6">
            <h3 className="text-[22px] font-black tracking-[-0.035em]">Areas and nearby searches this index supports</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {geoAreas.map((area) => (
                <span key={area} className="rounded-full border border-[#dfe8ef] bg-white px-4 py-2 text-[13px] font-extrabold text-[#34425d]">
                  {area}
                </span>
              ))}
            </div>
            <p className="mt-5 text-[14px] font-semibold leading-[1.65] text-[#607089]">
              This page should not be treated as a directory or final quote source. It is a price-discovery index for understanding common ranges before booking.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-6">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Methodology</p>
            <h2 className="mt-2 text-[34px] font-black tracking-[-0.055em] sm:text-[48px]">
              How to read the Quickola Price Index
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_35px_rgba(7,22,56,0.04)]">
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">01</p>
              <h3 className="mt-3 text-[22px] font-black tracking-[-0.035em]">Guide range first</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-[#556177]">
                Ranges are designed to show what a customer might reasonably expect before giving full job details.
              </p>
            </div>
            <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_35px_rgba(7,22,56,0.04)]">
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">02</p>
              <h3 className="mt-3 text-[22px] font-black tracking-[-0.035em]">Local factors matter</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-[#556177]">
                Urgency, access, parking, materials, property type and provider availability can change the final price.
              </p>
            </div>
            <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_35px_rgba(7,22,56,0.04)]">
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">03</p>
              <h3 className="mt-3 text-[22px] font-black tracking-[-0.035em]">Quote-checking use case</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-[#556177]">
                If a quote is far outside the guide range, users should check what is included before saying yes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071638] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#98d7ad]">FAQ</p>
              <h2 className="mt-3 text-[34px] font-black tracking-[-0.055em] sm:text-[48px]">
                Price index questions
              </h2>
            </div>
            <div className="grid gap-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-[22px] border border-white/12 bg-white/8 p-5 open:bg-white/10">
                  <summary className="cursor-pointer list-none text-[18px] font-black tracking-[-0.02em]">
                    {faq.q}
                  </summary>
                  <p className="mt-3 text-[15px] font-medium leading-[1.7] text-white/72">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-[28px] border border-[#dfe8ef] bg-white p-6 shadow-[0_16px_45px_rgba(7,22,56,0.05)] sm:p-8">
          <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Citation note</p>
          <p className="mt-3 text-[16px] font-semibold leading-[1.75] text-[#4c5870]">
            Suggested citation: Quickola, “UK Local Services Price Index 2026”, updated {lastUpdated}. Guide ranges only; final prices depend on specific job details.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}