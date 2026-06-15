import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Quickola | Fair Price Discovery Before You Book",
  description:
    "Quickola is a UK fair-price discovery and local provider matching platform. Learn what Quickola does, how it helps customers, how providers are reviewed and how the service works.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Quickola",
    description:
      "Quickola helps people check fair local service prices before booking, then connects them with suitable local providers where available.",
    url: "/about",
    siteName: "Quickola",
    type: "website",
  },
};

const serviceGroups = [
  {
    title: "Moving and transport",
    items: ["Man and Van", "Removals"],
  },
  {
    title: "Cleaning",
    items: ["Cleaning", "End of Tenancy Cleaning", "Deep Cleaning", "Carpet Cleaning", "Oven Cleaning"],
  },
  {
    title: "Trades and home services",
    items: ["Handyman", "Plumber", "Emergency Plumber", "Electrician", "Locksmith", "Gardener", "Waste Removal", "Boiler Repair"],
  },
  {
    title: "Automotive",
    items: ["MOT and Car Repairs", "Tyres"],
  },
];

const customerSteps = [
  "Tell Quickola what service you need and where you need it.",
  "See a fair guide range and the main factors that can affect the price.",
  "Send a request if you want help finding a suitable local provider.",
  "Quickola reviews the request and can route it to providers who match the service and area.",
];

const providerSteps = [
  "Providers apply with their business name, main service, WhatsApp number, starting price and areas covered.",
  "Quickola reviews provider applications before adding businesses to the network.",
  "Suitable providers may receive relevant customer request alerts by WhatsApp.",
  "Visibility is based on fit, responsiveness, price clarity and customer feedback — not paid ranking.",
];

const whatQuickolaIsNot = [
  "Quickola is not a traditional directory where users are left to compare long lists alone.",
  "Quickola is not a paid-ranking marketplace where the top position is simply sold.",
  "Quickola is not a guarantee that every request will receive an instant provider match.",
  "Quickola does not replace checking provider credentials, final quotes, availability or suitability before booking.",
];

