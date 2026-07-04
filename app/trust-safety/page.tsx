import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust & Safety | Quickola",
  description:
    "Learn how Quickola approaches trust, early provider review, fair price guidance, customer safety, request handling and no paid ranking during its Slough launch.",
  alternates: {
    canonical: "/trust-safety",
  },
  openGraph: {
    title: "Trust & Safety at Quickola",
    description:
      "Quickola helps people check fair local prices before booking and uses early provider review, clear pricing guidance and safety advice to support better decisions during its Slough launch.",
    url: "/trust-safety",
    siteName: "Quickola",
    type: "website",
  },
};

const trustPrinciples = [
  {
    title: "Fair price first",
    text: "Quickola starts with guide price ranges so customers have a realistic idea of what a local service may cost before they move forward.",
  },
  {
    title: "Providers reviewed before referral",
    text: "Quickola is in early Slough launch mode. When outside providers are used, their details are reviewed before customers are referred to them. This helps reduce random, low-quality or irrelevant referrals.",
  },
  {
    title: "No paid ranking",
    text: "Quickola is not built around selling top placement to whoever pays most. Fit, response speed, price clarity and customer feedback matter more.",
  },
  {
    title: "Clear limits",
    text: "Quickola guide prices are not guaranteed final quotes. Final prices depend on the actual job, access, urgency, parts, materials and provider availability.",
  },
];

const providerChecks = [
  "Quickola is currently in early Slough launch mode, so provider coverage may be limited.",
  "When an outside provider is used, business name and service category are reviewed for relevance.",
  "Provider area coverage is checked against the customer request area where possible.",
  "Starting prices are reviewed for clarity and obvious mismatch where available.",
  "WhatsApp/contact details may be used to confirm request handling where needed.",
  "Future provider visibility may be adjusted based on responsiveness and customer feedback.",
];

const customerSafety = [
  "Ask for the final price or estimated range before agreeing to the job.",
  "Check whether call-out fees, parts, parking, congestion, disposal or VAT are included.",
  "Avoid paying large upfront cash deposits to unknown providers.",
  "For regulated work such as gas or specialist electrical work, check the provider has the right credentials before work begins.",
  "Keep written confirmation of the agreed work, price and timing where possible.",
  "Report poor behaviour, no-shows, suspicious requests or unsafe conduct to Quickola.",
];

const priceFactors = [
  "Service type",
  "Location and travel time",
  "Urgency or out-of-hours timing",
  "Parts, materials or disposal fees",
  "Property size or job complexity",
  "Parking, access, stairs or loading time",
  "Provider availability and response speed",
];

