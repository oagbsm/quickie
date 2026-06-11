import Footer from "../components/Footer";
import { ExpensiveQuoteCard } from "./components/ExpensiveQuoteCard";
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
function getMoneyAmount(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  const numericValue = Number(rawValue.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function formatPounds(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getHighestPriceFromRange(value: string) {
  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;

  const numbers = matches.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (!numbers.length) return null;

  return Math.max(...numbers);
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#edf1f5] bg-white/96 backdrop-blur-md">
      <div className="mx-auto flex min-h-[52px] w-full max-w-[760px] items-center justify-between px-4 sm:min-h-[60px] sm:px-5">
        <a href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Quickola homepage">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-[34px] w-[34px] shrink-0 object-contain sm:h-[38px] sm:w-[38px]"
          />
          <span className="text-[22px] font-black leading-none tracking-[-0.055em] text-[#071638] sm:text-[26px]">
            Quickola
          </span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-[12px] border border-[#dfe5ee] bg-white px-3.5 text-[13px] font-extrabold text-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]"
          >
            New search
          </a>
        </div>
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

function LockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[2.2]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5.5" y="10" width="13" height="10" rx="2" />
      <path d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
      <path d="M12 14v2" />
    </svg>
  );
}

function KeyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[2.2]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="12" r="3.2" />
      <path d="M11.2 12H21" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </svg>
  );
}

function AlertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[2.2]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v2.2" />
      <path d="m5.6 6.6 1.5 1.5" />
      <path d="m18.4 6.6-1.5 1.5" />
      <path d="M7.5 20h9" />
      <path d="M8.5 16.5h7l-.7-5.2a2.8 2.8 0 0 0-5.6 0l-.7 5.2Z" />
    </svg>
  );
}

function LocationIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M12 2.5a7.15 7.15 0 0 0-7.15 7.15c0 5.35 7.15 11.85 7.15 11.85s7.15-6.5 7.15-11.85A7.15 7.15 0 0 0 12 2.5Zm0 9.8a2.65 2.65 0 1 1 0-5.3 2.65 2.65 0 0 1 0 5.3Z" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[2.3]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.8v5" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M12 2.5 4.8 5.4v5.5c0 4.7 3 8.9 7.2 10.6 4.2-1.7 7.2-5.9 7.2-10.6V5.4L12 2.5Zm-1.1 12.8-3.2-3.2 1.4-1.4 1.8 1.8 4.1-4.1 1.4 1.4-5.5 5.5Z" />
    </svg>
  );
}

type ResultUiCopy = {
  actionName: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  priceRows: { label: string; price: string; icon: typeof LockIcon }[];
  finalNote: string;
  factors: string[];
};

