"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const services = [
  { label: "Plumbing", value: "plumbing", icon: "plumbing" },
  { label: "Cleaning", value: "cleaning", icon: "cleaning" },
  { label: "Electrical", value: "electrician", icon: "bolt" },
  { label: "Locksmith", value: "locksmith", icon: "key" },
  { label: "Removals", value: "removals", icon: "van" },
  { label: "Handyman", value: "handyman", icon: "tool" },
];

const supportedPostcodeAreas = [
  "BR",
  "CR",
  "DA",
  "E",
  "EC",
  "EN",
  "HA",
  "IG",
  "KT",
  "N",
  "NW",
  "RM",
  "SE",
  "SL",
  "SM",
  "SW",
  "TW",
  "UB",
  "W",
  "WC",
  "WD",
];

function normalisePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

function formatPostcode(value: string) {
  const clean = normalisePostcode(value);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
}

function isValidUkPostcode(value: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(value.trim().toUpperCase());
}

function getPostcodeArea(value: string) {
  const clean = normalisePostcode(value);
  const match = clean.match(/^[A-Z]+/);
  return match ? match[0] : null;
}

function isSupportedPostcode(value: string) {
  const area = getPostcodeArea(value);
  return area ? supportedPostcodeAreas.includes(area) : false;
}

function Icon({ type, className = "h-[22px] w-[22px]" }: { type: string; className?: string }) {
  const base = `${className} fill-none stroke-current stroke-[2.15]`;

  if (type === "plumbing") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 14h9a4 4 0 0 0 4-4V6" />
        <path d="M17 6h3" />
        <path d="M7 10v8" />
        <path d="M4 18h6" />
      </svg>
    );
  }

  if (type === "cleaning") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m14 4 6 6" />
        <path d="M4 20h8" />
        <path d="m12 6-7 7 6 6 7-7" />
        <path d="M7 16l-3 4" />
      </svg>
    );
  }

  if (type === "bolt") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
      </svg>
    );
  }

  if (type === "key") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="15" r="3.2" />
        <path d="m10.3 12.7 8-8" />
        <path d="m15.5 7.5 2 2" />
        <path d="m17.5 5.5 1.5 1.5" />
      </svg>
    );
  }

  if (type === "van") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h3.5l2.5 3v3h-6" />
        <circle cx="6.5" cy="18" r="2" />
        <circle cx="17.5" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "target") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  if (type === "tool") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 4.5a4.5 4.5 0 0 0 5 5L10 19a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2l9.5-9.5Z" />
        <path d="m13 7 4 4" />
      </svg>
    );
  }

  return null;
}