const faqs = [
  {
    question: "Are Quickola prices final quotes?",
    answer:
      "No. Quickola prices are fair guide ranges designed to help customers understand what may be reasonable before booking. Final quotes depend on job details, provider availability, parts, access, urgency and other factors.",
  },
  {
    question: "Does Quickola verify every provider?",
    answer:
      "Quickola is in early Slough launch mode, so provider coverage may be limited. When outside providers are used, Quickola reviews available provider details before referral, but customers should still check final provider details, credentials and suitability before booking. Provider review is a safety layer, not a legal guarantee.",
  },
  {
    question: "Does Quickola sell paid ranking?",
    answer:
      "No. Quickola is built around fair price guidance and suitable matching. Visibility is designed around service fit, area coverage, clear pricing, response speed and customer feedback rather than paid top placement.",
  },
  {
    question: "What should I do before booking a provider?",
    answer:
      "Confirm the final price, what is included, arrival time, cancellation terms and whether parts, parking, disposal or VAT are extra. For specialist work, check the provider has the correct qualifications.",
  },
  {
    question: "How can I contact Quickola about a safety issue?",
    answer:
      "Email hello@quickola.co.uk with the service, date, provider name if known, customer request details and a short explanation of the issue.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Trust & Safety at Quickola",
      url: "https://quickola.co.uk/trust-safety",
      description:
        "How Quickola approaches early provider review, fair price guidance, no paid ranking, customer safety and request handling during its Slough launch.",
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08783f]">
      {children}
    </p>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[26px] border border-[#e1e8f0] bg-white p-6 shadow-[0_18px_50px_rgba(7,22,56,0.06)]">
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] font-bold leading-[1.6] text-[#44506a]">
      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#08783f] text-[11px] text-white">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function TrustSafetyPage() {
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
              Trust & Safety
            </div>

            <h1 className="mt-6 max-w-[820px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-[#071638] sm:text-[58px] lg:text-[72px]">
              Safer local service decisions start with price clarity.
            </h1>

            <p className="mt-6 max-w-[730px] text-[18px] font-semibold leading-[1.65] text-[#44506a] sm:text-[21px]">
              Quickola helps people check fair local service price ranges before booking, then helps route requests where suitable help is available. Quickola is currently in early Slough launch mode, so provider coverage may be limited. This page explains how we approach provider review, pricing guidance, customer safety and responsible matching.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/check-price"
                className="inline-flex h-[58px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[17px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5"
              >
                Check a fair price
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-[58px] items-center justify-center rounded-[14px] border border-[#cfd8e4] bg-white px-7 text-[17px] font-extrabold text-[#071638] shadow-[0_12px_28px_rgba(7,22,56,0.06)] transition hover:-translate-y-0.5"
              >
                Contact Quickola
              </Link>
            </div>
          </div>

          <Card>
            <SectionLabel>Quickola safety position</SectionLabel>
            <p className="mt-4 text-[24px] font-black leading-[1.25] tracking-[-0.03em] text-[#071638]">
              Quickola is not a guarantee. It is a clarity and matching layer.
            </p>
            <p className="mt-4 text-[16px] font-semibold leading-[1.65] text-[#44506a]">
              We help reduce uncertainty by showing fair guide ranges, reviewing available provider details where outside providers are used, and encouraging clear pricing before customers commit. Customers should still confirm final details directly before booking.
            </p>
            <div className="mt-6 rounded-[18px] bg-[#071638] p-5 text-white">
              <p className="text-[14px] font-black uppercase tracking-[0.1em] text-white/60">
                Core rule
              </p>
              <p className="mt-2 text-[20px] font-black leading-[1.35]">
                Know the fair price first. Confirm the final quote before work begins.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-[800px]">
          <SectionLabel>Trust principles</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            How Quickola builds trust
          </h2>
          <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
            Quickola is designed to reduce the biggest risks in local service booking: unclear prices, irrelevant referrals, paid ranking bias and surprise charges. During the Slough launch, availability may be limited while the provider base is built carefully.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {trustPrinciples.map((principle) => (
            <Card key={principle.title}>
              <h3 className="text-[21px] font-black tracking-[-0.02em]">
                {principle.title}
              </h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
                {principle.text}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
          <Card>
            <SectionLabel>Provider review</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              How outside providers are considered
            </h2>
            <ul className="mt-6 space-y-3">
              {providerChecks.map((check) => (
                <CheckItem key={check}>{check}</CheckItem>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionLabel>Customer checklist</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              What customers should check before booking
            </h2>
            <ul className="mt-6 space-y-3">
              {customerSafety.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Price guidance</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Why Quickola prices are guide ranges
            </h2>
            <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
              Local service prices are not fixed like supermarket prices. Quickola uses guide ranges to help customers understand what may be reasonable, but the final quote must be confirmed before booking.
            </p>
            <div className="mt-6">
              <Link
                href="/pricing-methodology"
                className="inline-flex h-[54px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white"
              >
                Read pricing methodology
              </Link>
            </div>
          </div>

          <Card>
            <h3 className="text-[24px] font-black tracking-[-0.025em]">
              Common factors that affect final price
            </h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {priceFactors.map((factor) => (
                <span
                  key={factor}
                  className="rounded-full bg-[#f1faf3] px-3 py-2 text-[12px] font-extrabold text-[#08783f] ring-1 ring-[#d8eddd]"
                >
                  {factor}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="max-w-[820px]">
            <SectionLabel>Privacy and request handling</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              How request information is handled
            </h2>
            <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
              Quickola collects only the information needed to understand a service request, estimate price context and route the request where appropriate. Customer details should not be sold as a noisy lead race.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Card>
              <h3 className="text-[21px] font-black">Useful details only</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
                Requests usually include service type, area/postcode, timing, contact details and job notes so the request can be understood properly.
              </p>
            </Card>
            <Card>
              <h3 className="text-[21px] font-black">Matching with purpose</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
                Suitable help may be contacted or suggested when service coverage, availability and request details match. In early launch, this may be limited to a small number of options.
              </p>
            </Card>
            <Card>
              <h3 className="text-[21px] font-black">Clear reporting route</h3>
              <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
                Customers and providers can report issues by emailing hello@quickola.co.uk with the relevant request details.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="rounded-[30px] bg-[#071638] p-6 text-white shadow-[0_24px_70px_rgba(7,22,56,0.18)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionLabel>Report an issue</SectionLabel>
              <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
                Tell Quickola if something feels wrong.
              </h2>
              <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-white/72">
                Report suspicious behaviour, unclear pricing, unsafe conduct, no-shows, poor provider communication or anything that affects trust in the matching process.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-6 text-[#071638]">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#657089]">
                Contact
              </p>
              <p className="mt-2 text-[28px] font-black tracking-[-0.03em]">
                hello@quickola.co.uk
              </p>
              <p className="mt-4 text-[15px] font-semibold leading-[1.65] text-[#44506a]">
                Include the service, date, area, provider name if known, customer request details and a short explanation of what happened.
              </p>
              <a
                href="mailto:hello@quickola.co.uk"
                className="mt-5 inline-flex h-[52px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white"
              >
                Email Quickola
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e1e8f0] bg-[#071638] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Common trust and safety questions.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-[20px] border border-white/12 bg-white/[0.04] p-5 open:bg-white/[0.07]"
              >
                <summary className="cursor-pointer text-[17px] font-black">
                  {faq.question}
                </summary>
                <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-white/70">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638]">
              Use Quickola with clarity.
            </h2>
            <p className="mt-2 max-w-[760px] text-[16px] font-semibold leading-[1.6] text-[#44506a]">
              Start with a fair guide price, then confirm the final details before booking any provider.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/check-price"
              className="inline-flex h-[54px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white"
            >
              Check a price
            </Link>
            <Link
              href="/about"
              className="inline-flex h-[54px] items-center justify-center rounded-[13px] border border-[#cfd8e4] px-6 text-[16px] font-extrabold text-[#071638]"
            >
              About Quickola
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export {};