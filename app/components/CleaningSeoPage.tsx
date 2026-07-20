import Link from "next/link";
import Image from "next/image";
import CleaningBookingForm from "../homepagecomponents/CleaningBookingForm";

export type CleaningSeoPageProps = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  localNote: string;
  priceTitle: string;
  priceRange: string;
  priceNotes: readonly string[];
  cleaningTypes: readonly string[];
  faqs: readonly { readonly question: string; readonly answer: string }[];
  canonical: string;
  area?: string;
};

const relatedPages = [
  { href: "/cleaners-slough", label: "Cleaners in Slough" },
  { href: "/regular-cleaner-slough", label: "Regular cleaner in Slough" },
  { href: "/deep-cleaning-slough", label: "Deep cleaning in Slough" },
  { href: "/end-of-tenancy-cleaning-slough", label: "End-of-tenancy cleaning in Slough" },
  { href: "/airbnb-cleaning-slough", label: "Airbnb cleaning in Slough" },
  { href: "/after-builders-cleaning-slough", label: "After builders cleaning in Slough" },
];

const areaPages = [
  { href: "/slough/wexham/cleaner", label: "Cleaner in Wexham" },
  { href: "/slough/langley/cleaner", label: "Cleaner in Langley" },
  { href: "/slough/cippenham/cleaner", label: "Cleaner in Cippenham" },
  { href: "/slough/upton/cleaner", label: "Cleaner in Upton" },
  { href: "/slough/chalvey/cleaner", label: "Cleaner in Chalvey" },
  { href: "/slough/burnham/cleaner", label: "Cleaner in Burnham" },
  { href: "/slough/farnham-royal/cleaner", label: "Cleaner in Farnham Royal" },
];

function inferCleanType(canonical: string) {
  if (canonical.includes("regular-cleaner")) return "regular-clean";
  if (canonical.includes("deep-cleaning")) return "deep-clean";
  if (canonical.includes("end-of-tenancy")) return "end-of-tenancy";
  if (canonical.includes("airbnb-cleaning")) return "airbnb-short-let";
  if (canonical.includes("after-builders")) return "after-builders";
  return "regular-clean";
}

function Tick() {
  return (
    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#08783f] text-[11px] font-black text-white">
      ✓
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#08783f]">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[#e1e8f0] bg-white p-5 shadow-[0_16px_42px_rgba(7,22,56,0.055)] sm:p-6">
      {children}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8edf3] bg-white/96 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Quickola home">
          <Image
            src="/quickola/logo-mark.png"
            alt="Quickola"
            width={44}
            height={44}
            className="h-11 w-11 rounded-2xl object-contain"
          />
          <span className="text-[25px] font-black tracking-[-0.045em] text-[#071638]">
            Quickola
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-bold text-[#293852] md:flex">
          <a className="hover:text-[#0b8f41]" href="#request">Book cleaning</a>
          <a className="hover:text-[#0b8f41]" href="#prices">Prices</a>
          <a className="hover:text-[#0b8f41]" href="#faq">FAQ</a>
        </nav>

        <a
          href="#request"
          className="hidden h-11 items-center justify-center rounded-[13px] bg-[#0b8f41] px-5 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(11,143,65,0.22)] sm:inline-flex"
        >
          Check price
        </a>

        <a
          href="#request"
          className="grid h-11 w-11 place-items-center rounded-[13px] border border-[#dfe8ef] bg-white text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.06)] sm:hidden"
          aria-label="Jump to booking"
        >
          <span className="text-[20px] font-black">£</span>
        </a>
      </div>
    </header>
  );
}

