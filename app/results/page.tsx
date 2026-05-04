import { createRequest } from "../actions";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    saved?: string;
  }>;
};

type PriceRange = {
  low: number;
  high: number;
  note: string;
};

const fairPrices: Record<string, PriceRange> = {
  cleaner: {
    low: 45,
    high: 90,
    note: "For a standard local clean. Size, condition and urgency can change the final price.",
  },
  "end-of-tenancy-clean": {
    low: 120,
    high: 240,
    note: "For flats and small houses. Appliances, carpets and condition can change the final price.",
  },
  "end-of-tenancy-cleaning": {
    low: 120,
    high: 240,
    note: "For flats and small houses. Appliances, carpets and condition can change the final price.",
  },
  "man-with-van": {
    low: 55,
    high: 140,
    note: "For local moves. Distance, stairs, loading time and item count can change the final price.",
  },
  "furniture-removal": {
    low: 55,
    high: 150,
    note: "For local furniture removals. Item size, stairs and distance can change the final price.",
  },
  "plumber-emergency": {
    low: 80,
    high: 180,
    note: "For callouts. Timing, parts and job complexity can change the final price.",
  },
  plumber: {
    low: 70,
    high: 160,
    note: "For common plumbing jobs. Parts, timing and complexity can change the final price.",
  },
  "small-move": {
    low: 70,
    high: 170,
    note: "For small local moves. Distance, stairs, loading time and items can change the final price.",
  },
};

function formatParam(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1080px] items-center justify-between px-4 sm:min-h-[70px] sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <img src="/quickola/logo-mark.png" alt="Quickola" className="h-9 w-9 shrink-0 rounded-full object-contain" />
          <span className="text-[24px] font-extrabold leading-none tracking-[-0.04em] text-[#071638] sm:text-[29px]">
            Quickola
          </span>
        </a>

        <a
          href="/"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe5ee] bg-white px-4 text-[14px] font-extrabold text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
        >
          New search
        </a>
      </div>
    </header>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.6]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6.5 12.3 3.4 3.5 7.6-8" />
    </svg>
  );
}

function PriceHero({ service, area, price }: { service: string; area: string; price: PriceRange }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#dcebe1] bg-white shadow-[0_18px_44px_rgba(7,22,56,0.07)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
        <div className="relative p-5 sm:p-6 lg:p-7">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#e8f7ed]" />
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f0faf3] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#08783f] ring-1 ring-[#d8eddd]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#08783f] text-white">
                <CheckIcon />
              </span>
              Fair price checked
            </p>

            <h1 className="mt-4 max-w-[650px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.035em] text-[#071638] sm:text-[54px] lg:text-[60px]">
              £{price.low}–£{price.high}
            </h1>

            <p className="mt-3 max-w-[620px] text-[18px] font-bold leading-[1.28] tracking-[-0.01em] text-[#071638] sm:text-[22px]">
              Fair range for {service} in <span className="text-[#08783f]">{area}</span>
            </p>

            <p className="mt-3 max-w-[590px] text-[15px] font-semibold leading-[1.55] text-[#556177] sm:text-[16px]">
              {price.note}
            </p>
          </div>
        </div>

        <div className="border-t border-[#e8edf3] bg-[#fbfcfd] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.07em] text-[#657089]">Your search</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[16px] bg-white p-4 ring-1 ring-[#edf0f5]">
              <p className="text-[12px] font-bold text-[#657089]">Service</p>
              <p className="mt-1 text-[16px] font-extrabold text-[#071638]">{service}</p>
            </div>
            <div className="rounded-[16px] bg-white p-4 ring-1 ring-[#edf0f5]">
              <p className="text-[12px] font-bold text-[#657089]">Area</p>
              <p className="mt-1 text-[16px] font-extrabold text-[#071638]">{area}</p>
            </div>
          </div>
          <a
            href={`/check-price?service=${slugify(service, "cleaner")}&area=${slugify(area, "ilford")}`}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#cfd6e2] bg-white px-4 text-[14px] font-extrabold text-[#071638] transition hover:-translate-y-0.5"
          >
            Adjust search
          </a>
        </div>
      </div>
    </section>
  );
}

