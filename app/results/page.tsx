import Footer from "../components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    cleaning_type?: string;
    property_type?: string;
    bedrooms?: string;
    time_needed?: string;
    email?: string;
    phone?: string;
  }>;
};

function formatParam(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  const cleaned = value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const labels: Record<string, string> = {
    asap: "As soon as possible",
    today: "Today",
    tomorrow: "Tomorrow",
    "this week": "This week",
    flexible: "Flexible",
    cleaning: "Cleaning",
    "regular clean": "Regular cleaning",
    "regular cleaning": "Regular cleaning",
    "deep clean": "Deep clean",
    "deep cleaning": "Deep cleaning",
    "end of tenancy": "End of tenancy",
    "end of tenancy clean": "End of tenancy clean",
    "flat apartment": "Flat / apartment",
    "flat / apartment": "Flat / apartment",
    house: "House",
    studio: "Studio",
    "room shared": "Room / shared home",
    "1 bedroom": "1 bedroom",
    "2 bedrooms": "2 bedrooms",
    "3 bedrooms": "3 bedrooms",
    "4 plus bedrooms": "4+ bedrooms",
  };

  if (labels[cleaned]) return labels[cleaned];

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string | undefined, fallback: string) {
  return (value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[62px] w-full max-w-[1160px] items-center justify-between px-4 sm:min-h-[68px] sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-[11px]" aria-label="Quickola homepage">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-[38px] w-[38px] shrink-0 object-contain sm:h-[42px] sm:w-[42px]"
          />
          <span className="text-[23px] font-semibold leading-none tracking-[0.005em] text-[#071638] sm:text-[28px]">
            Quickola
          </span>
        </a>
        {/* Secure & private block removed */}
        <a
          href="/"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] shadow-[0_5px_12px_rgba(7,22,56,0.03)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]"
        >
          New search
        </a>
      </div>
    </header>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-[2.5]`} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6.5 12.3 3.4 3.5 7.6-8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 5.5 6v5.2c0 4 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5.1 6.5-9.1V6L12 3.5Z" />
      <path d="m8.8 12 2 2 4.3-4.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[2]" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 21V4h12v17" />
      <path d="M4 21h16" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11V6" />
      <path d="M20 14v-2a3 3 0 0 0-3-3H9v5" />
      <path d="M4 14h16" />
      <path d="M4 18v-4" />
      <path d="M20 18v-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15" />
      <rect x="4.5" y="5.5" width="15" height="15" rx="2.2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function Hero({ area }: { area: string }) {
  return (
    <section className="group relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_58%,#eef9f1_100%)] p-[1px] shadow-[0_14px_42px_rgba(7,22,56,0.045)]">
      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(8,120,63,0)_0deg,rgba(8,120,63,0)_250deg,rgba(8,120,63,0.44)_292deg,rgba(174,242,193,0.9)_310deg,rgba(8,120,63,0.44)_328deg,rgba(8,120,63,0)_360deg)] opacity-70 motion-safe:animate-[quickolaOrbit_9s_linear_infinite]" />
      <div className="relative overflow-hidden rounded-[23px] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_58%,#eef9f1_100%)] px-5 py-5 ring-1 ring-[#dfeee4] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#dff4e6] opacity-60 blur-[2px]" />
        <div className="pointer-events-none absolute -right-28 top-4 h-64 w-64 rounded-full bg-[#e6f7ec] opacity-70" />

        <div className="relative z-10 max-w-[660px]">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#08783f] text-white shadow-[0_12px_26px_rgba(8,120,63,0.2)] ring-[7px] ring-[#e5f6ea] sm:h-14 sm:w-14">
            <CheckIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#08783f]">Request received</p>
          <h1 className="mt-2 max-w-[760px] text-[30px] font-semibold leading-[1.04] tracking-[-0.028em] text-[#071638] sm:text-[40px] lg:text-[44px]">
            Request received — we’re finding your cleaner <span className="text-[#08783f]">now.</span>
          </h1>
          <p className="mt-3 max-w-[720px] text-[14px] font-medium leading-[1.5] text-[#172545] sm:text-[16px]">
            We’re checking suitable cleaners in {area} and will email your best match shortly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#eff9f2] px-3 py-2 text-[13px] font-semibold text-[#08783f] ring-1 ring-[#d7ecdD]">
              <span>●</span>
              Status: checking local cleaners
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroGlowStyles() {
  return (
    <style>{`
      @keyframes quickolaOrbit {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  );
}