export default function Hero() {
  const router = useRouter();
  const [service, setService] = useState("cleaning");
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formattedPostcode = formatPostcode(postcode);

    if (!formattedPostcode) {
      setPostcodeError("Enter your postcode.");
      return;
    }

    if (!isValidUkPostcode(formattedPostcode)) {
      setPostcodeError("Enter a valid UK postcode.");
      return;
    }

    if (!isSupportedPostcode(formattedPostcode)) {
      setPostcodeError("We only support London, Slough and nearby postcodes right now.");
      return;
    }

    setPostcodeError(null);
    setPostcode(formattedPostcode);
    router.push(`/check-price?service=${service}&postcode=${encodeURIComponent(formattedPostcode)}`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-white pt-[72px] lg:pt-[82px]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_17%_15%,rgba(7,148,72,0.16),transparent_28%),radial-gradient(circle_at_82%_9%,rgba(7,148,72,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f5fbf7_52%,#ffffff_100%)]" />
      <div className="absolute left-[-90px] top-[86px] -z-10 h-[230px] w-[230px] rounded-full bg-[#dff5e7] blur-[56px]" />
      <div className="absolute right-[-120px] top-[170px] -z-10 h-[260px] w-[260px] rounded-full bg-[#edf8ef] blur-[60px]" />

      <div className="mx-auto grid max-w-[1320px] items-start gap-2 px-4 pb-3 pt-3 sm:px-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(560px,0.84fr)] lg:gap-8 lg:px-10 lg:pb-6 lg:pt-[31px]">
        <div className="lg:pt-[42px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cfeadb] bg-white/90 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#079448] shadow-[0_10px_22px_rgba(7,22,56,0.06)] backdrop-blur sm:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#079448]" />
            Fair before hire.
          </div>

          <h1 className="mt-3 max-w-[650px] text-[31px] font-extrabold leading-[1.03] tracking-[-0.058em] text-[#071638] sm:mt-4 sm:text-[55px] lg:text-[68px]">
            See what local people <span className="text-[#079448]">actually pay</span> before hiring.
          </h1>

          <p className="mt-3 max-w-[540px] text-[13.5px] font-medium leading-[1.38] tracking-[-0.015em] text-[#2f3b52] sm:mt-4 sm:text-[19px] sm:leading-[1.38] lg:text-[20px]">
            Real prices from real jobs in your area. Most homeowners <span className="font-black">overpay</span> without realising.
          </p>

          <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-[16px] border border-[#dfe8e4] bg-white/70 shadow-[0_10px_24px_rgba(7,22,56,0.04)] backdrop-blur sm:mt-6 sm:max-w-[620px] lg:mt-10 lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
            {[
              ["shield", "Real data", "from real jobs"],
              ["plumbing", "No paid", "ranking"],
              ["target", "10 sec", "price check"],
              ["lock", "No signup", "no spam"],
            ].map(([icon, value, label]) => (
              <div key={value} className="border-r border-[#e1e8ee] px-2 py-2 last:border-r-0 sm:px-3 sm:py-3 lg:border-r lg:py-0 lg:first:pl-0 lg:last:pr-0">
                <div className="hidden text-[#071638] sm:mb-1.5 sm:flex sm:h-[32px]">
                  {icon === "lock" ? (
                    <span className="text-[20px] leading-none sm:text-[25px]">▢</span>
                  ) : (
                    <Icon type={icon} className="h-[20px] w-[20px] sm:h-[26px] sm:w-[26px]" />
                  )}
                </div>
                <p className="text-[10.5px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#071638] sm:text-[16px]">{value}</p>
                <p className="mt-0.5 whitespace-pre-line text-[9px] font-medium leading-[1.15] tracking-[-0.01em] text-[#40506a] sm:mt-1 sm:text-[12px] sm:leading-[1.25]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-[16px] bg-[#06182d] px-5 py-4 text-white shadow-[0_16px_34px_rgba(7,22,56,0.16)] lg:block lg:max-w-[640px]">
            <div className="flex items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#18b857]">
                  <span className="h-2 w-2 rounded-full bg-[#18b857]" />
                  Recent market update
                </p>
                <p className="mt-2 text-[20px] font-extrabold leading-[1.25] tracking-[-0.03em]">
                  Cleaning guide prices are up 8% in London this month
                </p>
                <p className="mt-1.5 text-[13px] font-medium leading-[1.45] text-white/68">
                  Fair ranges help you avoid booking blind.
                </p>
              </div>

              <div className="w-[230px] shrink-0">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
                  <span>30 days</span>
                  <span className="rounded-full bg-[#079448] px-2.5 py-1 text-[12px] font-extrabold tracking-normal text-white">+8%</span>
                </div>
                <svg viewBox="0 0 230 72" className="h-[62px] w-full fill-none" aria-hidden="true">
                  <path d="M0 58H230M0 38H230M0 18H230" className="stroke-white/10 stroke-[1]" />
                  <path
                    d="M4 57 C24 56 33 55 48 56 C65 57 76 52 91 50 C108 48 119 49 134 43 C148 37 156 40 170 34 C185 28 191 31 204 23 C215 16 221 18 226 12"
                    className="stroke-[#0bbf4d] stroke-[3]"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="226" cy="12" r="4" className="fill-[#0bbf4d]" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[600px] lg:mx-0 lg:justify-self-end">
          <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] bg-[radial-gradient(circle_at_50%_20%,rgba(7,148,72,0.18),transparent_58%)] blur-[10px]" />
          <form
            id="hero-price-form"
            onSubmit={handleSubmit}
            className="relative rounded-[22px] border border-[#dbe8e1] bg-white p-3.5 shadow-[0_22px_50px_rgba(7,22,56,0.11)] backdrop-blur sm:p-5 lg:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
              <div>
                <h2 className="text-[20px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#071638] sm:text-[25px]">
                  Check fair prices in your area
                </h2>
                <p className="mt-1 text-[12px] font-medium leading-[1.35] tracking-[-0.01em] text-[#42516a] sm:mt-1.5 sm:text-[14px]">
                  Real-time data. Real local jobs. Real fair prices.
                </p>
              </div>
              <div className="mt-1 hidden shrink-0 items-center gap-2 rounded-full bg-[#f4fbf6] px-2.5 py-1 text-[10px] font-black text-[#071638] sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#079448]" />
                Live data
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold tracking-[-0.01em] text-[#071638] sm:mb-3 sm:text-[13px]">
              <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-[#079448] text-[12px] font-bold text-white shadow-[0_5px_12px_rgba(7,148,72,0.22)]">1</span>
              Choose a service
            </div>

            <div className="rounded-[18px] bg-[#f6fbf7] p-2 ring-1 ring-[#dceee3] sm:p-2.5">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                {services.map((item) => {
                  const selected = service === item.value && item.label !== "More";

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setService(item.value)}
                      className={`relative h-[58px] rounded-[14px] border bg-white px-2 text-center transition hover:-translate-y-0.5 sm:h-[78px] ${
                        selected
                          ? "border-[#079448] bg-white shadow-[0_10px_22px_rgba(7,148,72,0.13)]"
                          : "border-[#dfe5ee] shadow-[0_5px_12px_rgba(7,22,56,0.035)]"
                      }`}
                    >
                      {selected ? (
                        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#079448] text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(7,148,72,0.26)] sm:-right-2 sm:-top-2 sm:h-6 sm:w-6 sm:text-[12px]">✓</span>
                      ) : null}
                      <span className="mx-auto grid h-[20px] place-items-center text-[#071638] sm:h-[28px]">
                        <Icon type={item.icon} className="h-[17px] w-[17px] stroke-[1.9] sm:h-[22px] sm:w-[22px]" />
                      </span>
                      <span className="mt-0.5 block text-[9.5px] font-extrabold tracking-[-0.015em] text-[#071638] sm:mt-1.5 sm:text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 space-y-2 lg:mt-6 lg:space-y-3">
              <label className="relative block">
                <span className="mb-1.5 flex items-center gap-2 text-[12px] font-extrabold tracking-[-0.01em] text-[#071638] sm:mb-2 sm:text-[13px]">
                  <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-[#079448] text-[12px] font-bold text-white shadow-[0_5px_12px_rgba(7,148,72,0.22)]">2</span>
                  Enter your postcode
                </span>
                <div
                  className={`relative flex h-[43px] items-center gap-3 rounded-[14px] border bg-white px-4 text-[#071638] focus-within:ring-4 sm:h-[49px] ${
                    postcodeError
                      ? "border-[#d93025] focus-within:border-[#d93025] focus-within:ring-[#d93025]/10"
                      : "border-[#dfe5ee] focus-within:border-[#079448] focus-within:ring-[#079448]/10"
                  }`}
                >
                  <input
                    value={postcode}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
                      setPostcode(nextValue);
                      if (postcodeError) setPostcodeError(null);
                    }}
                    onBlur={() => {
                      if (postcode.trim()) setPostcode(formatPostcode(postcode));
                    }}
                    autoComplete="postal-code"
                    inputMode="text"
                    maxLength={8}
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold uppercase tracking-[-0.015em] text-[#071638] outline-none placeholder:normal-case placeholder:text-[#8b94a7]"
                    placeholder="Enter your postcode"
                  />
                  <Icon type="target" className="h-[19px] w-[19px]" />
                </div>
                {postcodeError ? <p className="mt-2 text-[13px] font-bold text-[#d93025]">{postcodeError}</p> : null}
              </label>

              <div className="hidden items-center justify-between gap-3 text-[11px] font-semibold text-[#071638] sm:flex sm:text-[12px]">
                <span>▣ We’ll show prices in your area</span>
                <span>⏱ Takes less than 10 seconds</span>
              </div>

              <button
                type="submit"
                className="flex h-[45px] w-full items-center justify-center gap-4 rounded-[14px] bg-[#079448] px-5 text-[16px] font-extrabold tracking-[-0.02em] text-white shadow-[0_16px_28px_rgba(7,148,72,0.28)] transition hover:-translate-y-0.5 hover:bg-[#087f40] sm:h-[50px] sm:text-[19px]"
              >
                Reveal local prices
                <span className="text-[24px] leading-none">→</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-[10.5px] font-medium text-[#536078] sm:mt-3 sm:text-[13px]">
              <Icon type="shield" className="h-[13px] w-[13px] stroke-[1.9]" />
              No signup. No spam. You’re in control.
            </div>
          </form>

          <div className="mt-2.5 rounded-[13px] border border-[#e3ebe5] bg-white/82 p-3 shadow-[0_8px_18px_rgba(7,22,56,0.045)] backdrop-blur sm:mt-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#079448]">Live example for cleaning</p>
              <p className="rounded-full bg-[#f4fbf6] px-2 py-1 text-[10px] font-black text-[#071638]">Updated 2 min ago ●</p>
            </div>
            <p className="text-[15px] font-black text-[#071638]">Wembley, HA9</p>
            <div className="mt-3 grid grid-cols-4 divide-x divide-[#e5ebef] text-center">
              {[
                ["Avg price", "£80–140", "Most common paid"],
                ["Low", "£60", "10% paid less"],
                ["High", "£210", "10% paid more"],
                ["Overpay risk", "£70+", "If you don’t check"],
              ].map(([label, value, sub]) => (
                <div key={label} className="px-1 first:pl-0 last:pr-0 sm:px-2">
                  <p className="text-[10px] font-semibold text-[#334059] sm:text-[12px]">{label}</p>
                  <p className="mt-1 text-[16px] font-black tracking-[-0.04em] text-[#071638] sm:text-[22px]">{value}</p>
                  <p className="mt-0.5 hidden text-[11px] font-semibold text-[#334059] sm:block">{sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden rounded-[9px] bg-[#edf7f0] px-3 py-2 text-[12px] font-semibold text-[#071638] sm:block">
              ⓘ Prices update constantly as new jobs are completed in your area.
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-[14px] bg-[#06182d] px-4 py-3.5 text-white shadow-[0_14px_30px_rgba(7,22,56,0.16)] lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#18b857]">
                  <span className="h-2 w-2 rounded-full bg-[#18b857]" />
                  Recent market update
                </p>
                <p className="mt-1.5 text-[16px] font-extrabold leading-[1.22] tracking-[-0.025em]">
                  Cleaning guide prices are up 8% in London
                </p>
                <p className="mt-1 text-[12px] font-medium leading-[1.35] text-white/66">
                  Fair ranges help you avoid booking blind.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#079448] px-2.5 py-1 text-[12px] font-extrabold">+8%</span>
            </div>

            <svg viewBox="0 0 300 54" className="mt-2 h-[42px] w-full fill-none" aria-hidden="true">
              <path d="M0 43H300M0 27H300M0 11H300" className="stroke-white/10 stroke-[1]" />
              <path
                d="M4 42 C31 42 39 39 59 40 C78 41 90 36 108 35 C131 34 142 31 160 28 C179 25 188 27 204 21 C224 14 237 18 252 11 C270 4 283 8 296 3"
                className="stroke-[#0bbf4d] stroke-[2.6]"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="296" cy="3" r="3.5" className="fill-[#0bbf4d]" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}