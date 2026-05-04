import Link from "next/link";
import Footer from "../components/Footer";

type CheckPricePageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
  }>;
};

const cleaningTypes = [
  { label: "Regular Clean", value: "regular-clean" },
  { label: "Deep Clean", value: "deep-clean" },
  { label: "End of Tenancy", value: "end-of-tenancy" },
  { label: "Move-in Clean", value: "move-in-clean" },
];

const propertyTypes = [
  { label: "Flat / Apartment", value: "flat-apartment" },
  { label: "House", value: "house" },
  { label: "Studio", value: "studio" },
  { label: "Room / Shared home", value: "room-shared" },
];

const bedroomOptions = [
  { label: "Studio", value: "studio" },
  { label: "1 Bedroom", value: "1-bedroom" },
  { label: "2 Bedrooms", value: "2-bedrooms" },
  { label: "3 Bedrooms", value: "3-bedrooms" },
  { label: "4+ Bedrooms", value: "4-plus-bedrooms" },
];

const urgencyOptions = [
  { label: "As soon as possible", value: "asap" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This week", value: "this-week" },
  { label: "Flexible", value: "flexible" },
];

const popularSearches = [
  { label: "Cleaner in Ilford", service: "cleaning", area: "ilford" },
  { label: "End of tenancy clean", service: "end-of-tenancy-clean", area: "barking" },
  { label: "Deep cleaning", service: "deep-cleaning", area: "east-ham" },
  { label: "Cleaner in Stratford", service: "cleaning", area: "stratford" },
];

function formatParam(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Quickola homepage">
      <img
        src="/quickola/logo-mark.png"
        alt="Quickola"
        className="h-9 w-9 shrink-0 rounded-full object-contain sm:h-10 sm:w-10"
      />
      <span className="text-[24px] font-semibold leading-none tracking-[0.01em] text-[#071638] sm:text-[30px]">
        Quickola
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[62px] w-full max-w-[1220px] items-center justify-between px-4 sm:min-h-[74px] sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]"
        >
          New search
        </Link>
      </div>
    </header>
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

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3L20 10.7a2 2 0 0 1 0 2.8Z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
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

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function SelectField({
  label,
  name,
  options,
  icon,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  icon: React.ReactNode;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#071638]">{label}</span>
      <div className="relative flex h-[46px] items-center gap-3 rounded-[12px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#08783f] focus-within:ring-4 focus-within:ring-[#08783f]/10">
        <span className="shrink-0 text-[#071638]">{icon}</span>
        <select
          name={name}
          defaultValue={defaultValue ?? options[0]?.value}
          className="min-w-0 flex-1 appearance-none bg-transparent text-[14px] font-semibold text-[#071638] outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="pointer-events-none text-[20px] font-black text-[#071638]">⌄</span>
      </div>
    </label>
  );
}

function TextInput({
  label,
  name,
  placeholder,
  icon,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#071638]">{label}</span>
      <div className="flex h-[46px] items-center gap-3 rounded-[12px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#08783f] focus-within:ring-4 focus-within:ring-[#08783f]/10">
        <span className="shrink-0 text-[#071638]">{icon}</span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#071638] outline-none placeholder:text-[#8b94a7]"
        />
      </div>
    </label>
  );
}

function PriceCard() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-[#071638] text-white shadow-[0_18px_46px_rgba(7,22,56,0.16)]">
      <div className="px-4 py-4 text-center sm:px-7 sm:py-5">
        <p className="text-[13px] font-semibold text-white/82 sm:text-[15px]">Typical hourly rate</p>
        <div className="mt-2 flex flex-wrap items-end justify-center gap-2 sm:mt-3">
          <span className="text-[34px] font-bold tracking-[-0.035em] sm:text-[46px]">£18 – £25</span>
          <span className="pb-1.5 text-[20px] font-semibold sm:pb-2 sm:text-[24px]">/hr</span>
        </div>
        <p className="mt-1 text-[12px] font-medium text-white/68 sm:mt-2 sm:text-[15px]">Guide range before final job details.</p>
      </div>

      <div className="grid grid-cols-3 border-t border-white/12">
        <div className="border-r border-white/12 px-2 py-4 text-center sm:px-4">
          <div className="mx-auto hidden h-9 w-9 place-items-center rounded-full bg-white/10 text-white sm:grid"><HomeIcon /></div>
          <p className="mt-2 text-[11px] font-semibold sm:mt-3 sm:text-[14px]">Deep Clean</p>
          <p className="mt-1 text-[13px] font-semibold sm:text-[18px]">£90 – £220</p>
          <p className="mt-0.5 text-[10px] font-bold text-white/65 sm:mt-1 sm:text-[12px]">Fixed price</p>
        </div>
        <div className="border-r border-white/12 px-2 py-4 text-center sm:px-4">
          <div className="mx-auto hidden h-9 w-9 place-items-center rounded-full bg-white/10 text-white sm:grid"><BuildingIcon /></div>
          <p className="mt-2 text-[11px] font-semibold sm:mt-3 sm:text-[14px]">End of Tenancy</p>
          <p className="mt-1 text-[13px] font-semibold sm:text-[18px]">£120 – £350+</p>
          <p className="mt-0.5 text-[10px] font-bold text-white/65 sm:mt-1 sm:text-[12px]">Fixed price</p>
        </div>
        <div className="px-2 py-4 text-center sm:px-4">
          <div className="mx-auto hidden h-9 w-9 place-items-center rounded-full bg-white/10 text-white sm:grid"><ShieldIcon /></div>
          <p className="mt-2 text-[11px] font-semibold sm:mt-3 sm:text-[14px]">Regular Clean</p>
          <p className="mt-1 text-[13px] font-semibold sm:text-[18px]">£18 – £25/hr</p>
          <p className="mt-0.5 text-[10px] font-bold text-white/65 sm:mt-1 sm:text-[12px]">Per hour</p>
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ service, area }: { service: string; area: string }) {
  return (
    <section className="rounded-[22px] border border-[#e1e6ee] bg-white p-3 shadow-[0_16px_50px_rgba(7,22,56,0.06)] sm:p-6 lg:p-7">
 

      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#08783f] sm:mt-5 sm:text-[12px]">Instant price range</p>
      <h1 className="mt-2 max-w-[650px] text-[30px] font-bold leading-[1.05] tracking-[-0.04em] text-[#071638] sm:mt-3 sm:text-[46px] lg:text-[54px]">
        Cleaning prices in <span className="text-[#08783f] underline decoration-[#08783f] decoration-[3px] underline-offset-[6px] sm:decoration-[4px] sm:underline-offset-[8px]">{area}</span>
      </h1>

      <p className="mt-3 max-w-[620px] text-[13px] font-medium leading-[1.48] text-[#172545] sm:mt-4 sm:text-[17px] sm:leading-[1.55]">
        See the fair price first, then request a checked local cleaner if you want help booking.
      </p>

      <div className="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-[#eaf8ef] px-3 py-2 text-[12px] font-semibold text-[#08783f] ring-1 ring-[#d8eddd] sm:mt-4 sm:rounded-[14px] sm:px-4 sm:py-2.5 sm:text-[13px]">
        <ShieldIcon /> No paid ranking · No quote spam
      </div>

      <div className="mt-3 sm:mt-5">
        <PriceCard />
      </div>

      <Link
        href="#match-form"
        className="mt-3 flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5 sm:hidden"
      >
        Get matched with a cleaner
        <span className="text-[24px] leading-none">→</span>
      </Link>

      <p className="mt-2 text-center text-[12px] font-medium text-[#657089] sm:hidden">
        No signup. No spam. Takes 30 seconds.
      </p>

      <div className="mt-4 hidden rounded-[16px] border border-[#dfe5ee] bg-[#fbfcfd] px-4 py-3 sm:block">
        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 text-[#08783f]"><TagIcon /></span>
          <p className="text-[14px] font-bold leading-[1.55] text-[#44506a]">
            Final price can change slightly after property size, condition, parking, access and urgency are confirmed.
          </p>
        </div>
      </div>

      <div className="mt-5 hidden sm:block">
        <h2 className="text-center text-[18px] font-semibold tracking-[-0.015em] text-[#071638]">Why people use Quickola</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Checked cleaners only", <ShieldIcon key="a" />],
            ["Fair prices upfront", <TagIcon key="b" />],
            ["No obligation", <CalendarIcon key="c" />],
            ["Details stay private", <MailIcon key="d" />],
          ].map(([text, icon]) => (
            <div key={String(text)} className="rounded-[18px] border border-[#edf0f5] bg-white p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f0faf3] text-[#08783f] ring-1 ring-[#d8eddd]">{icon}</div>
              <p className="mt-3 text-[13px] font-semibold leading-[1.35] text-[#071638]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailsForm({ serviceSlug, areaSlug, service, area }: { serviceSlug: string; areaSlug: string; service: string; area: string }) {
  return (
    <aside id="match-form" className="scroll-mt-[86px] rounded-[24px] border border-[#e1e6ee] bg-white p-4 shadow-[0_16px_50px_rgba(7,22,56,0.06)] sm:p-5 lg:sticky lg:top-[84px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        {["1", "2", "3"].map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold ${index === 0 ? "bg-[#071638] text-white" : "bg-[#eef3f7] text-[#40607e]"}`}>
              {step}
            </span>
            {index < 2 ? <span className="h-[2px] flex-1 rounded-full bg-[#dfe5ee]" /> : null}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-[25px] font-bold leading-[1.08] tracking-[-0.035em] text-[#071638]">
          Get your <span className="text-[#08783f]">best match</span>
        </h2>
        <p className="mt-1 text-[13px] font-medium text-[#657089]">Takes around 30 seconds</p>
      </div>

      <form action="/results" method="GET" className="mt-5 space-y-3">
        <input type="hidden" name="service" value={serviceSlug} />
        <input type="hidden" name="area" value={areaSlug} />
        <input type="hidden" name="source" value="check-price" />

        <SelectField label="What type of clean?" name="cleaning_type" options={cleaningTypes} icon={<HomeIcon />} defaultValue={serviceSlug.includes("end-of-tenancy") ? "end-of-tenancy" : "regular-clean"} />
        <SelectField label="Property type" name="property_type" options={propertyTypes} icon={<BuildingIcon />} />
        <SelectField label="How many bedrooms?" name="bedrooms" options={bedroomOptions} icon={<BedIcon />} defaultValue="2-bedrooms" />
        <SelectField label="When do you need it?" name="time_needed" options={urgencyOptions} icon={<CalendarIcon />} />
        <TextInput label="Your email" name="email" type="email" placeholder="you@example.com" icon={<MailIcon />} required />
        <p className="-mt-2 text-[12px] font-bold text-[#08783f]">We’ll send your best matches here.</p>
        <TextInput label="Phone (optional)" name="phone" type="tel" placeholder="07xxx xxxxxx" icon={<PhoneIcon />} />
        <p className="-mt-2 text-[12px] font-bold text-[#08783f]">Faster updates on WhatsApp/SMS later.</p>

        <button
          type="submit"
          className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
        >
          Request my match
          <span className="text-[28px] leading-none">→</span>
        </button>

        <p className="text-center text-[12px] font-medium text-[#657089]">No spam. No public posting. No paid ranking.</p>
      </form>

      <div className="mt-4 rounded-[18px] border border-[#dcebe1] bg-[#f7fcf8] p-4">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#08783f] text-white"><ShieldIcon /></span>
          <div>
            <p className="text-[17px] font-semibold text-[#071638]">Your details stay private</p>
            <p className="mt-1 text-[14px] font-medium leading-[1.5] text-[#44506a]">We use your details only to help with this {service.toLowerCase()} request in {area}.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WhatHappensNext() {
  const steps = [
    ["1", "We receive your request", "Takes 10 seconds"],
    ["2", "We find suitable cleaners", "Manual match while we launch"],
    ["3", "You choose who to book", "No obligation"],
  ];

  return (
    <section className="mx-auto mt-5 max-w-[1220px] rounded-[26px] border border-[#e1e6ee] bg-white p-5 shadow-[0_18px_50px_rgba(7,22,56,0.05)] sm:p-7">
      <h2 className="text-center text-[24px] font-semibold tracking-[-0.02em] text-[#071638]">What happens next?</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(([number, title, text]) => (
          <div key={title} className="rounded-[18px] border border-[#edf0f5] bg-[#fbfcfd] p-5 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f0faf3] text-[15px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">{number}</span>
            <p className="mt-4 text-[16px] font-black text-[#071638]">{title}</p>
            <p className="mt-1 text-[13px] font-bold text-[#657089]">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PopularSearches() {
  return (
    <div className="mx-auto mt-5 max-w-[1220px] rounded-[20px] border border-[#e1e6ee] bg-white p-4 shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-[16px] font-semibold text-[#071638]">Popular East London searches</h2>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((item) => (
            <Link
              key={item.label}
              href={`/check-price?service=${item.service}&area=${item.area}`}
              className="inline-flex h-10 min-w-0 items-center rounded-full border border-[#e1e6ee] bg-white px-4 text-[13px] font-medium text-[#071638] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CheckPricePage({ searchParams }: CheckPricePageProps) {
  const params = await searchParams;
  const service = formatParam(params?.service, "Cleaning");
  const area = formatParam(params?.area, "Ilford");
  const serviceSlug = slugify(service);
  const areaSlug = slugify(area);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f8fb] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#071638] transition hover:text-[#08783f] sm:gap-3 sm:text-[14px]">
          <span className="text-[#08783f]">←</span>
          Back to home
        </Link>

        <div className="mt-3 grid gap-4 lg:mt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(370px,0.95fr)] lg:items-start">
          <LeftPanel service={service} area={area} />
          <DetailsForm serviceSlug={serviceSlug} areaSlug={areaSlug} service={service} area={area} />
        </div>

        <WhatHappensNext />
        <PopularSearches />
      </section>

      <Footer />
    </main>
  );
}