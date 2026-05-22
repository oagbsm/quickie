
import type { ReactNode } from "react";
import { createBusiness } from "../actions";
import Footer from "../components/Footer";
type FieldOption = {
  label: string;
  value: string;
};

const categories: FieldOption[] = [
  { label: "Man and Van", value: "man-and-van" },
  { label: "Removals", value: "removals" },
  { label: "Cleaning", value: "cleaning" },
  { label: "End of Tenancy Cleaning", value: "end-of-tenancy-cleaning" },
  { label: "Deep Cleaning", value: "deep-cleaning" },
  { label: "Carpet Cleaning", value: "carpet-cleaning" },
  { label: "Oven Cleaning", value: "oven-cleaning" },
  { label: "Handyman", value: "handyman" },
  { label: "Plumber", value: "plumber" },
  { label: "Emergency Plumber", value: "emergency-plumber" },
  { label: "Electrician", value: "electrician" },
  { label: "Locksmith", value: "locksmith" },
  { label: "Gardener", value: "gardener" },
  { label: "Waste Removal", value: "waste-removal" },
  { label: "Boiler Repair", value: "boiler-repair" },
  { label: "MOT and Car Repairs", value: "mot-car-repairs" },
  { label: "Tyres", value: "tyres" },
];

const areas = ["SL1", "SL2", "SL3"];


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
          <a href="/" className="transition hover:text-[#08783f]">For customers</a>
          <a href="#how" className="transition hover:text-[#08783f]">How it works</a>
          <a href="#signup" className="transition hover:text-[#08783f]">Join free</a>
        </nav>
        <a
          href="#signup"
          className="hidden h-[46px] items-center justify-center rounded-[11px] bg-[#071638] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(7,22,56,0.16)] transition hover:-translate-y-0.5 sm:flex"
        >
          Apply to join
        </a>
        <a href="#signup" aria-label="Apply to join" className="grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-[#071638] text-[22px] leading-none text-white sm:hidden">
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

function ProofPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.06)] ring-1 ring-[#dfe5ee]">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f1faf3] text-[#08783f]"><TickIcon /></span>
      {children}
    </span>
  );
}

function BenefitCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-[#e1e6ee] bg-white p-5 shadow-[0_16px_40px_rgba(7,22,56,0.06)]">
      <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#f1faf3] text-[#08783f] ring-1 ring-[#d8eddd]">{icon}</span>
      <h3 className="mt-5 text-[18px] font-extrabold leading-tight text-[#071638]">{title}</h3>
      <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#44506a]">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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

function Select({
  children,
  name,
  defaultValue = "",
  required = true,
}: {
  children: ReactNode;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      required={required}
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
      <input
        type="checkbox"
        name="areas"
        value={area.toUpperCase()}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-flex h-[38px] items-center rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3.5 text-[12px] font-extrabold text-[#7a8496] opacity-70 transition peer-checked:border-[#08783f] peer-checked:bg-[#08783f] peer-checked:text-white peer-checked:opacity-100 peer-checked:shadow-[0_8px_18px_rgba(8,120,63,0.18)]">
        {area}
      </span>
    </label>
  );
}

function SignupForm() {
  return (
    <form id="signup" action={createBusiness} className="scroll-mt-[96px] rounded-[26px] border border-[#dcebe1] bg-white p-5 shadow-[0_26px_80px_rgba(7,22,56,0.11)] sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] pb-5">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#08783f]">Provider applications</p>
          <h2 className="mt-2 text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#071638] sm:text-[34px]">Apply to become a selected Quickola provider in Slough.</h2>
        </div>
        <span className="hidden rounded-full bg-[#f1faf3] px-4 py-2 text-[13px] font-extrabold text-[#08783f] ring-1 ring-[#d8eddd] sm:inline-flex">Selected providers only</span>
      </div>

      <input type="hidden" name="source" value="selected-provider-application-slough" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Business name">
          <Input name="businessName" placeholder="e.g. Slough Van Man" autoComplete="organization" required />
        </Field>

        <Field label="Service you offer">
          <div className="relative">
            <Select name="category">
              <option value="" disabled>Choose your main service</option>
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
            <input name="whatsapp" inputMode="tel" autoComplete="tel" pattern="^(?:0|\\+44)[0-9 ]{9,14}$" title="Enter a valid UK phone number, for example 07123 456789" placeholder="07123 456789" required className="min-w-0 flex-1 px-4 text-[15px] font-semibold text-[#071638] outline-none placeholder:text-[#8b94a7]" />
          </div>
        </Field>

        <Field label="Business postcode">
          <Input
            name="postcode"
            placeholder="e.g. SL1 1AA"
            autoComplete="postal-code"
            required
            pattern="^SL[123]\\s?[0-9][A-Z]{2}$"
            title="Enter a valid Slough postcode starting with SL1, SL2 or SL3, for example SL1 1AA"
            className="uppercase"
          />
        </Field>

        <Field label="Starting price from (optional)">
          <div className="flex h-[52px] overflow-hidden rounded-[12px] border border-[#dfe5ee] bg-white focus-within:border-[#98d7ad] focus-within:ring-4 focus-within:ring-[#e8f7ed]">
            <div className="grid w-[48px] place-items-center border-r border-[#dfe5ee] text-[17px] font-extrabold text-[#071638]">£</div>
            <input name="startingPrice" inputMode="decimal" min="0" step="1" placeholder="e.g. 65" className="min-w-0 flex-1 px-4 text-[15px] font-semibold text-[#071638] outline-none placeholder:text-[#8b94a7]" />
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <p className="mb-1 text-[14px] font-extrabold text-[#071638]">Postcode areas you cover</p>
        <p className="mb-3 text-[12px] font-bold leading-[1.4] text-[#657089]">
          Enter your business postcode above, then choose the Slough postcode prefixes you actually cover. Example: SL1 matches SL1 1AA.
        </p>
        <details className="rounded-[16px] border border-[#dfe5ee] bg-[#fbfcfd] p-3">
          <summary className="cursor-pointer list-none text-[13px] font-extrabold text-[#08783f] [&::-webkit-details-marker]:hidden">
            Choose Slough postcode areas
          </summary>
          <div className="mt-3 flex max-h-[190px] flex-wrap gap-2 overflow-y-auto pr-1">
            {areas.map((area, index) => <AreaChip key={area} area={area} defaultChecked={index === 0} />)}
          </div>
          <p className="mt-3 text-[11px] font-bold text-[#9aa4b5]">
            Selected areas turn green. Only Slough areas are being accepted at launch.
          </p>
        </details>
        <label className="mt-4 block">
          <span className="mb-2 block text-[13px] font-extrabold text-[#071638]">Add other postcode areas</span>
          <input
            name="areasCustom"
            placeholder="Only use SL1, SL2 or SL3"
            pattern="^(?:\\s*SL[123]\\s*,?\\s*)*$"
            title="Only SL1, SL2 and SL3 are accepted at launch. Separate multiple areas with commas."
            className="h-[48px] w-full rounded-[12px] border border-[#dfe5ee] bg-white px-4 text-[14px] font-semibold uppercase text-[#071638] outline-none transition placeholder:normal-case placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
          />
          <span className="mt-2 block text-[11px] font-bold leading-[1.4] text-[#9aa4b5]">
            This is for extra coverage areas only. Your main business postcode above is required.
          </span>
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Availability">
          <div className="relative">
            <Select name="availability">
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
          <Input name="profileSlug" placeholder="e.g. slough-van-man" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title="Use lowercase letters, numbers and hyphens only, for example slough-van-man" />
        </Field>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-[14px] font-extrabold text-[#071638]">Short description</span>
        <textarea
          name="description"
          maxLength={180}
          required
          placeholder="Tell customers what service you offer, which areas you cover and when you are usually available."
          className="h-[104px] w-full resize-none rounded-[12px] border border-[#dfe5ee] bg-white px-4 py-3 text-[15px] font-semibold text-[#071638] outline-none transition placeholder:text-[#8b94a7] focus:border-[#98d7ad] focus:ring-4 focus:ring-[#e8f7ed]"
        />
      </label>

      <button type="submit" className="mt-6 flex h-[58px] w-full items-center justify-center gap-4 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[18px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.24)] transition hover:-translate-y-0.5">
        Apply to join Quickola
        <span className="text-[28px] leading-none">→</span>
      </button>

      <div className="mt-5 grid gap-3 text-[13px] font-bold text-[#44506a] sm:grid-cols-3">
        <span className="flex items-center gap-2"><span className="text-[#08783f]"><TickIcon /></span>Manual approval</span>
        <span className="flex items-center gap-2"><span className="text-[#08783f]"><TickIcon /></span>Free to apply</span>
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
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[18px] bg-white text-[28px]">⚡</span>
            <div>
              <h3 className="text-[24px] font-extrabold leading-none tracking-[-0.025em]">Local Service Provider</h3>
              <p className="mt-2 text-[14px] font-semibold text-white/70">Slough · Man and Van · Cleaning</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-[#f6fcf8] p-4 ring-1 ring-[#d8eddd]">
              <p className="text-[12px] font-bold text-[#657089]">From</p>
              <p className="mt-1 text-[24px] font-extrabold text-[#08783f]">£40</p>
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
              <span className="text-[14px] font-bold text-[#44506a]">Provider alerts</span>
              <span className="text-[14px] font-extrabold text-[#071638]">WhatsApp</span>
            </div>
          </div>

          <button className="mt-5 h-[50px] w-full rounded-[13px] bg-[#08783f] text-[16px] font-extrabold text-white">Example only</button>
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
              Selected Slough providers
            </div>

            <h1 className="mt-6 max-w-[680px] text-[46px] font-extrabold leading-[0.98] tracking-[-0.04em] text-[#071638] sm:text-[62px] lg:text-[72px]">
              Become a selected Quickola provider in Slough.
            </h1>

            <p className="mt-6 max-w-[600px] text-[18px] font-semibold leading-[1.55] text-[#44506a] sm:text-[20px]">
              Quickola is building a trusted Slough provider network for fair-price customer requests. Apply to be reviewed and considered for suitable WhatsApp request alerts.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ProofPill>Slough provider network</ProofPill>
              <ProofPill>Application reviewed</ProofPill>
              <ProofPill>No paid ranking</ProofPill>
              <ProofPill>WhatsApp request alerts</ProofPill>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#signup" className="inline-flex h-[58px] items-center justify-center gap-4 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-7 text-[18px] font-extrabold text-white shadow-[0_16px_34px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5">
                Apply to join
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
          <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#071638] sm:text-[48px]">Join a curated Slough provider network.</h2>
          <p className="mt-4 max-w-[620px] text-[17px] font-semibold leading-[1.55] text-[#44506a]">
            Quickola is built around fair local pricing, not messy directories or paid ranking. Providers are reviewed before being added, so the Slough network stays useful, local and trusted.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <BenefitCard icon={<PriceIcon />} title="Stand out with clear pricing" text="Add a starting price so customers understand your rough range before they decide who to continue with." />
            <BenefitCard icon={<RequestIcon />} title="Receive suitable Slough requests" text="Approved providers can receive relevant WhatsApp alerts for the services and Slough postcode areas they cover." />
            <BenefitCard icon={<ShieldIcon />} title="No paid ranking" text="Quickola is not selling top spots. Visibility is based on fit, response speed, clear pricing and customer feedback." />
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
            <HowStep number="1" title="Apply to join" text="Add your business name, main service, WhatsApp number, starting price and the Slough postcode areas you cover." />
            <HowStep number="2" title="We review your details" text="Quickola reviews provider applications before adding businesses to the Slough network." />
            <HowStep number="3" title="Receive suitable requests" text="When a Slough customer request fits your service, Quickola can send the details by WhatsApp so you can reply with price and availability." />
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-[50px] lg:py-14">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-6 rounded-[28px] bg-[#071638] p-6 text-center text-white shadow-[0_26px_80px_rgba(7,22,56,0.18)] sm:p-8 lg:flex-row lg:text-left">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-white/60">Ready when you are</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[46px]">Apply to join the Slough provider network.</h2>
            <p className="mt-3 max-w-[620px] text-[16px] font-semibold leading-[1.5] text-white/72">Free to apply. No paid ranking. No long contract. Selected Slough providers only.</p>
          </div>
          <a href="#signup" className="inline-flex h-[58px] shrink-0 items-center justify-center gap-4 rounded-[13px] bg-white px-7 text-[18px] font-extrabold text-[#071638] transition hover:-translate-y-0.5">
            Apply now
            <span className="text-[28px] leading-none text-[#08783f]">→</span>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}