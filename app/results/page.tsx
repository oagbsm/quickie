import Footer from "../components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    postcode?: string;
    job_type?: string;
    job_detail?: string;
    time_needed?: string;
    email?: string;
    phone?: string;
    intent?: string;
    request_id?: string;
    ready_for_provider?: string;
  }>;
};

type PriceConfig = {
  label: string;
  from: string;
  suffix?: string;
  note: string;
};

const priceConfigs: Record<string, PriceConfig> = {
  "local-helper": {
    label: "Local Helper",
    from: "£25 – £45",
    suffix: "/hr",
    note: "Typical Slough range before job size, access, lifting, waiting time and urgency are confirmed.",
  },
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
    note: "Typical callout range before parts, urgency, access and repair details are confirmed.",
  },
  electrician: {
    label: "Electrician",
    from: "£80 – £150",
    note: "Typical callout range before parts, urgency, access and fault details are confirmed.",
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
  "mot-car-repairs": {
    label: "MOT & Car Repairs",
    from: "£45 – £95",
    note: "Typical Slough guide range before vehicle type, garage availability, diagnostics, parts and repair work are confirmed.",
  },
  "car-repair": {
    label: "Car Repair",
    from: "£70 – £180+",
    note: "Typical Slough garage range before diagnostics, parts, labour time and vehicle model are confirmed.",
  },
  tyres: {
    label: "Tyres",
    from: "£55 – £130",
    note: "Typical tyre range before tyre size, brand, fitting and balancing are confirmed.",
  },
  "airport-transfer": {
    label: "Airport Transfer",
    from: "£35 – £95",
    note: "Typical local transfer range before airport, passengers, luggage and pickup time are confirmed.",
  },
  "private-gp": {
    label: "Private GP",
    from: "£60 – £150",
    note: "Typical appointment guide range before clinic, appointment type and tests are confirmed.",
  },
  dentist: {
    label: "Dentist",
    from: "£45 – £120",
    note: "Typical consultation and treatment guide range before clinic and treatment type are confirmed.",
  },
  optician: {
    label: "Optician",
    from: "£20 – £60",
    note: "Typical eye test guide range before store, prescription and glasses are confirmed.",
  },
  storage: {
    label: "Storage",
    from: "£15 – £45",
    suffix: "/week",
    note: "Typical storage range before unit size, access, insurance and contract length are confirmed.",
  },
  broadband: {
    label: "Broadband",
    from: "£22 – £45",
    suffix: "/mo",
    note: "Typical broadband range before speed, contract length, installation and provider availability are confirmed.",
  },
};

function normaliseServiceSlug(value: string | undefined) {
  const slug = slugify(value, "cleaning");

  const aliases: Record<string, string> = {
    mot: "mot-car-repairs",
    "mot-repairs": "mot-car-repairs",
    "mot-car-repair": "mot-car-repairs",
    "car-repairs": "car-repair",
    plumbing: "plumber",
    electrical: "electrician",
    painting: "painter-decorator",
    painter: "painter-decorator",
    decorating: "painter-decorator",
    "van-man": "man-and-van",
    "man-with-van": "man-and-van",
  };

  return aliases[slug] ?? slug;
}

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
    "mot car repairs": "MOT & Car Repairs",
    mot: "MOT",
    "car repair": "Car Repair",
    "car repairs": "Car Repairs",
    tyres: "Tyres",
    "airport transfer": "Airport Transfer",
    "private gp": "Private GP",
    dentist: "Dentist",
    optician: "Optician",
    storage: "Storage",
    broadband: "Broadband",
    "small car": "Small car",
    "medium car": "Medium car",
    "large car": "Large car",
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

function formatPostcodeParam(value: string | undefined) {
  if (!value) return "Slough";

  const clean = value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!clean) return "Slough";
  return clean;
}