function Hero({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section className="relative overflow-hidden border-b border-[#edf1f5] bg-[#fbfcfd]">
      <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[#e6f7ec] blur-3xl" />
      <div className="absolute right-[-220px] top-[80px] h-[460px] w-[460px] rounded-full bg-[#edf4f8] blur-3xl" />

      <div className="relative mx-auto grid max-w-[1180px] gap-8 px-5 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0b8f41] sm:text-[12px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b8f41] text-[11px] text-white">
              ✓
            </span>
            Professional cleaning, priced by time
          </p>

          <h1 className="mt-5 max-w-[720px] text-[40px] font-black leading-[1.03] tracking-[-0.06em] text-[#071638] sm:text-[62px] lg:text-[70px]">
            {page.h1}
          </h1>

          <p className="mt-5 max-w-[650px] text-[17px] font-semibold leading-[1.58] text-[#4b5b78] sm:text-[18px] lg:max-w-[600px]">
            {page.intro}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Regular", "Deep clean", "End of tenancy", "Airbnb", "After builders"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#dfe8ef] bg-white px-4 py-2 text-[12px] font-black text-[#34425d]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div id="request" className="scroll-mt-[88px] lg:sticky lg:top-[92px]">
          <CleaningBookingForm initialType={inferCleanType(page.canonical) === "end-of-tenancy" ? "End of tenancy" : inferCleanType(page.canonical) === "airbnb-short-let" ? "Airbnb turnover" : inferCleanType(page.canonical) === "deep-clean" ? "Deep clean" : inferCleanType(page.canonical) === "after-builders" ? "After builders" : "Domestic clean"} />
        </div>
      </div>
    </section>
  );
}

function PriceGuide({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section id="prices" className="bg-white px-5 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[720px]">
          <SectionLabel>Time-based pricing</SectionLabel>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.045em] text-[#071638] sm:text-[46px]">
            {page.priceTitle}
          </h2>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <p className="text-[12px] font-bold text-[#748097]">Quickola cleaning rate</p>
            <p className="mt-1 text-[52px] font-black tracking-[-0.06em] text-[#0b8f41]">
              £22/hr
            </p>
            <p className="mt-3 text-[13px] font-semibold leading-[1.55] text-[#607089]">
              Your exact visit price is calculated from recommended time and selected extras.
            </p>
          </Card>

          <Card>
            <h3 className="text-[22px] font-black tracking-[-0.02em]">
              What affects the price?
            </h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {page.priceNotes.map((note) => (
                <li key={note} className="flex gap-3 text-[14px] font-bold leading-[1.55] text-[#44506a]">
                  <Tick />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="mt-5 rounded-[18px] border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-4 text-[13px] font-semibold leading-[1.55] text-[#607089] sm:px-5">
          <p className="font-black text-[#071638]">Early Slough launch</p>
          <p className="mt-1">
            Quickola delivers the cleaning service you book. Property condition, access and extra tasks are collected upfront so we can recommend enough time and show a transparent price.
          </p>
        </div>
      </div>
    </section>
  );
}

function LocalNote({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section className="bg-[#f7f9fb] px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <Card>
          <SectionLabel>Local cleaning note</SectionLabel>
          <h2 className="mt-3 text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[42px]">
            Cleaning in {page.area || "Slough"}.
          </h2>
          <p className="mt-4 text-[16px] font-semibold leading-[1.7] text-[#44506a]">
            {page.localNote}
          </p>
        </Card>
      </div>
    </section>
  );
}

function CleaningTypes({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section className="bg-white px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[760px]">
          <SectionLabel>Cleaning covered now</SectionLabel>
          <h2 className="mt-3 text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[42px]">
            Slough cleaning services Quickola is focusing on.
          </h2>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {page.cleaningTypes.map((type) => (
            <div
              key={type}
              className="rounded-[18px] border border-[#dfe8ef] bg-[#fbfcfd] p-4 text-[14px] font-black leading-[1.3] text-[#071638]"
            >
              {type}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPages({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section className="bg-[#f7f9fb] px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <SectionLabel>Other Slough cleaning guides</SectionLabel>
        <h2 className="mt-3 text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[42px]">
          Explore related cleaning services.
        </h2>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...relatedPages, ...areaPages]
            .filter((item) => item.href !== page.canonical)
            .slice(0, 9)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[18px] border border-[#e1e8f0] bg-white p-5 text-[15px] font-black text-[#071638] shadow-[0_12px_32px_rgba(7,22,56,0.045)] transition hover:-translate-y-0.5 hover:border-[#08783f]"
              >
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ page }: { page: CleaningSeoPageProps }) {
  return (
    <section id="faq" className="bg-[#071638] px-5 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-3 text-[34px] font-black leading-[1.05] tracking-[-0.035em]">
            Common questions.
          </h2>
        </div>

        <div className="space-y-4">
          {page.faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-[20px] border border-white/12 bg-white/[0.04] p-5 open:bg-white/[0.07]"
            >
              <summary className="cursor-pointer text-[17px] font-black">
                {faq.question}
              </summary>
              <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-white/72">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 rounded-[28px] bg-[#071638] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <h2 className="text-[30px] font-black tracking-[-0.04em] sm:text-[40px]">
            Book a cleaner in Slough.
          </h2>
          <p className="mt-2 text-[15px] font-medium text-white/75">
            Price your clean and book directly with Quickola
          </p>
        </div>
        <a
          href="#request"
          className="inline-flex h-[56px] items-center justify-center rounded-[14px] bg-[#0b8f41] px-8 text-[16px] font-black text-white"
        >
          Book cleaning →
        </a>
      </div>
    </section>
  );
}

export default function CleaningSeoPage(page: CleaningSeoPageProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: page.h1,
        areaServed: page.area || "Slough",
        provider: {
          "@type": "Organization",
          name: "Quickola",
          url: "https://quickola.co.uk",
        },
        description: page.description,
        serviceType: "Cleaning",
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
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

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Inter','Nunito_Sans',system-ui,sans-serif]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Hero page={page} />
      <PriceGuide page={page} />
      <LocalNote page={page} />
      <CleaningTypes page={page} />
      <RelatedPages page={page} />
      <FaqSection page={page} />
      <FinalCta />

      <div className="fixed bottom-3 left-3 right-3 z-[60] rounded-[18px] border border-[#dcebe1] bg-white p-2 shadow-[0_18px_42px_rgba(7,22,56,0.24)] lg:hidden">
        <a
          href="#request"
          className="flex h-[54px] items-center justify-center rounded-[15px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-4 text-[15px] font-black text-white"
        >
          Book cleaning →
        </a>
      </div>
    </main>
  );
}
