import { notFound } from "next/navigation";
import Footer from "../components/Footer";
import {
  getAllSeoSlugs,
  getSeoPageBySlug,
  type SeoPage,
} from "@/lib/seoPages";

type SeoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);

  if (!page) {
    return {
      title: "Quickola",
    };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCheckPriceHref(page: SeoPage) {
  return `/check-price?service=cleaning&area=${slugify(page.location)}`;
}
function getCleaningPageHref(area: string) {
  const areaSlug = slugify(area);

  if (areaSlug === "london") {
    return "/cleaning-london";
  }

  return `/cleaning-${areaSlug}`;
}

function TopTrustBar() {
  return (
    <div className="hidden bg-[#071638] text-white md:block">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-2 text-[12px] font-extrabold">
        <span>Fair local price guide</span>
        <span>No paid ranking</span>
        <span>Verified local providers</span>
        <span>Built for London cleaning searches</span>
      </div>
    </div>
  );
}

function Header({ page }: { page: SeoPage }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#edf0f5] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[78px] max-w-[1180px] items-center justify-between px-4 lg:min-h-[86px]">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-12 w-12 shrink-0 rounded-2xl object-contain"
          />
          <span className="text-[18px] font-black leading-[0.95] tracking-[-0.04em] text-[#071638] sm:text-[22px]">
            Quickola
            <br />
            Cleaning
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-[13px] font-extrabold text-[#071638] lg:flex">
          <a href="/">Home</a>
          <a href="#services">Services</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#price-guide">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={getCheckPriceHref(page)}
            className="inline-flex h-[52px] items-center justify-center rounded-[11px] bg-[#0faa4b] px-6 text-[14px] font-black text-white shadow-[0_12px_26px_rgba(15,170,75,0.25)] transition hover:-translate-y-0.5"
          >
            Check fair price
          </a>
        </div>

        <a
          href={getCheckPriceHref(page)}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0faa4b] px-4 text-[13px] font-black text-white lg:hidden"
        >
          Check
        </a>
      </div>
    </header>
  );
}

function QuoteCard({ page }: { page: SeoPage }) {
  return (
    <div className="relative z-10 w-full rounded-[22px] bg-white p-5 shadow-[0_28px_80px_rgba(7,22,56,0.16)] sm:p-7 lg:max-w-[360px]">
      <h2 className="text-center text-[22px] font-black tracking-[-0.03em] text-[#071638]">
        Check cleaning prices
      </h2>
      <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#0faa4b]" />

      <div className="mt-6 space-y-3">
        {["Cleaning type", "Property size", "Area or postcode", "Email address"].map((field) => (
          <div
            key={field}
            className="flex h-[48px] items-center justify-between rounded-[9px] border border-[#dfe5ee] bg-white px-4 text-[13px] font-bold text-[#728096]"
          >
            <span>{field}</span>
            {field.includes("type") || field.includes("size") ? <span>⌄</span> : null}
          </div>
        ))}
      </div>

      <a
        href={getCheckPriceHref(page)}
        className="mt-5 flex h-[54px] items-center justify-center rounded-[10px] bg-[#0faa4b] text-[15px] font-black text-white shadow-[0_14px_28px_rgba(15,170,75,0.22)]"
      >
        Check fair price →
      </a>

      <div className="mt-4 flex justify-center gap-5 text-[12px] font-bold text-[#0faa4b]">
        <span>✓ Price first</span>
        <span>✓ No paid ranking</span>
      </div>
    </div>
  );
}