function getResultUiCopy(config: PriceConfig, serviceSlug: string): ResultUiCopy {
  const label = config.label;
  const lowerLabel = label.toLowerCase();
  const lowerSlug = serviceSlug.toLowerCase();

  if (lowerLabel.includes("locksmith") || lowerSlug.includes("locksmith")) {
    return {
      actionName: "locksmith",
      ctaTitle: "Need a locksmith today?",
      ctaBody: "We’ll connect you with a trusted local locksmith who can help.",
      ctaButton: "Find a trusted locksmith near me",
      priceRows: [
        { label: "Standard lockout", price: "£85 – £120", icon: LockIcon },
        { label: "Lock change", price: "£100 – £160", icon: KeyIcon },
        { label: "Emergency callout", price: "£130 – £180+", icon: AlertIcon },
      ],
      finalNote: "Final price depends on lock type, urgency, time of day and replacement parts.",
      factors: ["Lock type", "Urgency", "Time of day", "Parts needed"],
    };
  }

  if (lowerLabel.includes("end of tenancy") || lowerSlug.includes("end-of-tenancy")) {
    return {
      actionName: "end of tenancy cleaner",
      ctaTitle: "Need an end of tenancy cleaner?",
      ctaBody: "We’ll connect you with an available local cleaner for your move-out clean.",
      ctaButton: "Find an end of tenancy cleaner",
      priceRows: [
        { label: "1–2 bed flat", price: "£180 – £280", icon: LockIcon },
        { label: "3–4 bed home", price: config.from, icon: KeyIcon },
        { label: "Deep clean add-ons", price: "£80 – £180+", icon: AlertIcon },
      ],
      finalNote: "Final price depends on property size, condition, bathrooms, carpets and extras.",
      factors: ["Property size", "Bathrooms", "Carpets", "Extras needed"],
    };
  }

  if (lowerLabel.includes("oven") || lowerSlug.includes("oven")) {
    return {
      actionName: "oven cleaner",
      ctaTitle: "Need an oven cleaner?",
      ctaBody: "We’ll connect you with an available local oven cleaner who can help.",
      ctaButton: "Find an oven cleaner near me",
      priceRows: [
        { label: "Single oven", price: "£65 – £95", icon: LockIcon },
        { label: "Double oven", price: "£85 – £120", icon: KeyIcon },
        { label: "Oven + hob", price: "£110 – £160+", icon: AlertIcon },
      ],
      finalNote: "Final price depends on oven type, condition, racks, hob, extractor and parking.",
      factors: ["Oven type", "Condition", "Hob/extractor", "Parking"],
    };
  }

  if (lowerLabel.includes("carpet") || lowerSlug.includes("carpet")) {
    return {
      actionName: "carpet cleaner",
      ctaTitle: "Need a carpet cleaner?",
      ctaBody: "We’ll connect you with an available local carpet cleaner who can help.",
      ctaButton: "Find a carpet cleaner near me",
      priceRows: [
        { label: "One room", price: "£45 – £75", icon: LockIcon },
        { label: "2–3 rooms", price: "£85 – £150", icon: KeyIcon },
        { label: "Whole home", price: "£150 – £280+", icon: AlertIcon },
      ],
      finalNote: "Final price depends on room count, stains, carpet type, access and drying time.",
      factors: ["Room count", "Stains", "Carpet type", "Access"],
    };
  }

  if (lowerLabel.includes("clean") || lowerSlug.includes("clean")) {
    return {
      actionName: "cleaner",
      ctaTitle: "Need a cleaner?",
      ctaBody: "We’ll connect you with an available local cleaner who can help.",
      ctaButton: "Find a trusted cleaner near me",
      priceRows: [
        { label: "Standard clean", price: config.from, icon: LockIcon },
        { label: "Deep clean", price: config.from, icon: KeyIcon },
        { label: "Urgent clean", price: config.from, icon: AlertIcon },
      ],
      finalNote: "Final price depends on property size, condition, time needed and any extras.",
      factors: ["Property size", "Condition", "Time needed", "Extras"],
    };
  }

  if (lowerLabel.includes("plumber") || lowerSlug.includes("plumber")) {
    return {
      actionName: "plumber",
      ctaTitle: "Need a plumber today?",
      ctaBody: "We’ll connect you with a trusted local plumber who can help.",
      ctaButton: "Find a trusted plumber near me",
      priceRows: [
        { label: "Small repair", price: config.from, icon: LockIcon },
        { label: "Parts needed", price: config.from, icon: KeyIcon },
        { label: "Emergency callout", price: config.from, icon: AlertIcon },
      ],
      finalNote: "Final price depends on the fault, urgency, parts needed and time on site.",
      factors: ["Fault type", "Urgency", "Parts needed", "Time on site"],
    };
  }

  const genericAction = lowerLabel.replace(/\s+/g, " ").trim();

  return {
    actionName: genericAction,
    ctaTitle: `Need ${/^[aeiou]/i.test(genericAction) ? "an" : "a"} ${genericAction}?`,
    ctaBody: `We’ll connect you with an available local ${genericAction} provider who can help.`,
    ctaButton: `Find ${/^[aeiou]/i.test(genericAction) ? "an" : "a"} available ${genericAction}`,
    priceRows: [
      { label: "Typical job", price: config.from, icon: LockIcon },
      { label: "Larger job", price: config.from, icon: KeyIcon },
      { label: "Urgent request", price: config.from, icon: AlertIcon },
    ],
    finalNote: config.note,
    factors: ["Job size", "Urgency", "Access", "Extras needed"],
  };
}