function slugify(value: string | undefined, fallback: string) {
  return (value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPriceConfig(serviceSlug: string) {
  return (
    priceConfigs[serviceSlug] ?? {
      label: formatParam(serviceSlug, "Service"),
      from: "Guide price pending",
      note: "We do not have enough local price data for this service yet. Use this as a placeholder until Quickola has more local checks.",
    }
  );
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
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" aria-hidden="true">
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

function HeroGlowStyles() {
  return (
    <style>{`
      @keyframes quickolaCheckingFade {
        0%, 88% {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        100% {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
      }

      @keyframes quickolaCheckingBar {
        0% { width: 8%; }
        32% { width: 42%; }
        68% { width: 76%; }
        100% { width: 100%; }
      }

      @keyframes quickolaCheckingPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.86; }
      }

      @keyframes quickolaStepOne {
        0%, 12% { opacity: 0.4; }
        18%, 100% { opacity: 1; }
      }

      @keyframes quickolaStepTwo {
        0%, 34% { opacity: 0.4; }
        44%, 100% { opacity: 1; }
      }

      @keyframes quickolaStepThree {
        0%, 60% { opacity: 0.4; }
        72%, 100% { opacity: 1; }
      }

      .quickola-checking-overlay {
        animation: quickolaCheckingFade 3s ease forwards;
      }

      .quickola-checking-bar {
        animation: quickolaCheckingBar 2.55s ease-out forwards;
      }

      .quickola-checking-pulse {
        animation: quickolaCheckingPulse 1.1s ease-in-out infinite;
      }

      .quickola-step-1 { animation: quickolaStepOne 2.55s ease forwards; }
      .quickola-step-2 { animation: quickolaStepTwo 2.55s ease forwards; }
      .quickola-step-3 { animation: quickolaStepThree 2.55s ease forwards; }
    `}</style>
  );
}

function PriceCheckingOverlay({ config, postcode }: { config: PriceConfig; postcode: string }) {
  const checks = [
    ["Checking local data", "quickola-step-1", "✓"],
    ["Looking at recent jobs", "quickola-step-2", "✓"],
    ["Calculating fair range", "quickola-step-3", "○"],
  ];

  return (
    <div className="quickola-checking-overlay fixed inset-0 z-[90] grid place-items-center bg-white px-4">
      <div className="w-full max-w-[390px] rounded-[28px] border border-[#e1e6ee] bg-white p-5 text-center shadow-[0_24px_70px_rgba(7,22,56,0.16)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eef9f2] text-[#08783f] ring-[8px] ring-[#f6fbf8]">
          <div className="quickola-checking-pulse grid h-11 w-11 place-items-center rounded-full bg-[#08783f] text-white shadow-[0_10px_22px_rgba(8,120,63,0.2)]">
            <SearchIcon />
          </div>
        </div>

        <h2 className="mx-auto mt-5 max-w-[310px] text-[21px] font-black leading-[1.08] tracking-[-0.045em] text-[#071638]">
          Getting your price guide
        </h2>

        <p className="mx-auto mt-2 max-w-[310px] text-[13px] font-bold leading-[1.45] text-[#44506a]">
          Please wait a moment...
        </p>

        <p className="mx-auto mt-2 max-w-[310px] text-[12px] font-black uppercase tracking-[0.08em] text-[#08783f]">
          {config.label} · {postcode}
        </p>

        <div className="mt-5 overflow-hidden rounded-full bg-[#eaf1ee]">
          <div className="quickola-checking-bar h-1.5 rounded-full bg-[#08783f]" />
        </div>

        <div className="mt-5 grid gap-3 text-left">
          {checks.map(([check, className, icon]) => (
            <div
              key={check}
              className={`${className} flex items-center gap-3 text-[13px] font-bold text-[#071638]`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#b9d9c4] text-[11px] text-[#08783f]">
                {icon}
              </span>
              <span>{check}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-[#edf0f5] pt-4">
          <p className="text-[12px] font-bold leading-[1.45] text-[#44506a]">
            This doesn’t send a request. No contact details needed.
          </p>
        </div>
      </div>
    </div>
  );
}


function FairPriceCard({ config, postcode }: { config: PriceConfig; postcode: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.13),transparent_28%),linear-gradient(135deg,#08783f_0%,#064f35_48%,#071638_100%)] p-4 text-center text-white shadow-[0_16px_42px_rgba(7,22,56,0.12)] sm:text-left lg:p-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/76">
        Your local fair price guide
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-center gap-3 text-center sm:justify-start sm:text-left">
        <span className="text-[38px] font-black leading-[0.95] tracking-[-0.065em] sm:text-[52px]">
          {config.from}
        </span>
        {config.suffix ? <span className="pb-2 text-[22px] font-bold">{config.suffix}</span> : null}
      </div>

      <p className="mt-3 text-[15px] font-semibold text-white/86">
        Typical guide range for {config.label.toLowerCase()} near{" "}
        <span className="font-black text-white">{postcode}</span>
      </p>

      <p className="mt-3 border-t border-white/14 pt-3 text-[13px] font-medium leading-[1.45] text-white/78">
        {config.note}
      </p>
    </section>
  );
}

function JustCheckingResult({
  config,
  postcode,
  serviceSlug,
}: {
  config: PriceConfig;
  postcode: string;
  serviceSlug: string;
}) {
  const factors = ["Distance", "Load size", "Stairs", "Parking", "Urgency"];

  return (
    <div className="mx-auto max-w-[680px] space-y-3">
      <section className="rounded-[24px] border border-[#dcebe1] bg-white p-4 text-center shadow-[0_14px_38px_rgba(7,22,56,0.055)] sm:p-5 lg:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#08783f]">
          Price guide
        </p>

        <h1 className="mx-auto mt-2 max-w-[520px] text-[28px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[40px]">
          Your fair price guide
        </h1>

        <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-bold leading-[1.45] text-[#44506a] sm:text-[16px]">
          {config.label} · {postcode}
        </p>

        <div className="mx-auto mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-[#f7fcf8] px-4 py-2 text-[12px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">
          <CheckIcon className="h-4 w-4" />
          Price guide ready
        </div>

        <div className="mt-4">
          <FairPriceCard config={config} postcode={postcode} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <span className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#eff9f2] px-3 py-2 text-[13px] font-bold text-[#08783f] ring-1 ring-[#d7ecdd]">
            <span className="h-2 w-2 rounded-full bg-[#08783f]" />
            No request sent
          </span>

          <span className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#f7fafc] px-3 py-2 text-[13px] font-bold text-[#44506a] ring-1 ring-[#dfe6ef]">
            <ShieldIcon />
            No provider contacted
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a
            href={`/check-price?service=${encodeURIComponent(serviceSlug)}&postcode=${encodeURIComponent(
              postcode
            )}&mode=find-provider`}
            className="flex h-[52px] items-center justify-center rounded-[14px] bg-[#075cff] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,92,255,0.2)] transition hover:-translate-y-0.5"
          >
            Connect me with a provider
          </a>

          <a
            href="/"
            className="flex h-[52px] items-center justify-center rounded-[14px] border border-[#d8eddd] bg-white px-5 text-[15px] font-black text-[#08783f] transition hover:-translate-y-0.5 hover:border-[#08783f]/40"
          >
            Check another price
          </a>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e1e6ee] bg-white p-3 shadow-[0_10px_28px_rgba(7,22,56,0.035)] sm:p-4">
        <h2 className="text-[16px] font-black tracking-[-0.02em] text-[#071638]">
          What affects the price?
        </h2>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {factors.map((factor) => (
            <div
              key={factor}
              className="rounded-[14px] bg-[#f7fafc] px-3 py-3 text-center text-[12px] font-black text-[#44506a] ring-1 ring-[#edf0f5]"
            >
              {factor}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  service,
  postcode,
  jobType,
  jobDetail,
  timeNeeded,
}: {
  service: string;
  postcode: string;
  jobType: string;
  jobDetail: string;
  timeNeeded: string;
}) {
  const rows = [
    ["Service", service, <BriefcaseIcon key="service" />],
    ["Job type", jobType, <SearchIcon key="job" />],
    ["Job detail", jobDetail, <ShieldIcon key="detail" />],
    ["Time needed", timeNeeded, <CalendarIcon key="time" />],
    ["Postcode", postcode, <PinIcon key="postcode" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf0f5] pb-4">
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#071638]">
            Your request
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#657089] sm:hidden">
            {service} · {postcode}
          </p>
        </div>

        <a
          href={`/check-price?service=${slugify(service, "cleaning")}&postcode=${encodeURIComponent(postcode)}`}
          className="inline-flex h-8 items-center justify-center rounded-full border border-[#d8eddd] bg-[#f7fcf8] px-3 text-[13px] font-bold text-[#08783f] transition hover:-translate-y-0.5 hover:border-[#08783f]/40"
        >
          Edit
        </a>
      </div>

      <div className="mt-1 divide-y divide-[#edf0f5]">
        {rows.map(([label, value, icon]) => (
          <div key={String(label)} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5">
            <span className="text-[#08783f]">{icon}</span>
            <span className="text-[14px] font-bold text-[#071638]">{label}</span>
            <span className="max-w-[150px] truncate text-right text-[14px] font-semibold text-[#44506a] sm:max-w-none">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProviderResultHero({
  postcode,
  service,
}: {
  postcode: string;
  service: string;
}) {
  return (
    <section className="rounded-[24px] border border-[#dcebe1] bg-[linear-gradient(135deg,#f4fbf6_0%,#ffffff_58%,#edf9f1_100%)] p-4 text-center shadow-[0_14px_38px_rgba(7,22,56,0.055)] sm:p-7 lg:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#08783f] text-white shadow-[0_10px_22px_rgba(8,120,63,0.18)] ring-[7px] ring-[#e5f6ea] sm:h-16 sm:w-16">
        <CheckIcon className="h-8 w-8" />
      </div>

      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#08783f]">
        Request sent
      </p>

      <h1 className="mx-auto mt-2 max-w-[760px] text-[31px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[44px]">
        A provider will contact you soon.
      </h1>

      <p className="mx-auto mt-3 max-w-[650px] text-[14px] font-bold leading-[1.5] text-[#44506a] sm:text-[17px]">
        We’ve sent your {service.toLowerCase()} request near{" "}
        <span className="font-black text-[#071638]">{postcode}</span> to one suitable local provider.
        They’ll contact you directly.
      </p>

      <div className="mx-auto mt-5 grid max-w-[760px] gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <span className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#eff9f2] px-3 py-2 text-[13px] font-bold text-[#08783f] ring-1 ring-[#d7ecdd]">
          <span className="h-2 w-2 rounded-full bg-[#08783f]" />
          No booking made
        </span>
        <span className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white/84 px-3 py-2 text-[13px] font-bold text-[#44506a] ring-1 ring-[#dfe8e4]">
          <ShieldIcon />
          Your number is only used for this request
        </span>
      </div>
    </section>
  );
}

function Timeline() {
  const steps = [
    ["Request sent", "We send your request to one suitable local provider.", <CheckIcon key="check" />],
    ["Provider contacts you", "They call or text you directly.", <MailIcon key="mail" />],
    ["You stay in control", "No booking or payment is made by Quickola.", <ShieldIcon key="shield" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#071638]">
          What happens next?
        </h2>
        <p className="text-[13px] font-semibold text-[#657089]">No payment taken. No booking made.</p>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-3">
        {steps.map(([title, text, icon]) => (
          <div
            key={String(title)}
            className="flex gap-3 rounded-[17px] border border-[#edf0f5] bg-[#fbfcfd] p-3 lg:block lg:p-4 lg:text-center"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0faf3] text-[#08783f] ring-1 ring-[#d8eddd] lg:mx-auto">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-black text-[#071638] lg:mt-3">{title}</p>
              <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#657089]">{text}</p>
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#08783f] text-white ring-[7px] ring-[#e1f3e7]">
            <ShieldIcon />
          </span>
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#071638]">
              Your details stay private.
            </h2>
            <p className="mt-2 max-w-[560px] text-[15px] font-semibold leading-[1.55] text-[#44506a]">
              We send your request to one suitable provider so they can contact you. We do not post your
              request publicly or sell your details to a provider list.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] bg-white/70 p-4 ring-1 ring-[#d8eddd]">
          <p className="text-[13px] font-bold text-[#657089]">Provider can contact you on</p>
          <p className="mt-1 break-all text-[14px] font-black text-[#071638]">{phone || "your mobile"}</p>
          {email ? <p className="mt-1 break-all text-[14px] font-semibold text-[#44506a]">{email}</p> : null}
        </div>
      </div>
    </section>
  );
}

function BottomActions() {
  return (
    <section className="rounded-[22px] border border-[#d8eddd] bg-[linear-gradient(135deg,#f7fcf8_0%,#ffffff_100%)] p-5 text-center shadow-[0_12px_34px_rgba(7,22,56,0.035)] sm:p-6">
      <h2 className="mx-auto max-w-[560px] text-[23px] font-black leading-[1.15] tracking-[-0.035em] text-[#071638]">
        Need another price?
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-[#657089]">
        Start a new Quickola price check anytime.
      </p>
      <a
        href="/"
        className="mx-auto mt-6 flex h-[50px] max-w-[420px] items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
      >
        Check another price
      </a>
    </section>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const serviceSlug = normaliseServiceSlug(params?.service);
  const postcode = formatPostcodeParam(params?.postcode || params?.area);
  const config = getPriceConfig(serviceSlug);
  const service = config.label;
  const jobType = formatParam(params?.job_type, service);
  const jobDetail = formatParam(params?.job_detail, "Not sure");
  const timeNeeded = formatParam(params?.time_needed, "This week");
  const email = params?.email || "";
  const phone = params?.phone || "";
  const intent = params?.intent === "just-checking" ? "just-checking" : "wants-provider";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] pb-8 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:pb-0">
      <HeroGlowStyles />
      <Header />

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-8 pt-3 sm:px-6 lg:px-8 lg:pb-14 lg:pt-4">
        <a
          href={`/check-price?service=${serviceSlug}&postcode=${encodeURIComponent(postcode)}`}
          className="inline-flex items-center gap-3 text-[14px] font-bold text-[#071638] transition hover:text-[#08783f]"
        >
          <span className="text-[#08783f]">←</span>
          Back
        </a>

        {intent === "just-checking" ? (
          <div className="mt-3 sm:mt-4">
            <PriceCheckingOverlay config={config} postcode={postcode} />
            <JustCheckingResult config={config} postcode={postcode} serviceSlug={serviceSlug} />
          </div>
        ) : (
          <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
            <ProviderResultHero postcode={postcode} service={service} />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
              <FairPriceCard config={config} postcode={postcode} />
              <SummaryCard
                service={service}
                postcode={postcode}
                jobType={jobType}
                jobDetail={jobDetail}
                timeNeeded={timeNeeded}
              />
            </div>

            <SafetyCard email={email} phone={phone} />
            <Timeline />
            <BottomActions />
          </div>
        )}
      </section>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}