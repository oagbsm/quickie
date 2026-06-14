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
      <div className="mx-auto flex min-h-[52px] w-full max-w-[760px] items-center justify-between px-4 sm:min-h-[60px] sm:px-5 lg:max-w-[1180px] lg:px-8">
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

  const configWithRows = config as PriceConfig & {
    resultRows?: { label: string; price: string }[];
  };

  const withConfigRows = (
    fallbackRows: { label: string; icon: typeof LockIcon }[]
  ) =>
    (configWithRows.resultRows?.length
      ? configWithRows.resultRows.map((row, index) => ({
          label: row.label,
          price: row.price,
          icon: fallbackRows[index]?.icon ?? LockIcon,
        }))
      : fallbackRows.map((row) => ({
          ...row,
          price: config.from,
        })));

  if (lowerLabel.includes("locksmith") || lowerSlug.includes("locksmith")) {
    return {
      actionName: "locksmith",
      ctaTitle: "Need a locksmith today?",
      ctaBody: "We’ll connect you with a trusted local locksmith who can help.",
      ctaButton: "Find a trusted locksmith near me",
      priceRows: withConfigRows([
        { label: "Standard lockout", icon: LockIcon },
        { label: "Lock change", icon: KeyIcon },
        { label: "Emergency callout", icon: AlertIcon },
      ]),
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
      priceRows: withConfigRows([
        { label: "1–2 bed flat", icon: LockIcon },
        { label: "3–4 bed home", icon: KeyIcon },
        { label: "Deep clean add-ons", icon: AlertIcon },
      ]),
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
      priceRows: withConfigRows([
        { label: "Single oven", icon: LockIcon },
        { label: "Double oven", icon: KeyIcon },
        { label: "Oven + hob", icon: AlertIcon },
      ]),
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
      priceRows: withConfigRows([
        { label: "One room", icon: LockIcon },
        { label: "2–3 rooms", icon: KeyIcon },
        { label: "Whole home", icon: AlertIcon },
      ]),
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
      priceRows: withConfigRows([
        { label: "Standard clean", icon: LockIcon },
        { label: "Deep clean", icon: KeyIcon },
        { label: "Urgent clean", icon: AlertIcon },
      ]),
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
      priceRows: withConfigRows([
        { label: "Small repair", icon: LockIcon },
        { label: "Parts needed", icon: KeyIcon },
        { label: "Emergency callout", icon: AlertIcon },
      ]),
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
    priceRows: withConfigRows([
      { label: "Typical job", icon: LockIcon },
      { label: "Larger job", icon: KeyIcon },
      { label: "Urgent request", icon: AlertIcon },
    ]),
    finalNote: config.note,
    factors: ["Job size", "Urgency", "Access", "Extras needed"],
  };
}

function getShortResultTitle(label: string, serviceSlug: string) {
  const lower = label.toLowerCase();
  const slug = serviceSlug.toLowerCase();

  if (lower.includes("end of tenancy") || slug.includes("end-of-tenancy")) {
    return "Avoid overpaying for end of tenancy cleaning";
  }

  if (lower.includes("oven") || slug.includes("oven")) {
    return "Avoid overpaying for oven cleaning";
  }

  if (lower.includes("carpet") || slug.includes("carpet")) {
    return "Avoid overpaying for carpet cleaning";
  }

  if (lower.includes("locksmith") || slug.includes("locksmith")) {
    return "Avoid overpaying for a locksmith";
  }

  if (lower.includes("plumber") || slug.includes("plumber")) {
    return "Avoid overpaying for a plumber";
  }

  if (lower.includes("electrician") || slug.includes("electrician")) {
    return "Avoid overpaying for an electrician";
  }

  return `Avoid overpaying for ${label.toLowerCase()}`;
}


