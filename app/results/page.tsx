import Footer from "../components/Footer";
import {
  getPriceConfigForResults,
  normalisePriceServiceSlug,
  type PriceConfig,
} from "../data/priceConfigs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatPostcodeParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return "Slough";

  const clean = rawValue
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!clean) return "Slough";
  return clean;
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
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[2.5]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6.5 12.3 3.4 3.5 7.6-8" />
    </svg>
  );
}

function FairPriceCard({ config, postcode }: { config: PriceConfig; postcode: string }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.13),transparent_28%),linear-gradient(135deg,#08783f_0%,#064f35_48%,#071638_100%)] p-4 text-center text-white shadow-[0_16px_42px_rgba(7,22,56,0.12)] sm:text-left lg:p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/76">
        Usual local price range
      </p>

      <div className="mt-2 flex flex-wrap items-end justify-center gap-3 text-center sm:justify-start sm:text-left">
        <span className="text-[38px] font-black leading-[0.95] tracking-[-0.065em] sm:text-[48px]">
          {config.from}
        </span>
        {config.suffix ? <span className="pb-2 text-[22px] font-bold">{config.suffix}</span> : null}
      </div>

      <p className="mt-2 text-[15px] font-semibold text-white/86">
        Typical guide range for {config.label.toLowerCase()} around{" "}
        <span className="font-black text-white">{postcode}</span>
      </p>

      <p className="mt-2 border-t border-white/14 pt-2 text-[12.5px] font-semibold leading-[1.4] text-white/82">
        {config.note}
      </p>
    </section>
  );
}

function JustCheckingResult({
  config,
  postcode,
  serviceSlug,
  bookQueryString,
}: {
  config: PriceConfig;
  postcode: string;
  serviceSlug: string;
  bookQueryString: string;
}) {
  const factors = ["Distance", "Load size", "Stairs", "Parking", "Urgency"];

  return (
    <div className="mx-auto max-w-[640px] space-y-3">
      <section className="rounded-[24px] border border-[#dcebe1] bg-white p-4 text-center shadow-[0_14px_38px_rgba(7,22,56,0.055)] sm:p-5 lg:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#08783f]">
          Price guide
        </p>

        <h1 className="mx-auto mt-2 max-w-[520px] text-[28px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[38px]">
          Your fair price guide
        </h1>

        <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-bold leading-[1.45] text-[#44506a] sm:text-[16px]">
          Based on: {config.label} · {postcode}
        </p>

        <div className="mx-auto mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-[#f7fcf8] px-4 py-2 text-[12px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">
          <CheckIcon className="h-4 w-4" />
          Good guide based on your answers
        </div>

        <div className="mt-4">
          <FairPriceCard config={config} postcode={postcode} />
        </div>

        <p className="mx-auto mt-4 max-w-[420px] text-[14px] font-black leading-[1.35] text-[#071638]">
          Want help finding someone available?
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <a
            href={`/book?${bookQueryString}`}
            className="flex h-[52px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5 sm:col-span-2"
          >
            Find someone available near me
          </a>

          <a
            href="/"
            className="mx-auto flex h-[36px] items-center justify-center rounded-[12px] border border-transparent bg-transparent px-4 text-[13px] font-black text-[#08783f] transition hover:-translate-y-0.5 hover:bg-[#f7fcf8] sm:col-span-2"
          >
            Check another price
          </a>

          <p className="text-[12px] font-bold leading-[1.35] text-[#657089] sm:col-span-2">
            Free to check. No booking required — you choose what happens next.
          </p>
        </div>
      </section>

      <details className="rounded-[20px] border border-[#e1e6ee] bg-white p-3 shadow-[0_10px_28px_rgba(7,22,56,0.035)] sm:p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-black tracking-[-0.02em] text-[#071638]">
          <span>What affects this price?</span>
          <span className="text-[#08783f]">⌄</span>
        </summary>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {factors.map((factor) => (
            <div
              key={factor}
              className="rounded-[14px] bg-[#f7fafc] px-3 py-3 text-center text-[12px] font-black text-[#44506a] ring-1 ring-[#edf0f5]"
            >
              {factor}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = (await searchParams) ?? {};
  const rawService = Array.isArray(params.service) ? params.service[0] : params.service;
  const rawPostcode = params.postcode || params.area;
  const serviceSlug = normalisePriceServiceSlug(rawService);
  const postcode = formatPostcodeParam(rawPostcode);
  const config = getPriceConfigForResults(params);
  const bookParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) bookParams.append(key, item);
      });
      return;
    }

    if (value) bookParams.set(key, value);
  });

  bookParams.set("service", serviceSlug);
  bookParams.set("postcode", postcode);
  bookParams.set("mode", "find-provider");

  const bookQueryString = bookParams.toString();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] pb-8 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:pb-0">
      <Header />

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-8 pt-3 sm:px-6 lg:px-8 lg:pb-14 lg:pt-4">
        <div className="mt-0 sm:mt-2">
          <JustCheckingResult
            config={config}
            postcode={postcode}
            serviceSlug={serviceSlug}
            bookQueryString={bookQueryString}
          />
        </div>
      </section>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}