

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing Methodology | How Quickola Estimates Fair Local Prices",
  description:
    "Learn how Quickola creates fair local service price guide ranges, what affects final quotes, and why Quickola prices are guidance rather than guaranteed final prices.",
  alternates: {
    canonical: "/pricing-methodology",
  },
  openGraph: {
    title: "Quickola Pricing Methodology",
    description:
      "Quickola explains how fair local guide prices are estimated for services such as cleaning, moving, trades, repairs and local home services.",
    url: "/pricing-methodology",
    siteName: "Quickola",
    type: "website",
  },
};

const coreFactors = [
  {
    title: "Service type",
    text: "A cleaner, locksmith, man and van, plumber or boiler repair can all be priced differently because the time, skill, risk and equipment involved are different.",
  },
  {
    title: "Location and travel",
    text: "Local prices can change because of travel time, parking, congestion, access, distance between jobs and how many suitable providers cover the area.",
  },
  {
    title: "Urgency",
    text: "Same-day, emergency and out-of-hours work often costs more because availability is limited and providers may need to rearrange other work.",
  },
  {
    title: "Job size and complexity",
    text: "A small repair, one-room clean or single-item move is not priced the same as a larger job with multiple rooms, heavy items, stairs or specialist requirements.",
  },
  {
    title: "Parts, materials and disposal",
    text: "Some services need replacement parts, materials, waste disposal, specialist equipment or extra labour. These can increase the final quote.",
  },
  {
    title: "Provider availability",
    text: "If only a few suitable providers are available at the requested time, the final quote may be higher than a normal guide range.",
  },
];

const serviceExamples = [
  {
    service: "Man and Van",
    factors: "Distance, loading time, stairs, parking, van size, number of helpers and urgency.",
  },
  {
    service: "Removals",
    factors: "Property size, furniture volume, packing, access, number of movers and travel distance.",
  },
  {
    service: "Cleaning",
    factors: "Service type, property size, frequency, condition, access, parking and urgency.",
  },
  {
    service: "End of Tenancy Cleaning",
    factors: "Bedrooms, bathrooms, property condition, appliances, carpets, parking and same-day timing.",
  },
  {
    service: "Plumber / Emergency Plumber",
    factors: "Call-out fee, urgency, fault type, parts, access, time of day and repair complexity.",
  },
  {
    service: "Electrician",
    factors: "Call-out fee, fault finding, parts, testing requirements, urgency and safety complexity.",
  },
  {
    service: "Locksmith",
    factors: "Lock type, call-out timing, replacement parts, emergency access and door condition.",
  },
  {
    service: "Boiler Repair",
    factors: "Fault diagnosis, parts, boiler age, engineer availability, urgency and whether a second visit is needed.",
  },
  {
    service: "Waste Removal",
    factors: "Load size, waste type, weight, disposal fees, access, labour time and same-day collection.",
  },
  {
    service: "Tyres / MOT and Car Repairs",
    factors: "Vehicle type, tyre size, parts, diagnostics, labour, fitting, disposal and garage availability.",
  },
];

const methodologySteps = [
  "Start with the service category and common price structure for that type of job.",
  "Adjust the guide range using local context such as area, access, travel time and provider availability.",
  "Consider the job details that usually change the final cost, such as size, urgency, parts, materials or extras.",
  "Show a fair guide range before the customer commits to a request or provider conversation.",
  "Remind users that final quotes must be confirmed directly before booking.",
];

const whatPricesAreNot = [
  "Quickola guide prices are not guaranteed final quotes.",
  "Quickola guide prices are not a promise that a provider will accept the job at that exact amount.",
  "Quickola guide prices do not include every possible extra, part, material, parking fee, congestion charge, disposal charge or VAT scenario.",
  "Quickola guide prices do not replace checking the provider’s final written quote before work begins.",
];