function FairPriceCard({
  config,
  postcode,
  uiCopy,
}: {
  config: PriceConfig;
  postcode: string;
  uiCopy: ResultUiCopy;
}) {
  const rows = uiCopy.priceRows;

  return (
    <section className="overflow-hidden rounded-[17px] bg-white text-[#071638] shadow-[0_14px_34px_rgba(7,22,56,0.07)] ring-1 ring-[#edf1f5]">
      <div className="bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,#06833f_0%,#066432_48%,#071638_100%)] px-4 pb-3 pt-3.5 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/82">
          Quickola fair price check
        </p>

        <div className="mt-1 text-[36px] font-black leading-[0.9] tracking-[-0.075em] sm:text-[48px]">
          {config.from}
        </div>

        <p className="mt-1.5 text-[13px] font-extrabold leading-[1.15] text-white/92 sm:text-[14.5px]">
          Most local jobs near {postcode} should land around here
        </p>
      </div>

      <div className="grid grid-cols-3 border-b border-[#edf1f5] bg-[#fbfffc] text-center">
        <div className="border-r border-[#edf1f5] px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#08783f]">
            Local
          </p>
          <p className="mt-0.5 text-[11px] font-extrabold leading-[1.1] text-[#44506a]">
            SL1 guide
          </p>
        </div>

        <div className="border-r border-[#edf1f5] px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#08783f]">
            No bias
          </p>
          <p className="mt-0.5 text-[11px] font-extrabold leading-[1.1] text-[#44506a]">
            Price first
          </p>
        </div>

        <div className="px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#08783f]">
            Warning
          </p>
          <p className="mt-0.5 text-[11px] font-extrabold leading-[1.1] text-[#44506a]">
            Avoid overpay
          </p>
        </div>
      </div>

      <div className="px-3.5 py-1 sm:px-4">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-[#edf1f5] py-2 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f] ring-1 ring-[#dcefe2]">
                  <Icon className="h-[16px] w-[16px]" />
                </span>

                <span className="truncate text-[13px] font-black tracking-[-0.02em] text-[#071638] sm:text-[15px]">
                  {row.label}
                </span>
              </div>

              <span className="shrink-0 text-[13px] font-black tracking-[-0.025em] text-[#08783f] sm:text-[15px]">
                {row.price}
              </span>
            </div>
          );
        })}

        <div className="flex gap-2.5 border-t border-[#edf1f5] py-2.5 text-left">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6b7280]" />
          <p className="text-[11.5px] font-bold leading-[1.35] text-[#545f76]">
            {uiCopy.finalNote}
          </p>
        </div>
      </div>
    </section>
  );
}