function getShortResultTitle(label: string, serviceSlug: string) {
  const lower = label.toLowerCase();
  const slug = serviceSlug.toLowerCase();

  if (lower.includes("end of tenancy") || slug.includes("end-of-tenancy")) {
    return "End of tenancy cleaning near SL1";
  }

  if (lower.includes("oven") || slug.includes("oven")) {
    return "Oven cleaning near SL1";
  }

  if (lower.includes("carpet") || slug.includes("carpet")) {
    return "Carpet cleaning near SL1";
  }

  if (lower.includes("locksmith") || slug.includes("locksmith")) {
    return "Locksmith fair price near SL1";
  }

  if (lower.includes("plumber") || slug.includes("plumber")) {
    return "Plumber fair price near SL1";
  }

  return `${label} fair price near SL1`;
}

function FairPriceCard({
  config,
  uiCopy,
}: {
  config: PriceConfig;
  postcode: string;
  uiCopy: ResultUiCopy;
}) {
  const rows = uiCopy.priceRows;

  return (
    <section className="overflow-hidden rounded-[18px] bg-white text-[#071638] shadow-[0_14px_34px_rgba(7,22,56,0.07)] ring-1 ring-[#edf1f5]">
<div className="bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,#06833f_0%,#066432_48%,#071638_100%)] px-4 pb-2.5 pt-3 text-center text-white">        <p className="text-[10.5px] font-black uppercase tracking-[0.13em] text-white/82">
          Usual local price range
        </p>

<div className="mt-1 text-[34px] font-black leading-[0.9] tracking-[-0.075em] sm:text-[46px]">          {config.from}
        </div>

<p className="mt-1.5 text-[13px] font-extrabold leading-[1.15] text-white/92 sm:text-[14.5px]">          Most local jobs near SL1 fall in this range
        </p>
      </div>

      <div className="px-3.5 py-1.5 sm:px-4">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-[#edf1f5] py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f] ring-1 ring-[#dcefe2]">
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <span className="truncate text-[13.5px] font-black tracking-[-0.02em] text-[#071638] sm:text-[15.5px]">
                  {row.label}
                </span>
              </div>

              <span className="shrink-0 text-[13.5px] font-black tracking-[-0.025em] text-[#08783f] sm:text-[16px]">
                {row.price}
              </span>
            </div>
          );
        })}

        <div className="flex gap-2.5 border-t border-[#edf1f5] py-3 text-left">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6b7280]" />
          <p className="text-[12px] font-bold leading-[1.35] text-[#545f76]">
            {uiCopy.finalNote}
          </p>
        </div>
      </div>
    </section>
  );
}