const faqs = [
  {
    question: "Are Quickola prices exact quotes?",
    answer:
      "No. Quickola prices are fair local guide ranges. They help customers understand what may be reasonable before booking, but the final quote depends on the exact job details and provider availability.",
  },
  {
    question: "Why can final provider quotes be higher or lower than the guide range?",
    answer:
      "Final quotes can change because of urgency, access, parking, parts, materials, property condition, travel time, out-of-hours work, specialist requirements or limited provider availability.",
  },
  {
    question: "Does Quickola use paid ranking to set prices?",
    answer:
      "No. Quickola is not designed around paid ranking. Price guidance is based on service type, local context and job factors, while provider visibility should be based on fit, response speed, price clarity and customer feedback.",
  },
  {
    question: "Why does Quickola show a range instead of one price?",
    answer:
      "Local service work varies too much for one fixed price to be honest. A range is more transparent because it reflects the reality that job size, timing, access and extras can change the final cost.",
  },
  {
    question: "How should customers use Quickola price ranges?",
    answer:
      "Use the guide range as a starting point. Before booking, ask the provider what is included, what could cost extra, whether VAT or call-out fees apply and when the final price will be confirmed.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Quickola Pricing Methodology",
      url: "https://quickola.co.uk/pricing-methodology",
      description:
        "How Quickola estimates fair local service guide prices and explains the factors that affect final quotes.",
      publisher: {
        "@type": "Organization",
        name: "Quickola",
        url: "https://quickola.co.uk",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08783f]">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-[#e1e8f0] bg-white p-6 shadow-[0_18px_50px_rgba(7,22,56,0.06)]">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] font-bold leading-[1.6] text-[#44506a]">
      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#08783f] text-[11px] text-white">✓</span>
      <span>{children}</span>
    </li>
  );
}