const faqs = [
  {
    question: "What is Quickola?",
    answer:
      "Quickola is a UK fair-price discovery and local provider matching platform. It helps people understand fair local price ranges before booking services, then helps connect them with suitable local providers where available.",
  },
  {
    question: "Why does Quickola show prices first?",
    answer:
      "Many customers hesitate because they do not know what a fair price looks like. Quickola starts with price clarity so users can avoid blind decisions, surprise charges and unrealistic quotes.",
  },
  {
    question: "How does Quickola choose providers?",
    answer:
      "Quickola reviews provider applications and considers service fit, postcode coverage, starting prices, responsiveness and customer feedback. Quickola does not sell paid ranking as the basis for visibility.",
  },
  {
    question: "Is every Quickola price a final quote?",
    answer:
      "No. Quickola price ranges are guide ranges. Final prices depend on job details, access, urgency, parts, materials, parking, travel, property condition and provider availability.",
  },
  {
    question: "Where is Quickola launching?",
    answer:
      "Quickola is a UK platform being built around local price discovery and matching. It is starting with selected local service areas and categories before expanding more widely.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Quickola",
      url: "https://quickola.co.uk",
      description:
        "Quickola is a UK fair-price discovery and local provider matching platform that helps people understand fair local prices before booking services.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "quickolauk@gmail.com",
      },
    },
    {
      "@type": "WebPage",
      name: "About Quickola",
      url: "https://quickola.co.uk/about",
      description:
        "About Quickola, a UK fair-price discovery and local provider matching platform.",
      mainEntity: {
        "@type": "Organization",
        name: "Quickola",
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

export default function AboutPage() {
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
              About Quickola
            </div>

            <h1 className="mt-6 max-w-[820px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-[#071638] sm:text-[58px] lg:text-[72px]">
              Quickola helps you know the fair local price before you book.
            </h1>

            <p className="mt-6 max-w-[730px] text-[18px] font-semibold leading-[1.65] text-[#44506a] sm:text-[21px]">
              Quickola is a UK fair-price discovery and local provider matching platform. We help people check what a service should reasonably cost before they book, then help connect them with suitable local providers where available.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/check-price"
                className="inline-flex h-[58px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[17px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5"
              >
                Check a fair price
              </Link>
            </div>
          </div>

          <Card>
            <SectionLabel>Quickola in one sentence</SectionLabel>
            <p className="mt-4 text-[24px] font-black leading-[1.25] tracking-[-0.03em] text-[#071638]">
              Quickola is price intelligence first, then local matching.
            </p>
            <p className="mt-4 text-[16px] font-semibold leading-[1.65] text-[#44506a]">
              Instead of starting with a long list of providers, Quickola starts with the customer’s biggest question: what is a fair price for this service in this area?
            </p>
            <div className="mt-6 grid gap-3 text-[14px] font-extrabold text-[#44506a]">
              <div className="rounded-[16px] bg-[#f1faf3] p-4 ring-1 ring-[#d8eddd]">Fair guide price before booking pressure</div>
              <div className="rounded-[16px] bg-[#f3f6ff] p-4 ring-1 ring-[#dce4ff]">Provider matching based on fit and availability</div>
              <div className="rounded-[16px] bg-[#071638] p-4 text-white">No paid ranking as the core visibility rule</div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-[800px]">
          <SectionLabel>What Quickola does</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            We make local service prices easier to understand.
          </h2>
          <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
            Local service quotes can change because of property size, job complexity, urgency, parking, parts, materials, travel time, access and availability. Quickola explains those price factors before a customer moves forward.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Card>
            <h3 className="text-[22px] font-black tracking-[-0.02em]">Price clarity</h3>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
              Quickola gives customers a fair local guide range so they have a realistic starting point before speaking to a provider.
            </p>
          </Card>
          <Card>
            <h3 className="text-[22px] font-black tracking-[-0.02em]">Local matching</h3>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
              Where available, Quickola can help connect customers with providers who match the service, area and request details.
            </p>
          </Card>
          <Card>
            <h3 className="text-[22px] font-black tracking-[-0.02em]">Provider quality signals</h3>
            <p className="mt-3 text-[15px] font-semibold leading-[1.6] text-[#44506a]">
              Providers are reviewed before being added, and visibility is designed around fit, response speed, price clarity and customer feedback.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
          <Card>
            <SectionLabel>For customers</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              How Quickola helps users
            </h2>
            <ul className="mt-6 space-y-3">
              {customerSteps.map((step) => (
                <CheckItem key={step}>{step}</CheckItem>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionLabel>For providers</SectionLabel>
            <h2 className="mt-3 text-[32px] font-black leading-[1.05] tracking-[-0.035em]">
              How Quickola helps businesses
            </h2>
            <ul className="mt-6 space-y-3">
              {providerSteps.map((step) => (
                <CheckItem key={step}>{step}</CheckItem>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-[820px]">
          <SectionLabel>Transparency</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
            What Quickola is not
          </h2>
          <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
            Clear boundaries matter. Quickola is built to make service pricing easier to understand, but customers should still check final provider details before booking.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {whatQuickolaIsNot.map((item) => (
            <div key={item} className="rounded-[22px] border border-[#e1e8f0] bg-white p-5 text-[15px] font-bold leading-[1.6] text-[#44506a] shadow-[0_14px_40px_rgba(7,22,56,0.05)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e1e8f0] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="max-w-[780px]">
            <SectionLabel>Service categories</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Built for services where price confidence matters.
            </h2>
            <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
              Quickola focuses on service categories where customers often face unclear prices, call-out costs, urgency, add-ons or local availability differences.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {serviceGroups.map((group) => (
              <Card key={group.title}>
                <h3 className="text-[20px] font-black tracking-[-0.02em]">{group.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full bg-[#f1faf3] px-3 py-2 text-[12px] font-extrabold text-[#08783f] ring-1 ring-[#d8eddd]">
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Trust and contact</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Built to be clear, local and accountable.
            </h2>
            <p className="mt-4 text-[17px] font-semibold leading-[1.65] text-[#44506a]">
              Quickola is a new UK digital service. As the platform grows, public trust signals, provider feedback and customer outcomes will be added transparently rather than invented.
            </p>
          </div>

          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#f7f9fb] p-4 ring-1 ring-[#e1e8f0]">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#657089]">Website</p>
                <p className="mt-2 text-[16px] font-black text-[#071638]">quickola.co.uk</p>
              </div>
              <div className="rounded-[18px] bg-[#f7f9fb] p-4 ring-1 ring-[#e1e8f0]">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#657089]">Contact</p>
                <p className="mt-2 text-[16px] font-black text-[#071638]">quickolauk@gmail.com</p>
              </div>
              <div className="rounded-[18px] bg-[#f7f9fb] p-4 ring-1 ring-[#e1e8f0]">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#657089]">Core promise</p>
                <p className="mt-2 text-[16px] font-black text-[#071638]">Fair price before booking</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-[#e1e8f0] bg-[#071638] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em] sm:text-[48px]">
              Common questions about Quickola.
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
            <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638]">Start with price clarity.</h2>
            <p className="mt-2 max-w-[760px] text-[16px] font-semibold leading-[1.6] text-[#44506a]">
              Check a fair local price before you book.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/check-price" className="inline-flex h-[54px] items-center justify-center rounded-[13px] bg-[#08783f] px-6 text-[16px] font-extrabold text-white">
              Check a price
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}