function JustCheckingResult({
  config,
  postcode,
  serviceSlug,
  bookQueryString,
  quote,
}: {
  config: PriceConfig;
  postcode: string;
  serviceSlug: string;
  bookQueryString: string;
  quote: string;
}) {
  const uiCopy = getResultUiCopy(config, serviceSlug);
  const resultTitle = getShortResultTitle(config.label, serviceSlug);

  return (
    <div className="mx-auto max-w-[640px] space-y-2">
<section className="rounded-[20px] border border-[#e1e8ef] bg-white p-2.5 text-center shadow-[0_14px_34px_rgba(7,22,56,0.05)] sm:p-3">        <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#08783f]">
          Price guide
        </p>

<h1 className="mx-auto mt-1.5 max-w-[520px] text-[22px] font-black leading-[1] tracking-[-0.055em] text-[#071638] sm:text-[32px]">          {resultTitle}
        </h1>

<p className="mx-auto mt-1.5 max-w-[520px] text-[12.5px] font-extrabold leading-[1.25] text-[#5d6678] sm:text-[14px]">          Based on {config.label.toLowerCase()} prices around {postcode}
        </p>

<div className="mx-auto mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#f6fcf7] px-3 py-1.5 text-[11.5px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">          <CheckIcon className="h-4 w-4" />
          Price guide calculated for your area
        </div>

        <div className="mt-2.5">
          <FairPriceCard config={config} postcode={postcode} uiCopy={uiCopy} />
        </div>
      </section>

      {quote ? <ExpensiveQuoteCard quote={quote} /> : null}

      <section className="rounded-[20px] border border-[#dcebe1] bg-[#fbfffc] p-3 shadow-[0_10px_26px_rgba(7,22,56,0.04)] sm:p-4">
        <div className="flex items-start gap-3 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f] ring-1 ring-[#dcefe2]">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>

          <div>
            <h2 className="text-[19px] font-black leading-[1.05] tracking-[-0.045em] text-[#071638] sm:text-[22px]">
              {uiCopy.ctaTitle}
            </h2>

            <p className="mt-0.5 text-[12.5px] font-bold leading-[1.35] text-[#5d6678] sm:text-[14px]">
              {uiCopy.ctaBody}
            </p>
          </div>
        </div>

        <a
          href={`/book?${bookQueryString}`}
          className="mt-3 flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-3.5 text-center text-[13.5px] font-black tracking-[-0.025em] text-white shadow-[0_10px_22px_rgba(0,104,47,0.18)] transition hover:-translate-y-0.5 sm:h-[56px] sm:text-[17px]"
        >
          <LocationIcon className="h-5 w-5" />
          {uiCopy.ctaButton}
        </a>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] font-bold leading-[1.3] text-[#657089] sm:text-[12.5px]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#08783f] text-[11px] font-black text-[#08783f]">
            ✓
          </span>
          Usually takes under 2 minutes. No payment required.
        </p>

        <div className="mt-3 border-t border-[#e4ece7] pt-2 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[12px] px-3 py-1.5 text-[13px] font-black text-[#08783f] transition hover:bg-[#f0faf3]"
          >
            Check another service
            <span aria-hidden="true">›</span>
          </a>
        </div>
      </section>

      <details className="rounded-[18px] border border-[#e1e6ee] bg-white p-3 shadow-[0_8px_22px_rgba(7,22,56,0.03)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f]">
              <InfoIcon className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-[16px] font-black tracking-[-0.03em] text-[#071638]">
                What affects this price?
              </span>

              <span className="mt-0.5 block text-[12px] font-bold leading-[1.3] text-[#657089]">
                Price changes based on{" "}
                {uiCopy.factors.map((factor) => factor.toLowerCase()).join(", ")}.
              </span>
            </span>
          </span>

          <span className="shrink-0 text-[28px] font-black leading-none text-[#08783f]">
            ⌄
          </span>
        </summary>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {uiCopy.factors.map((factor) => (
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

const quoteAmount = getMoneyAmount(params.quote || params.userQuote || params.currentQuote);
const highestRangePrice = getHighestPriceFromRange(config.from);

const quote =
  quoteAmount && highestRangePrice && quoteAmount > highestRangePrice
    ? formatPounds(quoteAmount)
    : "";
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
<main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] pb-5 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">      <Header />

<section className="mx-auto w-full max-w-[740px] px-3.5 pb-4 pt-1 sm:px-5 sm:pt-2">        <div>
          <JustCheckingResult
            config={config}
            postcode={postcode}
            serviceSlug={serviceSlug}
            bookQueryString={bookQueryString}
            quote={quote}
          />
        </div>
      </section>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}