export default function PricingMethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#071638]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-[#e1e8f0] bg-[radial-gradient(circle_at_top_left,#e8f7ed_0,#f7f9fb_36%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-24">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08783f] ring-1 ring-[#d8eddd]">
              Pricing Methodology
            </div>

            <h1 className="mt-6 max-w-[820px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-[#071638] sm:text-[58px] lg:text-[72px]">
              How Quickola estimates fair local price ranges.
            </h1>

            <p className="mt-6 max-w-[730px] text-[18px] font-semibold leading-[1.65] text-[#44506a] sm:text-[21px]">
              Quickola price ranges are designed to help people understand what a local service may reasonably cost before they book. They are guide ranges, not guaranteed final quotes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/check-price"
                className="inline-flex h-[58px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[17px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5"
              >
                Check a fair price
              </Link>
              <Link
                href="/Trust%20%26%20Safety"
                className="inline-flex h-[58px] items-center justify-center rounded-[14px] border border-[#cfd8e4] bg-white px-7 text-[17px] font-extrabold text-[#071638] shadow-[0_12px_28px_rgba(7,22,56,0.06)] transition hover:-translate-y-0.5"
              >
                Trust & Safety
              </Link>
            </div>
          </div>

          <Card>
            <SectionLabel>Important</SectionLabel>
            <p className="mt-4 text-[24px] font-black leading-[1.25] tracking-[-0.03em] text-[#071638]">
              A guide range helps you avoid guessing. The final quote still needs confirmation.
            </p>
            <p className="mt-4 text-[16px] font-semibold leading-[1.65] text-[#44506a]">
              Local service work changes from job to job. Quickola shows a realistic range first, then the customer should confirm the exact price, what is included and any possible extras with the provider.
            </p>
            <div className="mt-6 rounded-[18px] bg-[#071638] p-5 text-white">
              <p className="text-[14px] font-black uppercase tracking-[0.1em] text-white/60">Core rule</p>
              <p className="mt-2 text-[20px] font-black leading-[1.35]">Use the range to judge fairness. Confirm the quote before booking.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-[820px]">
          <SectionLabel>Method</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            What goes into a Quickola guide range
          </h2>
          <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
            Quickola looks at the type of service, local context and job factors that commonly affect what customers pay. The goal is not to promise a fixed price, but to give customers a fair starting point before they move forward.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {coreFactors.map((factor) => (
            <Card key={factor.title}>
              <h3 className="text-[21px] font-black tracking-[-0.02em]">{factor.title}</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">{factor.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
          <Card>
            <SectionLabel>Step by step</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              How the range is formed
            </h2>
            <ul className="mt-6 space-y-3">
              {methodologySteps.map((step) => (
                <CheckItem key={step}>{step}</CheckItem>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionLabel>Limitations</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              What the range does not mean
            </h2>
            <ul className="mt-6 space-y-3">
              {whatPricesAreNot.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-[820px]">
          <SectionLabel>Service examples</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            Different services need different pricing logic
          </h2>
          <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
            A fair price for a local service depends on the work involved. These examples show why Quickola does not treat every category the same.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[26px] border border-[#dfe7f0] bg-white shadow-[0_18px_50px_rgba(7,22,56,0.06)]">
          <div className="grid bg-[#071638] text-[13px] font-black uppercase tracking-[0.08em] text-white sm:grid-cols-[0.35fr_0.65fr]">
            <div className="p-4">Service</div>
            <div className="p-4">Common pricing factors</div>
          </div>
          {serviceExamples.map((row) => (
            <div key={row.service} className="grid border-t border-[#e7edf4] text-[14px] font-semibold leading-[1.5] text-[#44506a] sm:grid-cols-[0.35fr_0.65fr]">
              <div className="bg-[#f7f9fb] p-4 font-black text-[#071638]">{row.service}</div>
              <div className="p-4">{row.factors}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionLabel>For customers</SectionLabel>
              <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
                How to use a Quickola guide range
              </h2>
              <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
                Treat the guide range as a fairness check. It helps you ask better questions and spot quotes that may need more explanation.
              </p>
            </div>

            <Card>
              <ul className="space-y-3">
                <CheckItem>Ask what is included in the quoted price.</CheckItem>
                <CheckItem>Ask whether call-out fees, VAT, parts, parking or disposal are extra.</CheckItem>
                <CheckItem>Share photos or clear job details where possible.</CheckItem>
                <CheckItem>Confirm the final quote before the provider starts work.</CheckItem>
                <CheckItem>Be careful with large upfront cash deposits to unknown providers.</CheckItem>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="rounded-[30px] bg-[#071638] p-6 text-white shadow-[0_24px_70px_rgba(7,22,56,0.18)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionLabel>For providers</SectionLabel>
              <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
                Clear pricing helps good providers stand out.
              </h2>
              <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-white/72">
                Quickola encourages providers to show starting prices, explain what affects the final quote and respond clearly to suitable customer requests.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-6 text-[#071638]">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#657089]">Provider applications</p>
              <p className="mt-2 text-[28px] font-black tracking-[-0.03em]">Apply to join the Quickola provider network.</p>
              <p className="mt-4 text-[15px] font-semibold leading-[1.65] text-[#44506a]">
                Providers can apply with their service category, areas covered, WhatsApp number, starting price and availability.
              </p>
              <Link href="/for-providers" className="mt-5 inline-flex h-[52px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white">
                Apply as provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e1e8f0] bg-[#071638] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Pricing methodology questions.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-[20px] border border-white/12 bg-white/[0.04] p-5 open:bg-white/[0.07]">
                <summary className="cursor-pointer text-[17px] font-black">{faq.question}</summary>
                <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-white/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638]">Check the fair price before you book.</h2>
            <p className="mt-2 max-w-[760px] text-[16px] font-semibold leading-[1.6] text-[#44506a]">
              Quickola gives guide ranges so customers can make clearer local service decisions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/check-price" className="inline-flex h-[54px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white">
              Check a price
            </Link>
            <Link href="/Trust%20%26%20Safety" className="inline-flex h-[54px] items-center justify-center rounded-[13px] border border-[#cfd8e4] px-6 text-[16px] font-extrabold text-[#071638]">
              Trust & Safety
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}