function FairPriceCard({ service, area }: { service: string; area: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.13),transparent_28%),linear-gradient(135deg,#08783f_0%,#064f35_48%,#071638_100%)] p-5 text-white shadow-[0_16px_42px_rgba(7,22,56,0.12)] lg:p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/76">Your fair price</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <span className="text-[40px] font-semibold leading-none tracking-[-0.045em] sm:text-[48px]">£18 – £25</span>
        <span className="pb-2 text-[23px] font-semibold">/hr</span>
      </div>
      <p className="mt-3 text-[15px] font-medium text-white/84">
        Typical range for {service} in <span className="font-semibold text-white">{area}</span>
      </p>

      <p className="mt-4 border-t border-white/14 pt-3 text-[13px] font-medium leading-[1.6] text-white/76">
        Fair price guide · Manual review · Private request
      </p>
    </section>
  );
}

function SummaryCard({ service, area, cleaningType, propertyType, bedrooms, timeNeeded }: {
  service: string;
  area: string;
  cleaningType: string;
  propertyType: string;
  bedrooms: string;
  timeNeeded: string;
}) {
  const rows = [
    ["Service", cleaningType || service, <HomeIcon key="service" />],
    ["Property type", propertyType, <BuildingIcon key="property" />],
    ["Bedrooms", bedrooms, <BedIcon key="bedrooms" />],
    ["Time needed", timeNeeded, <CalendarIcon key="time" />],
    ["Area", area, <PinIcon key="area" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] pb-4">
        <h2 className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#071638]">Your request summary</h2>
        <a href={`/check-price?service=${slugify(service, "cleaning")}&area=${slugify(area, "ilford")}`} className="text-[13px] font-medium text-[#08783f]/80 hover:text-[#08783f] hover:underline">
          Edit
        </a>
      </div>

      <div className="mt-1 divide-y divide-[#edf0f5]">
        {rows.map(([label, value, icon]) => (
          <div key={String(label)} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5">
            <span className="text-[#08783f]">{icon}</span>
            <span className="text-[14px] font-semibold text-[#071638]">{label}</span>
            <span className="text-right text-[14px] font-medium text-[#44506a]">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  const steps = [
    ["1", "Checking local cleaners", "We’re finding available and suitable cleaners near you.", <SearchIcon key="search" />],
    ["2", "Sending your best match", "We’ll email your best match and price update.", <MailIcon key="mail" />],
    ["3", "You choose", "Review the details and book with no obligation.", <CheckIcon key="check" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#071638]">What happens next?</h2>
        <p className="text-[13px] font-medium text-[#657089]">No payment taken. You choose whether to book.</p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:gap-0">
        {steps.map(([number, title, text, icon], index) => (
          <div key={String(title)} className="relative flex gap-4 lg:block lg:px-6 lg:text-center">
            {index < 2 ? <div className="absolute left-[22px] top-12 h-[calc(100%-20px)] w-px bg-[#dfe5ee] lg:left-auto lg:right-0 lg:top-[32px] lg:h-px lg:w-full" /> : null}
            <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f0faf3] text-[#08783f] ring-1 ring-[#d8eddd] lg:mx-auto lg:h-16 lg:w-16">
              {icon}
            </div>
            <div className="min-w-0">
              <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-[#08783f] text-[13px] font-semibold text-white lg:absolute lg:left-5 lg:top-5">{number}</span>
              <p className="mt-1 text-[16px] font-semibold text-[#071638] lg:mt-5">{title}</p>
              <p className="mt-1 text-[14px] font-medium leading-[1.5] text-[#657089]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SafetyCard({ email, phone }: { email: string; phone: string }) {
  return (
    <section className="rounded-[22px] border border-[#d8eddd] bg-[linear-gradient(135deg,#f1faf4_0%,#ffffff_100%)] p-4 shadow-[0_12px_34px_rgba(7,22,56,0.035)] sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#08783f] text-white ring-[7px] ring-[#e1f3e7]"><ShieldIcon /></span>
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-[#071638]">Your details are private.</h2>
            <p className="mt-2 max-w-[560px] text-[15px] font-medium leading-[1.55] text-[#44506a]">
              We never share your information publicly or with anyone you haven’t chosen.
            </p>
          </div>
        </div>
        <div className="rounded-[18px] bg-white/70 p-4 ring-1 ring-[#d8eddd]">
          <p className="text-[13px] font-semibold text-[#657089]">We’ll contact you on</p>
          <p className="mt-1 text-[14px] font-semibold text-[#071638]">{email || "your email"}</p>
          {phone ? <p className="mt-1 text-[14px] font-medium text-[#44506a]">{phone}</p> : null}
        </div>
      </div>
    </section>
  );
}

function BottomActions() {
  return (
    <section className="rounded-[22px] border border-[#d8eddd] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_100%)] p-5 text-center shadow-[0_12px_34px_rgba(7,22,56,0.035)] sm:p-6">
      <div className="mx-auto hidden h-12 w-12 place-items-center rounded-full bg-[#e3f5e9] text-[#08783f] sm:grid"><span className="text-[22px]">♥</span></div>
      <h2 className="mx-auto max-w-[520px] text-[23px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#071638] sm:mt-4">
        You’re one step closer to a cleaner home.
      </h2>
      <p className="mt-2 text-[15px] font-medium text-[#657089]">We’ll do the hard work. You enjoy the result.</p>
      <a
        href="/"
        className="mx-auto mt-6 flex h-[50px] max-w-[420px] items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
      >
        Check another price
      </a>
      <a href="/" className="mt-4 inline-flex text-[14px] font-medium text-[#08783f] underline underline-offset-4">
        Back to home
      </a>
    </section>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const serviceSlug = slugify(params?.service, "cleaning");
  const areaSlug = slugify(params?.area, "ilford");
  const service = formatParam(serviceSlug, "Cleaning");
  const area = formatParam(areaSlug, "Ilford");
  const cleaningType = formatParam(params?.cleaning_type, service === "Cleaning" ? "Regular cleaning" : service);
  const propertyType = formatParam(params?.property_type, "Flat / Apartment");
  const bedrooms = formatParam(params?.bedrooms, "2 Bedrooms");
  const timeNeeded = formatParam(params?.time_needed, "This week");
  const email = params?.email || "";
  const phone = params?.phone || "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <HeroGlowStyles />
      <Header />

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-10 pt-3 sm:px-6 lg:px-8 lg:pb-14 lg:pt-5">
        <a href={`/check-price?service=${serviceSlug}&area=${areaSlug}`} className="inline-flex items-center gap-3 text-[14px] font-medium text-[#071638] transition hover:text-[#08783f]">
          <span className="text-[#08783f]">←</span>
          Back
        </a>

        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
          <Hero area={area} />

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
            <FairPriceCard service={cleaningType} area={area} />
            <SummaryCard
              service={service}
              area={area}
              cleaningType={cleaningType}
              propertyType={propertyType}
              bedrooms={bedrooms}
              timeNeeded={timeNeeded}
            />
          </div>

          <Timeline />
          <SafetyCard email={email} phone={phone} />
          <BottomActions />
        </div>

        {/* Trust strip removed */}
      </section>

      <Footer />
    </main>
  );
}