function Hero({ page }: { page: SeoPage }) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_52%,#f3f7f9_52%,#f3f7f9_100%)]">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_560px] lg:py-16">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.06em] text-[#0faa4b]">
            Know the fair price before you book
          </p>

          <h1 className="mt-5 max-w-[620px] text-[44px] font-black leading-[0.98] tracking-[-0.055em] text-[#071638] sm:text-[58px] lg:text-[66px]">
            {page.h1}
          </h1>

          <p className="mt-6 max-w-[520px] text-[17px] font-semibold leading-[1.65] text-[#31405b]">
            {page.intro}
          </p>
{page.localNeighbourhoods && page.localNeighbourhoods.length > 0 ? (
  <div className="mt-5 flex max-w-[560px] flex-wrap gap-2">
    {page.localNeighbourhoods.slice(0, 6).map((neighbourhood) => (
      <span
        key={neighbourhood}
        className="rounded-full border border-[#dfe8ef] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#44506a] shadow-[0_6px_16px_rgba(7,22,56,0.04)]"
      >
        {neighbourhood}
      </span>
    ))}
  </div>
) : null}
          <div className="mt-6 space-y-3">
            {[
              "Check fair local price ranges",
              "Avoid guessing what you should pay",
              "No paid ranking or fake top spots",
              "Request a trusted local match",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[15px] font-bold text-[#071638]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0faa4b] text-[11px] text-white">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={getCheckPriceHref(page)}
              className="inline-flex h-[58px] items-center justify-center rounded-[12px] bg-[#0faa4b] px-7 text-[16px] font-black text-white shadow-[0_14px_30px_rgba(15,170,75,0.25)] transition hover:-translate-y-0.5"
            >
              Check fair price →
            </a>

            <a
              href="#price-guide"
              className="inline-flex h-[58px] items-center justify-center rounded-[12px] border border-[#071638] bg-white px-7 text-[16px] font-black text-[#071638] transition hover:-translate-y-0.5"
            >
              View guide
            </a>
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-l-[36px] bg-[#eef3f6] p-6 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.2),transparent_38%),linear-gradient(135deg,#f8fafc,#e9eef2)]" />
          <div className="absolute bottom-0 right-0 top-0 w-[72%] rounded-l-[40px] bg-[linear-gradient(135deg,#ffffff,#dfe8ef)] opacity-90" />

          <div className="absolute bottom-0 right-0 h-[82%] w-[82%] rounded-tl-[40px] bg-[#e9ded2]">
            <div className="absolute left-[12%] top-[18%] h-[38%] w-[62%] rounded-[18px] bg-white shadow-[0_12px_30px_rgba(7,22,56,0.08)]">
              <div className="absolute inset-x-5 top-5 h-[70%] rounded-[12px] bg-[linear-gradient(180deg,#dff2ff,#ffffff)]">
                <div className="absolute bottom-4 left-8 h-28 w-10 rounded-t-full bg-[#b8c8d8]" />
                <div className="absolute bottom-4 left-20 h-36 w-12 rounded-t-full bg-[#9db2c7]" />
                <div className="absolute bottom-4 right-10 h-24 w-16 rounded-t-full bg-[#c5d3df]" />
              </div>
            </div>
            <div className="absolute bottom-[16%] right-[8%] h-28 w-[68%] rounded-[24px] bg-[#c7b8a8] shadow-[0_18px_35px_rgba(7,22,56,0.14)]" />
            <div className="absolute bottom-[8%] right-[24%] h-8 w-44 rounded-full bg-[#b7aa9c]" />
            <div className="absolute bottom-[21%] left-[16%] h-24 w-10 rounded-t-full bg-[#4f8a3b]" />
          </div>

          <div className="relative ml-auto mt-4 lg:mt-8">
            <QuoteCard page={page} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-[#f7f9fb] px-4 py-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 rounded-[22px] bg-white p-6 shadow-[0_18px_50px_rgba(7,22,56,0.08)] sm:p-8 lg:grid-cols-4">
        {[
          ["£", "Fair price ranges"],
          ["✓", "Verified local providers"],
          ["○", "No paid ranking"],
          ["↗", "Request a local match"],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-4 lg:border-r lg:border-[#e6ebf2] lg:last:border-r-0">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#f0faf3] text-[28px] font-black text-[#0faa4b] ring-1 ring-[#d8eddd]">
              {icon}
            </span>
            <p className="text-[15px] font-black leading-[1.35] text-[#071638]">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    ["Regular domestic cleaning"],
    ["Deep cleaning"],
    ["End of tenancy cleaning"],
    ["Move-in cleaning"],
    ["One-off cleaning"],
    ["After builders cleaning"],
  ];

  return (
    <section id="services" className="px-4 py-16">
      <div className="mx-auto max-w-[1180px] text-center">
        <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638] sm:text-[34px]">
          Cleaning services people compare on Quickola
        </h2>
        <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#0faa4b]" />

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {services.map(([item]) => (
            <div key={item} className="rounded-[20px] border border-[#e6ebf2] bg-white p-5 shadow-[0_10px_30px_rgba(7,22,56,0.04)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0faf3] text-[18px] font-black text-[#0faa4b]">
                ✓
              </div>
              <p className="mt-4 text-[14px] font-black leading-[1.35] text-[#071638]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["1", "Check the fair price", "See what cleaning usually costs before you book."],
    ["2", "Tell us what you need", "Share the job type, area and basic details."],
    ["3", "We find a match", "Quickola helps match you with a suitable local cleaner."],
    ["4", "Book with confidence", "Choose based on price, trust and availability."],
  ];

  return (
    <section id="how-it-works" className="border-t border-[#edf0f5] px-4 py-16">
      <div className="mx-auto max-w-[1180px] text-center">
        <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638] sm:text-[34px]">
          How It Works
        </h2>
        <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#0faa4b]" />

        <div className="mt-12 grid gap-10 md:grid-cols-4">
          {steps.map(([number, title, text]) => (
            <div key={title} className="relative">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#0faa4b] text-[15px] font-black text-white">
                {number}
              </span>
              <h3 className="mt-5 text-[17px] font-black text-[#071638]">{title}</h3>
              <p className="mx-auto mt-2 max-w-[210px] text-[14px] font-semibold leading-[1.55] text-[#556177]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriceTable({ page }: { page: SeoPage }) {
  return (
    <section id="price-guide" className="bg-[#f7f9fb] px-4 py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-center">
          <h2 className="text-[30px] font-black tracking-[-0.035em] text-[#071638] sm:text-[38px]">
            {page.location} cleaning price guide
          </h2>
          <p className="mx-auto mt-3 max-w-[720px] text-[16px] font-semibold leading-[1.65] text-[#556177]">
            These are guide prices only. Final quotes can change based on property size, condition, access,
            parking, urgency and availability.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[22px] border border-[#dcebe1] bg-white shadow-[0_16px_42px_rgba(7,22,56,0.06)]">
          <div className="grid grid-cols-[1fr_120px] bg-[#f0faf3] px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#08783f] sm:grid-cols-[1fr_150px_1.4fr] sm:px-5">
            <p>Service</p>
            <p>From</p>
            <p className="hidden sm:block">Typical range</p>
          </div>

          {page.priceGuide.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_120px] gap-3 border-t border-[#edf0f5] px-4 py-4 sm:grid-cols-[1fr_150px_1.4fr] sm:px-5"
            >
              <p className="text-[15px] font-black text-[#071638]">{row.label}</p>
              <p className="text-[15px] font-black text-[#08783f]">{row.from}</p>
              <p className="col-span-2 text-[14px] font-semibold leading-[1.5] text-[#556177] sm:col-span-1">
                {row.typical}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ page }: { page: SeoPage }) {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-8 rounded-[22px] bg-[#071638] p-8 text-white shadow-[0_22px_50px_rgba(7,22,56,0.18)] sm:p-10 lg:flex-row">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <img src="/quickola/logo-mark.png" alt="" className="h-20 w-20 rounded-2xl bg-white p-2" />
          <div>
            <h2 className="text-[30px] font-black tracking-[-0.04em] sm:text-[36px]">
              Need a cleaner in {page.location}?
            </h2>
            <p className="mt-2 text-[16px] font-semibold text-white/85">
              Check the fair cleaning price first, then request a trusted local match.
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href={getCheckPriceHref(page)}
            className="inline-flex h-[60px] items-center justify-center rounded-[12px] bg-[#0faa4b] px-10 text-[17px] font-black text-white"
          >
            Check fair price →
          </a>
        </div>
      </div>
    </section>
  );
}

function SeoContent({ page }: { page: SeoPage }) {
  const notes = [
    page.localPriceNote,
    page.localSearchNote,
    `${page.location} cleaner prices can change depending on property size, job type, notice period and availability.`,
    `Deep cleaning and end of tenancy cleaning in ${page.location} usually cost more than regular domestic cleaning because they take longer.`,
    "Very cheap same-day cleaning quotes can be risky if the cleaner cannot clearly explain what is included.",
    "Quickola helps you check a fair price first before asking for a local cleaning match.",
  ].filter(Boolean);

  return (
    <section className="px-4 py-12">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_12px_32px_rgba(7,22,56,0.04)]">
          <h2 className="text-[28px] font-black tracking-[-0.02em] text-[#071638]">
            Local cleaning price notes
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-[16px] border border-[#edf0f5] bg-[#fbfcfd] p-4"
              >
                <p className="text-[14px] font-semibold leading-[1.55] text-[#44506a]">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_12px_32px_rgba(7,22,56,0.04)]">
            <h2 className="text-[24px] font-black tracking-[-0.02em] text-[#071638]">
              Related searches
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {page.secondaryKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[#e1e6ee] bg-[#fbfcfd] px-3 py-2 text-[13px] font-bold text-[#44506a]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {page.nearbyAreas && page.nearbyAreas.length > 0 ? (
            <div className="rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_12px_32px_rgba(7,22,56,0.04)]">
              <h2 className="text-[24px] font-black tracking-[-0.02em] text-[#071638]">
                Nearby areas
              </h2>

              <div className="mt-4 grid gap-2">
                {page.nearbyAreas.map((area) => (
                  <a
                    key={area}
                    href={getCleaningPageHref(area)}
                    className="flex items-center justify-between rounded-[14px] border border-[#edf0f5] bg-[#fbfcfd] px-4 py-3 text-[14px] font-black text-[#071638] transition hover:border-[#0faa4b] hover:bg-[#f0faf3]"
                  >
                    <span>Cleaning in {area}</span>
                    <span className="text-[#0faa4b]">→</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {page.localNeighbourhoods && page.localNeighbourhoods.length > 0 ? (
          <div className="rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_12px_32px_rgba(7,22,56,0.04)] lg:col-span-2">
            <h2 className="text-[28px] font-black tracking-[-0.02em] text-[#071638]">
              Cleaning around {page.location}
            </h2>

            <p className="mt-3 text-[15px] font-semibold leading-[1.65] text-[#556177]">
              People often compare cleaner prices around these parts of {page.location} before booking.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {page.localNeighbourhoods.map((neighbourhood) => (
                <span
                  key={neighbourhood}
                  className="rounded-full border border-[#e1e6ee] bg-[#fbfcfd] px-3 py-2 text-[13px] font-bold text-[#44506a]"
                >
                  {neighbourhood}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div
          id="faq"
          className="rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_12px_32px_rgba(7,22,56,0.04)] lg:col-span-2"
        >
          <h2 className="text-[28px] font-black tracking-[-0.02em] text-[#071638]">
            Frequently asked questions
          </h2>

          <div className="mt-5 divide-y divide-[#edf0f5]">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="cursor-pointer list-none text-[17px] font-black text-[#071638]">
                  {faq.question}
                </summary>

                <p className="mt-2 text-[15px] font-semibold leading-[1.65] text-[#556177]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function SeoLandingPage({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <TopTrustBar />
      <Header page={page} />
      <Hero page={page} />
      <TrustSection />
      <ServicesSection />
      <HowItWorks />
      <PriceTable page={page} />
      <FinalCta page={page} />
      <SeoContent page={page} />
      <Footer />
    </main>
  );
}