function CostGuideAccordion({ config }: { config: PriceConfig }) {
  const guide = config.costGuide;

  if (!guide) return null;

  return (
    <section className="rounded-[20px] border border-[#e1e8ef] bg-white p-3 shadow-[0_14px_34px_rgba(7,22,56,0.05)] sm:p-4">
      <div className="text-left">
        <p className="text-[10.5px] font-black uppercase tracking-[0.17em] text-[#08783f]">
          Cost guide
        </p>
        <h2 className="mt-1 text-[22px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[28px]">
          {guide.title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {guide.updatedLabel ? (
            <span className="inline-flex rounded-full bg-[#eef9f1] px-3 py-1 text-[11px] font-black text-[#08783f] ring-1 ring-[#dcefe2]">
              {guide.updatedLabel}
            </span>
          ) : null}
          {guide.sourceLabel ? (
            <span className="inline-flex rounded-full bg-[#f7fafc] px-3 py-1 text-[11px] font-black text-[#5d6678] ring-1 ring-[#edf1f5]">
              {guide.sourceLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-3 rounded-[15px] border border-[#dcefe2] bg-[#f7fcf8] p-3 text-left">
          <p className="text-[12px] font-black uppercase tracking-[0.11em] text-[#08783f]">
            How Quickola estimates fair prices
          </p>
          <p className="mt-1 text-[12.5px] font-bold leading-[1.4] text-[#4f5b70] sm:text-[13.5px]">
            We compare public UK cost-guide benchmarks, local provider price ranges, customer quote checks and completed Quickola job data where available. Prices are guides, not fixed quotes.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {guide.sections.map((section, index) => (
          <details
            key={section.title}
            open={index < 2}
            className="group rounded-[16px] border border-[#e7edf3] bg-[#fbfcfd] p-3 text-left shadow-[0_8px_18px_rgba(7,22,56,0.025)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span>
                <span className="block text-[15px] font-black tracking-[-0.035em] text-[#071638] sm:text-[17px]">
                  {section.title}
                </span>
                {section.intro ? (
                  <span className="mt-0.5 block text-[11.5px] font-bold leading-[1.35] text-[#657089] sm:text-[12.5px]">
                    {section.intro}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-[24px] font-black leading-none text-[#08783f] transition group-open:rotate-180">
                ⌄
              </span>
            </summary>

            {section.rows?.length ? (
              <div className="mt-3 overflow-hidden rounded-[14px] border border-[#e4ece7] bg-white">
                {section.rows.map((row) => (
                  <div
                    key={`${section.title}-${row.label}`}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#edf1f5] px-3 py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-black leading-[1.15] tracking-[-0.025em] text-[#071638] sm:text-[14px]">
                        {row.label}
                      </p>
                      {row.included ? (
                        <p className="mt-0.5 text-[11.5px] font-bold leading-[1.3] text-[#657089] sm:text-[12.5px]">
                          {row.included}
                        </p>
                      ) : null}
                      {row.note ? (
                        <p className="mt-0.5 text-[11.5px] font-bold leading-[1.3] text-[#657089] sm:text-[12.5px]">
                          {row.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-black tracking-[-0.025em] text-[#08783f] sm:text-[14px]">
                        {row.price}
                      </p>
                      {row.average ? (
                        <p className="mt-0.5 text-[10.5px] font-black text-[#8a94a6] sm:text-[11px]">
                          {row.average}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {section.bullets?.length ? (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2.5 text-[12.5px] font-bold leading-[1.35] text-[#4e5a70] sm:text-[13.5px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f] ring-1 ring-[#dcefe2]">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.warning ? (
              <div className="mt-3 rounded-[14px] border border-[#fde8b3] bg-[#fff9e8] p-3 text-[12.5px] font-black leading-[1.35] text-[#7a4f00]">
                {section.warning}
              </div>
            ) : null}
          </details>
        ))}
      </div>

      {guide.faqs?.length ? (
        <div className="mt-4 rounded-[16px] border border-[#e7edf3] bg-[#fbfcfd] p-3 text-left">
          <h3 className="text-[17px] font-black tracking-[-0.04em] text-[#071638] sm:text-[20px]">
            FAQs about {config.label.toLowerCase()} costs
          </h3>
          <div className="mt-2 space-y-2">
            {guide.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-[14px] border border-[#edf1f5] bg-white p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-black leading-[1.2] tracking-[-0.025em] text-[#071638] sm:text-[14px]">
                  {faq.question}
                  <span className="shrink-0 text-[20px] font-black leading-none text-[#08783f] transition group-open:rotate-180">
                    ⌄
                  </span>
                </summary>
                <p className="mt-2 text-[12.5px] font-bold leading-[1.4] text-[#5d6678] sm:text-[13.5px]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
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
    <div className="mx-auto max-w-[620px] space-y-2 lg:max-w-none lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.75fr)] lg:items-start lg:gap-7 lg:space-y-0">
      <div className="lg:space-y-4">
      <section className="rounded-[20px] border border-[#e1e8ef] bg-white p-2.5 text-center shadow-[0_14px_34px_rgba(7,22,56,0.05)] sm:p-3 lg:rounded-[26px] lg:p-6 lg:shadow-[0_24px_70px_rgba(7,22,56,0.08)]">
        <p className="text-[10.5px] font-black uppercase tracking-[0.17em] text-[#08783f]">
          Price guide
        </p>

        <h1 className="mx-auto mt-1.5 max-w-[520px] text-[22px] font-black leading-[1] tracking-[-0.055em] text-[#071638] sm:text-[32px]">
          {resultTitle}
        </h1>

        <p className="mx-auto mt-1.5 max-w-[520px] text-[12.5px] font-extrabold leading-[1.25] text-[#5d6678] sm:text-[14px]">
          Based on {config.label.toLowerCase()} prices around {postcode}. Check before you book.
        </p>

        <p className="mx-auto mt-1.5 max-w-[500px] rounded-full bg-[#eef9f1] px-3 py-1.5 text-[11.5px] font-black leading-[1.25] text-[#08783f] ring-1 ring-[#dcefe2] sm:text-[12.5px]">
          Before you book, check Quickola first.
        </p>

        <div className="mx-auto mt-2 grid max-w-[420px] grid-cols-3 overflow-hidden rounded-[14px] border border-[#d8eddd] bg-[#f6fcf7] text-center">
          <div className="border-r border-[#d8eddd] px-2 py-1.5">
            <p className="text-[10px] font-black text-[#08783f]">Fair range</p>
          </div>

          <div className="border-r border-[#d8eddd] px-2 py-1.5">
            <p className="text-[10px] font-black text-[#08783f]">Local check</p>
          </div>

          <div className="px-2 py-1.5">
            <p className="text-[10px] font-black text-[#08783f]">No pressure</p>
          </div>
        </div>

        <div className="mt-2.5">
          <FairPriceCard config={config} postcode={postcode} uiCopy={uiCopy} />
        </div>
      </section>

      {quote ? <ExpensiveQuoteCard quote={quote} /> : null}
      </div>

      <aside className="space-y-2 lg:sticky lg:top-[84px] lg:space-y-4">
      <section className="rounded-[18px] border border-[#dcebe1] bg-[#fbfffc] p-3 shadow-[0_10px_26px_rgba(7,22,56,0.04)] sm:p-4 lg:rounded-[26px] lg:p-6 lg:shadow-[0_18px_48px_rgba(7,22,56,0.07)]">
        <div className="flex items-start gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f] ring-1 ring-[#dcefe2]">
            <ShieldCheckIcon className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-[18px] font-black leading-[1.05] tracking-[-0.045em] text-[#071638] sm:text-[21px]">
              {uiCopy.ctaTitle}
            </h2>

            <p className="mt-0.5 text-[12.5px] font-bold leading-[1.3] text-[#5d6678] sm:text-[14px]">
              {uiCopy.ctaBody}
            </p>
          </div>
        </div>

        <div className="mt-2.5 rounded-[14px] border border-[#edf1f5] bg-white px-3 py-2 text-left">
          <p className="text-[12px] font-black leading-[1.3] text-[#071638]">
            Why check first?
          </p>

          <p className="mt-0.5 text-[11.5px] font-bold leading-[1.35] text-[#5d6678]">
            Some quotes can sit far above the normal local range. Quickola helps you spot that before you say yes.
          </p>
        </div>

        <a
          href={`/book?${bookQueryString}`}
          className="mt-3 flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-3.5 text-center text-[13.5px] font-black tracking-[-0.025em] text-white shadow-[0_10px_22px_rgba(0,104,47,0.18)] transition hover:-translate-y-0.5 sm:h-[54px] sm:text-[16px]"
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

        <div className="mt-2.5 border-t border-[#e4ece7] pt-2 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[12px] px-3 py-1.5 text-[13px] font-black text-[#08783f] transition hover:bg-[#f0faf3]"
          >
            Check another service
            <span aria-hidden="true">›</span>
          </a>
        </div>
      </section>

      <details className="rounded-[16px] border border-[#e1e6ee] bg-white p-3 shadow-[0_8px_22px_rgba(7,22,56,0.03)] lg:rounded-[22px] lg:p-5 lg:shadow-[0_14px_36px_rgba(7,22,56,0.05)]" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef9f1] text-[#08783f]">
              <InfoIcon className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-[15px] font-black tracking-[-0.03em] text-[#071638]">
                What affects this price?
              </span>

              <span className="mt-0.5 block text-[11.5px] font-bold leading-[1.3] text-[#657089]">
                Price changes based on{" "}
                {uiCopy.factors.map((factor) => factor.toLowerCase()).join(", ")}.
              </span>
            </span>
          </span>

          <span className="shrink-0 text-[26px] font-black leading-none text-[#08783f]">
            ⌄
          </span>
        </summary>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {uiCopy.factors.map((factor) => (
            <div
              key={factor}
              className="rounded-[13px] bg-[#f7fafc] px-3 py-2.5 text-center text-[12px] font-black text-[#44506a] ring-1 ring-[#edf0f5]"
            >
              {factor}
            </div>
          ))}
        </div>
      </details>

      </aside>

      <div className="lg:col-span-2 lg:mt-7">
        <CostGuideAccordion config={config} />
      </div>

      <div className="fixed bottom-3 left-3 right-3 z-[99999] rounded-[20px] border border-[#dcebe1] bg-white p-2 shadow-[0_18px_42px_rgba(7,22,56,0.28)] lg:hidden">
        <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[11px] font-black text-[#08783f]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#eef9f1] text-[10px] ring-1 ring-[#dcefe2]">
            ✓
          </span>
          No payment · No obligation · Usually under 2 minutes
        </div>

        <a
          href={`/book?${bookQueryString}`}
          className="flex h-[54px] items-center justify-center gap-2 rounded-[15px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-3.5 text-center text-[15px] font-black tracking-[-0.03em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.24)] sm:text-[16px]"
        >
          <LocationIcon className="h-5 w-5" />
          {uiCopy.ctaButton}
        </a>
      </div>
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
  <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] pb-40 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] sm:pb-32 lg:pb-0">
      <Header />

      <section className="mx-auto w-full max-w-[740px] px-3.5 pb-4 pt-1 sm:px-5 sm:pt-2 lg:max-w-[1180px] lg:px-8 lg:pb-12 lg:pt-8">
        <div>
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