function MatchForm({ serviceSlug, areaSlug, service, area }: { serviceSlug: string; areaSlug: string; service: string; area: string }) {
  return (
    <section id="match-form" className="rounded-[24px] border border-[#cfe8d6] bg-[linear-gradient(180deg,#f7fcf8_0%,#ffffff_42%)] p-4 shadow-[0_20px_48px_rgba(8,120,63,0.10)] sm:p-6 lg:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#08783f] ring-1 ring-[#d8eddd]">
            Free match check
          </p>
          <h2 className="mt-4 max-w-[690px] text-[33px] font-semibold leading-[1.03] tracking-[-0.01em] text-[#071638] sm:text-[46px]">
            Want Quickola to find the best local match?
          </h2>
          <p className="mt-4 max-w-[620px] text-[18px] font-medium leading-[1.55] tracking-[0.005em] text-[#44506a]">
            Leave your email and we’ll check approved providers for {service} in {area}. No login. No public provider list. No paid ranking.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Email first", "No account needed"],
              ["Filtered supply", "Approved providers only"],
              ["Fast update", "Phone is optional"],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[16px] border border-[#e2efe5] bg-white p-4 shadow-[0_8px_20px_rgba(7,22,56,0.035)]">
                <p className="text-[15px] font-semibold tracking-[0.005em] text-[#071638]">{title}</p>
                <p className="mt-1 text-[13px] font-medium leading-[1.45] tracking-[0.01em] text-[#657089]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <form action={createRequest} className="rounded-[22px] border border-[#cfe8d6] bg-white p-4 shadow-[0_18px_40px_rgba(7,22,56,0.08)] sm:p-5">
          <input type="hidden" name="service" value={serviceSlug} />
          <input type="hidden" name="area" value={areaSlug} />
          <input type="hidden" name="time_needed" value="flexible" />

          <label className="block">
            <span className="mb-2 block text-[14px] font-semibold tracking-[0.02em] text-[#44506a]">Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@email.com"
              required
              className="h-13 w-full rounded-[14px] border border-[#cfdad7] bg-[#fbfffc] px-4 text-[16px] font-medium tracking-[0.01em] text-[#071638] outline-none placeholder:text-[#8b94a7] focus:border-[#08783f] focus:bg-white focus:ring-4 focus:ring-[#08783f]/10"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-[14px] font-semibold tracking-[0.02em] text-[#44506a]">Phone optional</span>
            <input
              name="phone"
              placeholder="07..."
              className="h-13 w-full rounded-[14px] border border-[#cfdad7] bg-[#fbfffc] px-4 text-[16px] font-medium tracking-[0.01em] text-[#071638] outline-none placeholder:text-[#8b94a7] focus:border-[#08783f] focus:bg-white focus:ring-4 focus:ring-[#08783f]/10"
            />
          </label>

          <button type="submit" className="mt-5 h-[54px] w-full rounded-[14px] bg-[#071638] px-5 text-[16px] font-semibold tracking-[0.02em] text-white shadow-[0_14px_28px_rgba(7,22,56,0.16)] transition hover:-translate-y-0.5">
            Find my best match
          </button>

          <p className="mt-3 text-center text-[13px] font-medium leading-[1.45] tracking-[0.005em] text-[#657089]">
            We only use this for this request.
          </p>
        </form>
      </div>
    </section>
  );
}

function ConfirmationCard({ service, area }: { service: string; area: string }) {
  return (
    <section className="rounded-[26px] border border-[#d8eddd] bg-[#f6fcf8] p-5 shadow-[0_18px_50px_rgba(7,22,56,0.06)] sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[760px]">
          <p className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.07em] text-[#08783f] ring-1 ring-[#d8eddd]">
            Request received
          </p>
          <h2 className="mt-4 text-[31px] font-semibold leading-[1.04] tracking-[-0.01em] text-[#071638] sm:text-[43px]">
            We’ll email you the best local match.
          </h2>
          <p className="mt-3 max-w-[650px] text-[16px] font-semibold leading-[1.55] text-[#44506a]">
            We’ll check approved local providers for {service} in {area}, compare them against the fair price range, and send you the strongest option by email.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
          {[
            ["1", "Check area coverage"],
            ["2", "Compare fair price"],
            ["3", "Email best option"],
          ].map(([number, text]) => (
            <div key={text} className="flex items-center gap-3 rounded-[16px] bg-white p-4 ring-1 ring-[#d8eddd]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#08783f] text-[13px] font-black text-white">{number}</span>
              <p className="text-[14px] font-extrabold text-[#071638]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomActions() {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[#e1e6ee] bg-white p-4 shadow-[0_10px_24px_rgba(7,22,56,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h2 className="text-[18px] font-extrabold text-[#071638]">Check another price?</h2>
        <p className="mt-1 text-[14px] font-semibold text-[#556177]">Start again with a different service or area.</p>
      </div>
      <a
        href="/"
        className="inline-flex h-[48px] items-center justify-center rounded-[12px] bg-[#071638] px-5 text-[15px] font-extrabold text-white transition hover:-translate-y-0.5"
      >
        New search
      </a>
    </div>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const serviceSlug = slugify(params?.service, "cleaner");
  const areaSlug = slugify(params?.area, "ilford");
  const service = formatParam(serviceSlug, "Cleaner");
  const area = formatParam(areaSlug, "Ilford");
  const isSaved = params?.saved === "true";
  const price = fairPrices[serviceSlug] || {
    low: 60,
    high: 160,
    note: "Final price depends on the exact job, timing, location and provider availability.",
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="mx-auto w-full max-w-[1080px] px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-14 lg:pt-6">
        <a href={`/check-price?service=${serviceSlug}&area=${areaSlug}`} className="inline-flex items-center gap-3 text-[14px] font-bold text-[#071638] transition hover:text-[#08783f]">
          <span className="text-[#08783f]">←</span>
          Back
        </a>

        <div className="mt-3 space-y-4 sm:mt-4 sm:space-y-5">
          <PriceHero service={service} area={area} price={price} />
          {isSaved ? (
            <ConfirmationCard service={service} area={area} />
          ) : (
            <MatchForm serviceSlug={serviceSlug} areaSlug={areaSlug} service={service} area={area} />
          )}
          <BottomActions />
        </div>

        <p className="mx-auto mt-7 max-w-[760px] text-center text-[13px] font-semibold leading-[1.5] text-[#657089]">
          This is an estimated fair range, not a final quote. Final price can change based on timing, job condition, travel, parts and provider availability.
        </p>
      </section>
      <Footer />
    </main>
  );
}