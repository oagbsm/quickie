import Footer from "../components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    job_type?: string;
    job_detail?: string;
    time_needed?: string;
    email?: string;
    phone?: string;
  }>;
};

type PriceConfig = {
  label: string;
  from: string;
  suffix?: string;
  note: string;
};

const priceConfigs: Record<string, PriceConfig> = {
  cleaning: {
    label: "Cleaning",
    from: "£18 – £25",
    suffix: "/hr",
    note: "Typical local range before property size, condition and extras are confirmed.",
  },
  "end-of-tenancy-cleaning": {
    label: "End of Tenancy Cleaning",
    from: "£120 – £350+",
    note: "Typical guide range before bedrooms, condition, oven and carpet extras are confirmed.",
  },
  "man-and-van": {
    label: "Man and Van",
    from: "£45 – £90",
    suffix: "/hr",
    note: "Typical range before distance, loading time, stairs and number of helpers are confirmed.",
  },
  removals: {
    label: "Removals",
    from: "£250 – £900+",
    note: "Typical guide range before property size, distance, packing and access are confirmed.",
  },
  plumber: {
    label: "Plumber",
    from: "£80 – £160",
    note: "Typical callout range before parts, labour, urgency and access are confirmed.",
  },
  electrician: {
    label: "Electrician",
    from: "£80 – £150",
    note: "Typical callout range before parts, labour, urgency and fault details are confirmed.",
  },
  locksmith: {
    label: "Locksmith",
    from: "£85 – £180",
    note: "Typical guide range before lock type, time and replacement parts are confirmed.",
  },
  handyman: {
    label: "Handyman",
    from: "£40 – £80",
    suffix: "/hr",
    note: "Typical hourly range before job size, tools and materials are confirmed.",
  },
  gardener: {
    label: "Gardener",
    from: "£25 – £60",
    suffix: "/hr",
    note: "Typical hourly range before garden size, waste and job type are confirmed.",
  },
  "pest-control": {
    label: "Pest Control",
    from: "£90 – £250",
    note: "Typical treatment range before pest type, property size and follow-ups are confirmed.",
  },
  "painter-decorator": {
    label: "Painter / Decorator",
    from: "£180 – £350",
    suffix: "/day",
    note: "Typical day-rate range before prep, paint, room count and finish are confirmed.",
  },
  "carpet-cleaning": {
    label: "Carpet Cleaning",
    from: "£40 – £120+",
    note: "Typical guide range before room count, stains and access are confirmed.",
  },
  "oven-cleaning": {
    label: "Oven Cleaning",
    from: "£50 – £100",
    note: "Typical guide range before oven size, grease level and add-ons are confirmed.",
  },
  "waste-removal": {
    label: "Waste Removal",
    from: "£80 – £250+",
    note: "Typical guide range before load size, weight, waste type and disposal are confirmed.",
  },
  "appliance-repair": {
    label: "Appliance Repair",
    from: "£70 – £150",
    note: "Typical callout and repair range before appliance type, parts and urgency are confirmed.",
  },
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
    "end of tenancy cleaning": "End of Tenancy Cleaning",
    "man and van": "Man and Van",
    removals: "Removals",
    plumber: "Plumber",
    electrician: "Electrician",
    locksmith: "Locksmith",
    handyman: "Handyman",
    gardener: "Gardener",
    "pest control": "Pest Control",
    "painter decorator": "Painter / Decorator",
    "carpet cleaning": "Carpet Cleaning",
    "oven cleaning": "Oven Cleaning",
    "waste removal": "Waste Removal",
    "appliance repair": "Appliance Repair",
    "small move": "Small move",
    "collection delivery": "Collection / delivery",
    "flat move": "Flat move",
    "house move": "House move",
    "locked out": "Locked out",
    "lock change": "Lock change",
    "not sure": "Not sure",
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

function getPriceConfig(serviceSlug: string) {
  return priceConfigs[serviceSlug] ?? priceConfigs.cleaning;
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
          <span className="text-[23px] font-extrabold leading-none tracking-[-0.035em] text-[#071638] sm:text-[28px]">
            Quickola
          </span>
        </a>
        <a
          href="/"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] shadow-[0_5px_12px_rgba(7,22,56,0.03)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]"
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

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 12h16" />
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

function Hero({ area, service }: { area: string; service: string }) {
  return (
    <section className="group relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_58%,#eef9f1_100%)] p-[1px] shadow-[0_14px_42px_rgba(7,22,56,0.045)]">
      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(8,120,63,0)_0deg,rgba(8,120,63,0)_250deg,rgba(8,120,63,0.44)_292deg,rgba(174,242,193,0.9)_310deg,rgba(8,120,63,0.44)_328deg,rgba(8,120,63,0)_360deg)] opacity-70 motion-safe:animate-[quickolaOrbit_9s_linear_infinite]" />
      <div className="relative overflow-hidden rounded-[23px] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_58%,#eef9f1_100%)] px-5 py-5 ring-1 ring-[#dfeee4] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#dff4e6] opacity-60 blur-[2px]" />
        <div className="pointer-events-none absolute -right-28 top-4 h-64 w-64 rounded-full bg-[#e6f7ec] opacity-70" />

        <div className="relative z-10 max-w-[700px]">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#08783f] text-white shadow-[0_12px_26px_rgba(8,120,63,0.2)] ring-[7px] ring-[#e5f6ea] sm:h-14 sm:w-14">
            <CheckIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#08783f]">Request received</p>
          <h1 className="mt-2 max-w-[760px] text-[30px] font-black leading-[1.04] tracking-[-0.04em] text-[#071638] sm:text-[40px] lg:text-[44px]">
            Request received — we’re checking {service.toLowerCase()} options in <span className="text-[#08783f]">{area}.</span>
          </h1>
          <p className="mt-3 max-w-[720px] text-[14px] font-semibold leading-[1.5] text-[#172545] sm:text-[16px]">
            We’ll use your request to check the best next step and email you shortly. No booking pressure.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-[12px] bg-[#eff9f2] px-3 py-2 text-[13px] font-bold text-[#08783f] ring-1 ring-[#d7ecdd]">
              <span>●</span>
              Status: checking local providers
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

function FairPriceCard({ config, area }: { config: PriceConfig; area: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.13),transparent_28%),linear-gradient(135deg,#08783f_0%,#064f35_48%,#071638_100%)] p-5 text-white shadow-[0_16px_42px_rgba(7,22,56,0.12)] lg:p-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/76">Your fair price guide</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <span className="text-[40px] font-black leading-none tracking-[-0.055em] sm:text-[48px]">{config.from}</span>
        {config.suffix ? <span className="pb-2 text-[22px] font-bold">{config.suffix}</span> : null}
      </div>
      <p className="mt-3 text-[15px] font-semibold text-white/84">
        Typical range for {config.label.toLowerCase()} in <span className="font-black text-white">{area}</span>
      </p>

      <p className="mt-4 border-t border-white/14 pt-3 text-[13px] font-medium leading-[1.6] text-white/78">
        {config.note}
      </p>
    </section>
  );
}

function SummaryCard({ service, area, jobType, jobDetail, timeNeeded }: {
  service: string;
  area: string;
  jobType: string;
  jobDetail: string;
  timeNeeded: string;
}) {
  const rows = [
    ["Service", service, <BriefcaseIcon key="service" />],
    ["Job type", jobType, <SearchIcon key="job" />],
    ["Job detail", jobDetail, <ShieldIcon key="detail" />],
    ["Time needed", timeNeeded, <CalendarIcon key="time" />],
    ["Area", area, <PinIcon key="area" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] pb-4">
        <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#071638]">Your request summary</h2>
        <a href={`/check-price?service=${slugify(service, "cleaning")}&area=${slugify(area, "london")}`} className="text-[13px] font-bold text-[#08783f]/80 hover:text-[#08783f] hover:underline">
          Edit
        </a>
      </div>

      <div className="mt-1 divide-y divide-[#edf0f5]">
        {rows.map(([label, value, icon]) => (
          <div key={String(label)} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5">
            <span className="text-[#08783f]">{icon}</span>
            <span className="text-[14px] font-bold text-[#071638]">{label}</span>
            <span className="text-right text-[14px] font-semibold text-[#44506a]">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  const steps = [
    ["1", "Checking local providers", "We’re reviewing suitable options for your request.", <SearchIcon key="search" />],
    ["2", "Sending your best next step", "We’ll email your match or price update.", <MailIcon key="mail" />],
    ["3", "You choose", "Review the details and continue only if useful.", <CheckIcon key="check" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#071638]">What happens next?</h2>
        <p className="text-[13px] font-semibold text-[#657089]">No payment taken. You choose whether to continue.</p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:gap-0">
        {steps.map(([number, title, text, icon], index) => (
          <div key={String(title)} className="relative flex gap-4 lg:block lg:px-6 lg:text-center">
            {index < 2 ? <div className="absolute left-[22px] top-12 h-[calc(100%-20px)] w-px bg-[#dfe5ee] lg:left-auto lg:right-0 lg:top-[32px] lg:h-px lg:w-full" /> : null}
            <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f0faf3] text-[#08783f] ring-1 ring-[#d8eddd] lg:mx-auto lg:h-16 lg:w-16">
              {icon}
            </div>
            <div className="min-w-0">
              <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-[#08783f] text-[13px] font-black text-white lg:absolute lg:left-5 lg:top-5">{number}</span>
              <p className="mt-1 text-[16px] font-black text-[#071638] lg:mt-5">{title}</p>
              <p className="mt-1 text-[14px] font-semibold leading-[1.5] text-[#657089]">{text}</p>
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
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#071638]">Your details are private.</h2>
            <p className="mt-2 max-w-[560px] text-[15px] font-semibold leading-[1.55] text-[#44506a]">
              We never share your information publicly or post your request as a public listing.
            </p>
          </div>
        </div>
        <div className="rounded-[18px] bg-white/70 p-4 ring-1 ring-[#d8eddd]">
          <p className="text-[13px] font-bold text-[#657089]">We’ll contact you on</p>
          <p className="mt-1 text-[14px] font-black text-[#071638]">{email || "your email"}</p>
          {phone ? <p className="mt-1 text-[14px] font-semibold text-[#44506a]">{phone}</p> : null}
        </div>
      </div>
    </section>
  );
}

function BottomActions() {
  return (
    <section className="rounded-[22px] border border-[#d8eddd] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_100%)] p-5 text-center shadow-[0_12px_34px_rgba(7,22,56,0.035)] sm:p-6">
      <h2 className="mx-auto max-w-[560px] text-[23px] font-black leading-[1.15] tracking-[-0.035em] text-[#071638]">
        We’ll check the best next step for this request.
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-[#657089]">You can also check another service or area.</p>
      <a
        href="/"
        className="mx-auto mt-6 flex h-[50px] max-w-[420px] items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
      >
        Check another price
      </a>
      <a href="/" className="mt-4 inline-flex text-[14px] font-bold text-[#08783f] underline underline-offset-4">
        Back to home
      </a>
    </section>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const serviceSlug = slugify(params?.service, "cleaning");
  const areaSlug = slugify(params?.area, "london");
  const config = getPriceConfig(serviceSlug);
  const service = config.label;
  const area = formatParam(areaSlug, "London");
  const jobType = formatParam(params?.job_type, service);
  const jobDetail = formatParam(params?.job_detail, "Not sure");
  const timeNeeded = formatParam(params?.time_needed, "This week");
  const email = params?.email || "";
  const phone = params?.phone || "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <HeroGlowStyles />
      <Header />

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-10 pt-3 sm:px-6 lg:px-8 lg:pb-14 lg:pt-5">
        <a href={`/check-price?service=${serviceSlug}&area=${areaSlug}`} className="inline-flex items-center gap-3 text-[14px] font-bold text-[#071638] transition hover:text-[#08783f]">
          <span className="text-[#08783f]">←</span>
          Back
        </a>

        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
          <Hero area={area} service={service} />

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
            <FairPriceCard config={config} area={area} />
            <SummaryCard
              service={service}
              area={area}
              jobType={jobType}
              jobDetail={jobDetail}
              timeNeeded={timeNeeded}
            />
          </div>

          <Timeline />
          <SafetyCard email={email} phone={phone} />
          <BottomActions />
        </div>
      </section>

      <Footer />
    </main>
  );
}
