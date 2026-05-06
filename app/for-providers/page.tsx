

import { createBusiness } from "../actions";
import Footer from "../components/Footer";
type FieldOption = {
  label: string;
  value: string;
};

const categories: FieldOption[] = [
  { label: "End of tenancy cleaning", value: "end-of-tenancy-cleaning" },
  { label: "Regular cleaning", value: "regular-cleaning" },
  { label: "Deep cleaning", value: "deep-cleaning" },
  { label: "Man and van", value: "man-and-van" },
  { label: "Removals", value: "removals" },
  { label: "Plumber", value: "plumber" },
  { label: "Electrician", value: "electrician" },
  { label: "Locksmith", value: "locksmith" },
  { label: "Handyman", value: "handyman" },
  { label: "Gardener", value: "gardener" },
  { label: "Pest control", value: "pest-control" },
  { label: "Painter / decorator", value: "painter-decorator" },
  { label: "Carpet cleaning", value: "carpet-cleaning" },
  { label: "Oven cleaning", value: "oven-cleaning" },
  { label: "Waste removal", value: "waste-removal" },
];

const areas = ["Ilford", "Barking", "East Ham", "Stratford", "Leyton", "Walthamstow", "Romford", "Dagenham", "Forest Gate", "Wanstead"];

const testBusinesses = [
  {
    businessName: "East London Van Man",
    category: "man-and-van",
    whatsapp: "07123 456789",
    startingPrice: "65",
    availability: "same-day",
    profileSlug: "east-london-van-man",
    description: "Man and van service for small moves, collections and deliveries across East London.",
    areas: ["Ilford", "Barking", "Stratford"],
  },
  {
    businessName: "Ilford Emergency Plumber",
    category: "plumber",
    whatsapp: "07333 888999",
    startingPrice: "80",
    availability: "same-day",
    profileSlug: "ilford-emergency-plumber",
    description: "Local plumber covering leaks, repairs and urgent callouts across Ilford, Barking and East Ham.",
    areas: ["Ilford", "Barking", "East Ham"],
  },
  {
    businessName: "Stratford Locksmiths",
    category: "locksmith",
    whatsapp: "07444 222111",
    startingPrice: "70",
    availability: "same-day",
    profileSlug: "stratford-locksmiths",
    description: "Locksmith for lockouts, lock changes and urgent home access across Stratford and nearby areas.",
    areas: ["Stratford", "Leyton", "Forest Gate"],
  },
  {
    businessName: "Barking End Of Tenancy Clean",
    category: "end-of-tenancy-cleaning",
    whatsapp: "07999 123456",
    startingPrice: "120",
    availability: "next-day",
    profileSlug: "barking-end-of-tenancy-clean",
    description: "End of tenancy and deep cleaning for flats and houses across Barking, Ilford and Dagenham.",
    areas: ["Barking", "Ilford", "Dagenham"],
  },
];

function getRandomTestBusiness() {
  return testBusinesses[Math.floor(Math.random() * testBusinesses.length)];
}

function Logo() {
  return (
    <a href="/" className="flex items-center gap-3" aria-label="Quickola home">
      <img
        src="/quickola/logo-mark.png"
        alt="Quickola"
        className="h-[42px] w-[42px] rounded-full object-contain"
      />
      <span className="text-[32px] font-extrabold leading-none tracking-[-0.018em] text-[#071638]">
        Quickola
      </span>
    </a>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 h-[76px] border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-[50px]">
        <Logo />
        <nav className="hidden items-center gap-10 text-[15px] font-semibold text-[#172545] lg:flex">
          <a href="/" className="transition hover:text-[#08783f]">Customers</a>
          <a href="#how" className="transition hover:text-[#08783f]">How it works</a>
          <a href="#signup" className="transition hover:text-[#08783f]">Join free</a>
        </nav>
        <a
          href="#signup"
          className="hidden h-[46px] items-center justify-center rounded-[11px] bg-[#071638] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(7,22,56,0.16)] transition hover:-translate-y-0.5 sm:flex"
        >
          Create provider profile
        </a>
        <a href="#signup" aria-label="Create free profile" className="grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-[#071638] text-[22px] leading-none text-white sm:hidden">
          →
        </a>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 5.5 6v5.2c0 4 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5.1 6.5-9.1V6L12 3.5Z" />
      <path d="m8.8 12 2 2 4.3-4.6" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 6.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z" />
      <path d="M10 16.5h4" />
    </svg>
  );
}

function RequestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 6.5h14a1.7 1.7 0 0 1 1.7 1.7v7a1.7 1.7 0 0 1-1.7 1.7h-7l-4.4 3v-3H5a1.7 1.7 0 0 1-1.7-1.7v-7A1.7 1.7 0 0 1 5 6.5Z" />
      <path d="M8 11.5h8M8 14.5h5" />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.2 12.2 12 20.4a2.1 2.1 0 0 1-3 0L3.6 15a2.1 2.1 0 0 1 0-3L11.8 3.8h6.4v6.4Z" />
      <path d="M15.8 7.8h.01" />
    </svg>
  );
}

function ProofPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.06)] ring-1 ring-[#dfe5ee]">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f1faf3] text-[#08783f]"><TickIcon /></span>
      {children}
    </span>
  );
}

function BenefitCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-[#e1e6ee] bg-white p-5 shadow-[0_16px_40px_rgba(7,22,56,0.06)]">
      <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#f1faf3] text-[#08783f] ring-1 ring-[#d8eddd]">{icon}</span>
      <h3 className="mt-5 text-[18px] font-extrabold leading-tight text-[#071638]">{title}</h3>
      <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#44506a]">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-extrabold text-[#071638]">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-[52px] w-full rounded-[12px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold text-[#071638] outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
    />
  );
}

function Select({ children, name, defaultValue = "" }: { children: React.ReactNode; name: string; defaultValue?: string }) {
  return (
    <select
      name={name}
      className="h-[52px] w-full appearance-none rounded-[12px] border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold text-[#071638] outline-none transition focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
      defaultValue={defaultValue}
    >
      {children}
    </select>
  );
}

