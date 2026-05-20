
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
  return priceConfigs[serviceSlug] ?? {
    label: formatParam(serviceSlug, "Service"),
    from: "Guide price pending",
    note: "We received your request and will review the best available local next step before confirming details.",
  };
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

function Hero({ postcode, service }: { postcode: string; service: string }) {
  return (
    <section className="rounded-[24px] border border-[#dcebe1] bg-[linear-gradient(135deg,#f4fbf6_0%,#ffffff_58%,#edf9f1_100%)] p-4 text-center shadow-[0_14px_38px_rgba(7,22,56,0.055)] sm:p-7 lg:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#08783f] text-white shadow-[0_10px_22px_rgba(8,120,63,0.18)] ring-[7px] ring-[#e5f6ea] sm:h-16 sm:w-16">
        <CheckIcon className="h-8 w-8" />
      </div>

      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#08783f]">Request received</p>
      <h1 className="mx-auto mt-2 max-w-[760px] text-[31px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[44px]">
        We’re checking your best next step.
      </h1>
      <p className="mx-auto mt-3 max-w-[650px] text-[14px] font-bold leading-[1.5] text-[#44506a] sm:text-[17px]">
        Your {service.toLowerCase()} request near <span className="font-black text-[#071638]">{postcode}</span> is in motion. We’ll email your update shortly.
      </p>

      <div className="mx-auto mt-5 grid max-w-[520px] gap-2 sm:grid-cols-2">
        <a
          href="/"
          className="flex h-[52px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
        >
          Check another price
        </a>
        <a
          href="/"
          className="flex h-[52px] items-center justify-center rounded-[14px] border border-[#d8eddd] bg-white px-5 text-[15px] font-black text-[#08783f] transition hover:-translate-y-0.5 hover:border-[#08783f]/40"
        >
          Back to home
        </a>
      </div>

      <div className="mx-auto mt-5 grid max-w-[760px] gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <span className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#eff9f2] px-3 py-2 text-[13px] font-bold text-[#08783f] ring-1 ring-[#d7ecdd]">
          <span className="h-2 w-2 rounded-full bg-[#08783f]" />
          No booking made
        </span>
        <span className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white/84 px-3 py-2 text-[13px] font-bold text-[#44506a] ring-1 ring-[#dfe8e4]">
          <ShieldIcon />
          Your details stay private
        </span>
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

function FairPriceCard({ config, postcode }: { config: PriceConfig; postcode: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.13),transparent_28%),linear-gradient(135deg,#08783f_0%,#064f35_48%,#071638_100%)] p-5 text-white shadow-[0_16px_42px_rgba(7,22,56,0.12)] lg:p-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/76">Your local fair price guide</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <span className="text-[40px] font-black leading-none tracking-[-0.055em] sm:text-[48px]">{config.from}</span>
        {config.suffix ? <span className="pb-2 text-[22px] font-bold">{config.suffix}</span> : null}
      </div>
      <p className="mt-3 text-[15px] font-semibold text-white/84">
        Typical guide range for {config.label.toLowerCase()} near <span className="font-black text-white">{postcode}</span>
      </p>

      <p className="mt-4 border-t border-white/14 pt-3 text-[13px] font-medium leading-[1.6] text-white/78">
        {config.note}
      </p>
    </section>
  );
}

function SummaryCard({ service, postcode, jobType, jobDetail, timeNeeded }: {
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
          <h2 className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#071638]">Your request</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#657089] sm:hidden">
            {service} · {postcode}
          </p>
        </div>
        <a href={`/check-price?service=${slugify(service, "cleaning")}&postcode=${encodeURIComponent(postcode)}`} className="inline-flex h-8 items-center justify-center rounded-full border border-[#d8eddd] bg-[#f7fcf8] px-3 text-[13px] font-bold text-[#08783f] transition hover:-translate-y-0.5 hover:border-[#08783f]/40">
          Edit
        </a>
      </div>

      <div className="mt-1 divide-y divide-[#edf0f5]">
        {rows.map(([label, value, icon]) => (
          <div key={String(label)} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5">
            <span className="text-[#08783f]">{icon}</span>
            <span className="text-[14px] font-bold text-[#071638]">{label}</span>
            <span className="max-w-[150px] truncate text-right text-[14px] font-semibold text-[#44506a] sm:max-w-none">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  const steps = [
    ["Request received", "We have your price check and job details.", <CheckIcon key="check" />],
    ["Reviewing options", "We check the best local next step, not a spam list.", <SearchIcon key="search" />],
    ["Email update", "You review the details and continue only if useful.", <MailIcon key="mail" />],
  ];

  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_14px_38px_rgba(7,22,56,0.045)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#071638]">What happens next?</h2>
        <p className="text-[13px] font-semibold text-[#657089]">No payment taken. No booking made.</p>
      </div>
      <div className="mt-4 grid gap-2 lg:grid-cols-3">
        {steps.map(([title, text, icon]) => (
          <div key={String(title)} className="flex gap-3 rounded-[17px] border border-[#edf0f5] bg-[#fbfcfd] p-3 lg:block lg:p-4 lg:text-center">
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#08783f] text-white ring-[7px] ring-[#e1f3e7]"><ShieldIcon /></span>
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#071638]">Your details are private.</h2>
            <p className="mt-2 max-w-[560px] text-[15px] font-semibold leading-[1.55] text-[#44506a]">
              We never share your information publicly, post your request as a listing, or sell your details to a provider list.
            </p>
          </div>
        </div>
        <div className="rounded-[18px] bg-white/70 p-4 ring-1 ring-[#d8eddd]">
          <p className="text-[13px] font-bold text-[#657089]">Your update will be sent to</p>
          <p className="mt-1 break-all text-[14px] font-black text-[#071638]">{email || "your email"}</p>
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
        Need another local price?
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-[#657089]">You can check another service in seconds.</p>
      <a
        href="/"
        className="mx-auto mt-6 flex h-[50px] max-w-[420px] items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
      >
        Check another price
      </a>
    </section>
  );
}

function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe6ef] bg-white/96 px-4 py-3 shadow-[0_-12px_34px_rgba(7,22,56,0.12)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-[520px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Need another price?</p>
          <p className="truncate text-[16px] font-black tracking-[-0.04em] text-[#071638]">Check a new service</p>
        </div>
        <a href="/" className="flex h-12 shrink-0 items-center justify-center rounded-[14px] bg-[#08783f] px-4 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(8,120,63,0.22)]">
          Check price
        </a>
      </div>
    </div>
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] pb-24 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:pb-0">
      <HeroGlowStyles />
      <Header />

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-8 pt-3 sm:px-6 lg:px-8 lg:pb-14 lg:pt-5">
        <a href={`/check-price?service=${serviceSlug}&postcode=${encodeURIComponent(postcode)}`} className="inline-flex items-center gap-3 text-[14px] font-bold text-[#071638] transition hover:text-[#08783f]">
          <span className="text-[#08783f]">←</span>
          Back
        </a>

        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
          <Hero postcode={postcode} service={service} />

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

          <Timeline />
          <SafetyCard email={email} phone={phone} />
          <BottomActions />
        </div>
      </section>

      <div className="hidden lg:block">
        <Footer />
      </div>

      <MobileStickyCta />
    </main>
  );
}