function AreaChip({ area, defaultChecked = false }: { area: string; defaultChecked?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name="areas" value={area.toLowerCase().replace(/\s+/g, "-")} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex h-[40px] items-center rounded-full border border-[#dfe5ee] bg-white px-4 text-[13px] font-extrabold text-[#071638] transition peer-checked:border-[#98d7ad] peer-checked:bg-[#f1faf3] peer-checked:text-[#08783f]">
        {area}
      </span>
    </label>
  );
}

function SignupForm() {
  const testBusiness = getRandomTestBusiness();
  return (
    <form id="signup" action={createBusiness} className="scroll-mt-[96px] rounded-[26px] border border-[#dcebe1] bg-white p-5 shadow-[0_26px_80px_rgba(7,22,56,0.11)] sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] pb-5">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#08783f]">Free provider profile</p>
          <h2 className="mt-2 text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#071638] sm:text-[34px]">Join Quickola as a local provider in under 60 seconds.</h2>
        </div>
        <span className="hidden rounded-full bg-[#f1faf3] px-4 py-2 text-[13px] font-extrabold text-[#08783f] ring-1 ring-[#d8eddd] sm:inline-flex">No contracts</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Business name">
          <Input name="businessName" placeholder="e.g. East London Van Man" defaultValue={testBusiness.businessName} required />
        </Field>

        <Field label="Service you offer">
          <div className="relative">
            <Select name="category" defaultValue={testBusiness.category}>
              <option value="" disabled>Choose category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </Select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b94a7]">⌄</span>
          </div>
        </Field>

        <Field label="WhatsApp number">
          <div className="flex h-[52px] overflow-hidden rounded-[12px] border border-[#dfe5ee] bg-white focus-within:border-[#98d7ad] focus-within:ring-4 focus-within:ring-[#e8f7ed]">
            <div className="grid w-[58px] place-items-center border-r border-[#dfe5ee] text-[#08783f]"><PhoneIcon /></div>
            <input name="whatsapp" inputMode="tel" placeholder="07123 456789" defaultValue={testBusiness.whatsapp} required className="min-w-0 flex-1 px-4 text-[15px] font-semibold text-[#071638] outline-none placeholder:text-[#8b94a7]" />
          </div>
        </Field>

        <Field label="Starting price from">
          <div className="flex h-[52px] overflow-hidden rounded-[12px] border border-[#dfe5ee] bg-white focus-within:border-[#98d7ad] focus-within:ring-4 focus-within:ring-[#e8f7ed]">
            <div className="grid w-[48px] place-items-center border-r border-[#dfe5ee] text-[17px] font-extrabold text-[#071638]">£</div>
            <input name="startingPrice" inputMode="decimal" placeholder="e.g. 45" defaultValue={testBusiness.startingPrice} className="min-w-0 flex-1 px-4 text-[15px] font-semibold text-[#071638] outline-none placeholder:text-[#8b94a7]" />
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-[14px] font-extrabold text-[#071638]">Areas you cover</p>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => <AreaChip key={area} area={area} defaultChecked={testBusiness.areas.includes(area)} />)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Availability">
          <div className="relative">
            <Select name="availability" defaultValue={testBusiness.availability}>
              <option value="" disabled>Choose availability</option>
              <option value="same-day">Same day jobs</option>
              <option value="next-day">Next day jobs</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="flexible">Flexible</option>
            </Select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b94a7]">⌄</span>
          </div>
        </Field>

        <Field label="Profile link name">
          <Input name="profileSlug" placeholder="e.g. barking-cleaners" defaultValue={testBusiness.profileSlug} />
        </Field>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-[14px] font-extrabold text-[#071638]">Short description</span>
        <textarea
          name="description"
          maxLength={180}
          defaultValue={testBusiness.description}
          placeholder="Tell customers what service you offer, which areas you cover and when you are usually available."
          className="h-[104px] w-full resize-none rounded-[12px] border border-[#dfe5ee] bg-white px-4 py-3 text-[15px] font-semibold text-[#071638] outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
        />
      </label>

      <button type="submit" className="mt-6 flex h-[58px] w-full items-center justify-center gap-4 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[18px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.24)] transition hover:-translate-y-0.5">
        Create free provider profile
        <span className="text-[28px] leading-none">→</span>
      </button>

      <div className="mt-5 grid gap-3 text-[13px] font-bold text-[#44506a] sm:grid-cols-3">
        <span className="flex items-center gap-2"><span className="text-[#08783f]"><TickIcon /></span>No setup fee</span>
        <span className="flex items-center gap-2"><span className="text-[#08783f]"><TickIcon /></span>No monthly fee</span>
        <span className="flex items-center gap-2"><span className="text-[#08783f]"><TickIcon /></span>No paid ranking</span>
      </div>
    </form>
  );
}

function ProfilePreview() {
  return (
    <div className="relative mx-auto max-w-[430px] lg:mx-0">
      <div className="absolute -right-5 -top-5 h-[120px] w-[120px] rounded-full bg-[#e8f7ed] blur-sm" />
      <div className="absolute -bottom-6 -left-6 h-[140px] w-[140px] rounded-full bg-[#edf3ff] blur-sm" />
      <div className="relative overflow-hidden rounded-[30px] border border-[#dfe5ee] bg-white shadow-[0_28px_80px_rgba(7,22,56,0.16)]">
        <div className="bg-[#071638] p-6 text-white">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-white/60">Example provider profile</p>
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[18px] bg-white text-[28px]">🧼</span>
            <div>
              <h3 className="text-[24px] font-extrabold leading-none tracking-[-0.025em]">East London Van Man</h3>
              <p className="mt-2 text-[14px] font-semibold text-white/70">Man and van · Ilford, Barking, Stratford</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-[#f6fcf8] p-4 ring-1 ring-[#d8eddd]">
              <p className="text-[12px] font-bold text-[#657089]">From</p>
              <p className="mt-1 text-[24px] font-extrabold text-[#08783f]">£45</p>
            </div>
            <div className="rounded-[16px] bg-[#fbfcfd] p-4 ring-1 ring-[#e1e6ee]">
              <p className="text-[12px] font-bold text-[#657089]">Availability</p>
              <p className="mt-1 text-[18px] font-extrabold text-[#071638]">Today</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-[14px] border border-[#edf0f5] px-4 py-3">
              <span className="text-[14px] font-bold text-[#44506a]">Ranking rule</span>
              <span className="text-[14px] font-extrabold text-[#08783f]">No paid boost</span>
            </div>
            <div className="flex items-center justify-between rounded-[14px] border border-[#edf0f5] px-4 py-3">
              <span className="text-[14px] font-bold text-[#44506a]">Customer contact</span>
              <span className="text-[14px] font-extrabold text-[#071638]">WhatsApp</span>
            </div>
          </div>

          <button className="mt-5 h-[50px] w-full rounded-[13px] bg-[#08783f] text-[16px] font-extrabold text-white">Request this provider</button>
        </div>
      </div>
    </div>
  );
}

function HowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="relative rounded-[20px] border border-[#e1e6ee] bg-white p-5 shadow-[0_14px_34px_rgba(7,22,56,0.05)]">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#08783f] text-[15px] font-extrabold text-white">{number}</span>
      <h3 className="mt-5 text-[18px] font-extrabold text-[#071638]">{title}</h3>
      <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#44506a]">{text}</p>
    </div>
  );
}

export default function ForProvidersPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="relative overflow-hidden border-b border-[#e4e8ef] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf8_100%)]">
        <div className="absolute -right-[160px] top-[80px] h-[360px] w-[360px] rounded-full bg-[#dff4e6] opacity-70" />
        <div className="absolute -left-[180px] bottom-[-150px] h-[360px] w-[360px] rounded-full bg-[#edf3ff] opacity-80" />

        <div className="relative mx-auto grid max-w-[1320px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-[50px] lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.07em] text-[#08783f] shadow-[0_10px_24px_rgba(7,22,56,0.06)] ring-1 ring-[#d8eddd]">
              <ShieldIcon />
              Free provider signup
            </div>

            <h1 className="mt-6 max-w-[680px] text-[46px] font-extrabold leading-[0.98] tracking-[-0.04em] text-[#071638] sm:text-[62px] lg:text-[72px]">
              Get local service requests without paying to rank.
            </h1>

            <p className="mt-6 max-w-[600px] text-[18px] font-semibold leading-[1.55] text-[#44506a] sm:text-[20px]">
              Create a free Quickola provider profile so nearby customers can see your service, areas covered, starting price and availability before they contact you.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ProofPill>No monthly fee</ProofPill>
              <ProofPill>No paid ranking</ProofPill>
              <ProofPill>No long contract</ProofPill>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#signup" className="inline-flex h-[58px] items-center justify-center gap-4 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[18px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5">
                Create free profile
                <span className="text-[28px] leading-none">→</span>
              </a>
              <a href="#how" className="inline-flex h-[58px] items-center justify-center rounded-[13px] border border-[#cfd6e2] bg-white px-7 text-[17px] font-extrabold text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5">
                See how it works
              </a>
            </div>
          </div>

          <SignupForm />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-[50px] lg:py-14">
        <ProfilePreview />

        <div className="flex flex-col justify-center">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#08783f]">Why providers join</p>
          <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[48px]">A profile built for real local service jobs.</h2>
          <p className="mt-4 max-w-[620px] text-[17px] font-semibold leading-[1.55] text-[#44506a]">
            Customers do not want a messy directory. They want to know which provider is available, what a fair price looks like and who they can contact quickly.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <BenefitCard icon={<PriceIcon />} title="Show clear starting prices" text="Add a starting price so customers understand your range before messaging." />
            <BenefitCard icon={<RequestIcon />} title="Get matched local requests" text="Receive relevant requests for the services and areas you actually cover." />
            <BenefitCard icon={<ShieldIcon />} title="Fair ranking" text="Provider ranking is not sold to the highest bidder. Clear profiles win trust." />
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[#e4e8ef] bg-white px-5 py-10 sm:px-8 lg:px-[50px] lg:py-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-[680px]">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#08783f]">How it works</p>
            <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[48px]">Simple enough to join today.</h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <HowStep number="1" title="Create your free provider profile" text="Add your business name, service, area, WhatsApp, price and availability." />
            <HowStep number="2" title="We match relevant local requests" text="Customers searching in your area can be matched to providers that fit the job." />
            <HowStep number="3" title="You choose what to accept" text="Start free, keep control and only respond to jobs that make sense for you." />
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-[50px] lg:py-14">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-6 rounded-[28px] bg-[#071638] p-6 text-center text-white shadow-[0_26px_80px_rgba(7,22,56,0.18)] sm:p-8 lg:flex-row lg:text-left">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-white/60">Ready when you are</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[46px]">Create your Quickola provider profile.</h2>
            <p className="mt-3 max-w-[620px] text-[16px] font-semibold leading-[1.5] text-white/72">Start free. No monthly fee. No paid ranking. No long contract.</p>
          </div>
          <a href="#signup" className="inline-flex h-[58px] shrink-0 items-center justify-center gap-4 rounded-[13px] bg-white px-7 text-[18px] font-extrabold text-[#071638] transition hover:-translate-y-0.5">
            Join as a provider
            <span className="text-[28px] leading-none text-[#08783f]">→</span>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}