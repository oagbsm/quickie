"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const services = [
  { label: "Man and Van", value: "man-and-van", icon: "van", description: "Small moves, pickups and furniture delivery" },
  { label: "Removals", value: "removals", icon: "van", description: "Flat moves, house moves and larger removals" },
  { label: "Plumbing", value: "plumbing", icon: "plumbing", description: "Leaks, taps, toilets and local call-outs" },
  { label: "Emergency Plumber", value: "emergency-plumber", icon: "plumbing", description: "Urgent leaks, blockages and out-of-hours help" },
  { label: "Electricians", value: "electrician", icon: "bolt", description: "Faults, sockets, lighting and safety checks" },
  { label: "Boiler Repair", value: "boiler-repair", icon: "flame", description: "Heating issues, boiler faults and diagnostics" },
  { label: "Locksmith", value: "locksmith", icon: "key", description: "Lockouts, lock changes and key problems" },
  { label: "Cleaning", value: "cleaning", icon: "cleaning", description: "Home cleaning, regular cleans and one-off jobs" },
  { label: "End of Tenancy Cleaning", value: "end-of-tenancy-cleaning", icon: "cleaning", description: "Move-out cleaning for flats and houses" },
  { label: "Deep Cleaning", value: "deep-cleaning", icon: "cleaning", description: "Heavy cleans, kitchens, bathrooms and full homes" },
  { label: "Carpet Cleaning", value: "carpet-cleaning", icon: "cleaning", description: "Rooms, stains, rugs and upholstery checks" },
  { label: "Oven Cleaning", value: "oven-cleaning", icon: "cleaning", description: "Single ovens, double ovens and extractor cleans" },
  { label: "Gardener", value: "gardener", icon: "leaf", description: "Grass cutting, tidy-ups and garden maintenance" },
  { label: "Handyman", value: "handyman", icon: "tool", description: "Small repairs, mounting, assembly and fixes" },
  { label: "Painter & Decorator", value: "painter-decorator", icon: "tool", description: "Rooms, touch-ups, walls and decorating jobs" },
  { label: "Pest Control", value: "pest-control", icon: "shield", description: "Mice, insects, wasps and treatment checks" },
  { label: "Waste Removal", value: "waste-removal", icon: "van", description: "Bulky waste, garden waste and clearances" },
  { label: "Appliance Repair", value: "appliance-repair", icon: "tool", description: "Washing machines, ovens and appliance faults" },
  { label: "Roof Repair", value: "roof-repair", icon: "tool", description: "Leaks, tiles, guttering and roof checks" },
  { label: "MOT & Car Repairs", value: "mot-car-repairs", icon: "car", description: "MOT checks, diagnostics and garage repairs" },
];

const supportedSloughDistricts = ["SL1", "SL2", "SL3"];

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

function getPostcodeDistrict(value: string) {
  const clean = normalisePostcode(value);
  const match = clean.match(/^(SL[123])/);
  return match ? match[1] : null;
}

function isSupportedSloughPostcode(value: string) {
  const clean = normalisePostcode(value);
  return /^SL[123][A-Z]?\d[A-Z]{2}$/.test(clean);
}

function Icon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  const base = `${className} fill-none stroke-current stroke-[2]`;

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

  if (type === "car") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12 7 7h10l2 5" />
        <path d="M5 12h14v5H5z" />
        <circle cx="8" cy="17" r="1.6" />
        <circle cx="16" cy="17" r="1.6" />
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

  if (type === "flame") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22c4 0 7-2.8 7-6.8 0-3.2-2-5.5-4.2-7.6-.8 2.3-2.2 3.5-3.8 4.4.4-3.3-.8-6.2-3.1-8C7.4 7.8 5 10 5 15.2 5 19.2 8 22 12 22Z" />
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

  if (type === "leaf") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 4c-7.5 0-13 4.8-13 11a5 5 0 0 0 5 5c6.2 0 8-8.2 8-16Z" />
        <path d="M4 20c3.5-5.5 8-8.5 14-10" />
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

  if (type === "pin") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.3" />
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

  if (type === "refresh") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 11a8 8 0 0 0-14.4-4.8L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.4 4.8L20 16" />
        <path d="M20 20v-4h-4" />
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-8" />
      </svg>
    );
  }

  return null;
}

export default function Hero() {
  const router = useRouter();

  const [service, setService] = useState("man-and-van");
  const [serviceSearch, setServiceSearch] = useState("Man and Van");
  const [serviceOpen, setServiceOpen] = useState(false);

  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((item) => item.value === service) ?? services[0],
    [service]
  );

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return services;

    return services.filter((item) => item.label.toLowerCase().includes(query));
  }, [serviceSearch]);

  const hasSelectedValidService = selectedService.label === serviceSearch;

  function chooseService(item: (typeof services)[number], promptPostcode = false) {
    setService(item.value);
    setServiceSearch(item.label);
    setServiceOpen(false);

    if (!promptPostcode) {
      setError(null);
      return;
    }

    setError("Now enter your Slough postcode to see the fair price.");

    window.setTimeout(() => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const formId = isDesktop ? "desktop-price-check-form" : "mobile-price-check-form";
      const inputId = isDesktop ? "desktop-postcode-input" : "mobile-postcode-input";

      document.getElementById(formId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(inputId)?.focus();
    }, 80);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formattedPostcode = formatPostcode(postcode);

    if (!hasSelectedValidService) {
      setError("Choose a service from the dropdown.");
      return;
    }

    if (!formattedPostcode) {
      setError("Enter your Slough postcode.");
      return;
    }

    if (!isValidUkPostcode(formattedPostcode)) {
      setError("Enter a valid Slough postcode, for example SL1 1AA.");
      return;
    }

    if (!isSupportedSloughPostcode(formattedPostcode)) {
      setError("QuickOla only supports Slough postcodes right now. Use an SL1, SL2 or SL3 postcode.");
      return;
    }

    setError(null);
    setPostcode(formattedPostcode);

    router.push(`/check-price?service=${service}&postcode=${encodeURIComponent(formattedPostcode)}`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#f8fbff] pt-[72px] lg:pt-[84px]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(0,98,255,0.08),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(7,148,72,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f7fbff_58%,#ffffff_100%)]" />

      <div className="mx-auto max-w-[1440px] px-4 pb-9 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="grid items-center gap-6 rounded-[26px] border border-[#e6edf7] bg-white/82 p-4 shadow-[0_24px_70px_rgba(7,22,56,0.08)] backdrop-blur lg:grid-cols-[minmax(0,0.95fr)_minmax(430px,0.74fr)] lg:gap-8 lg:p-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(500px,0.78fr)]">
          <div className="pb-1 pt-1 lg:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8f1] px-3.5 py-1.5 text-[11px] font-extrabold tracking-[-0.01em] text-[#07833f] sm:text-[12px]">
              <Icon type="pin" className="h-3.5 w-3.5 stroke-[2.4]" />
              #1 Local Price Discovery Platform in Slough
            </div>

            <h1 className="mt-5 max-w-[670px] text-[42px] font-black leading-[0.98] tracking-[-0.065em] text-[#071638] sm:text-[58px] lg:mt-7 lg:text-[76px] xl:text-[82px]">
              Know the Fair Price{" "}
              <span className="relative inline-block text-[#079448]">
                Before
                <span className="absolute -bottom-1 left-0 h-[5px] w-[72%] rounded-full bg-[#0b63ff] sm:h-[6px]" />
              </span>{" "}
              You Pay
            </h1>

            <p className="mt-5 max-w-[590px] text-[16px] font-medium leading-[1.55] tracking-[-0.02em] text-[#273651] sm:text-[19px] lg:text-[21px]">
              Compare real local service prices in Slough before you book, call or pay — from man and van to MOTs,
              plumbers and cleaners.
            </p>

            <div className="mt-5 flex max-w-[560px] items-start gap-3 text-[#071638]">
              <Icon type="pin" className="mt-0.5 h-6 w-6 shrink-0 text-[#079448]" />
              <p className="text-[16px] font-black leading-[1.25] tracking-[-0.02em] sm:text-[18px]">
                Built for Slough, Wexham, Langley, Cippenham and nearby areas.
              </p>
            </div>

            {/* Mobile form */}
            <form
              id="mobile-price-check-form"
              onSubmit={handleSubmit}
              className="mt-7 max-w-[520px] rounded-[22px] border border-[#e1e9f5] bg-white p-3 shadow-[0_16px_35px_rgba(7,22,56,0.07)] lg:hidden"
            >
              <div className="relative block rounded-[16px] border border-[#e2e9f3] bg-white px-4 py-3">
                <span className="text-[12px] font-extrabold text-[#071638]">Choose a service</span>

                <div className="mt-2 flex items-center gap-3">
                  <Icon type={selectedService.icon} className="h-5 w-5 text-[#0b63ff]" />

                  <input
                    value={serviceSearch}
                    onChange={(event) => {
                      setServiceSearch(event.target.value);
                      setServiceOpen(true);
                      setError(null);
                    }}
                    onFocus={() => setServiceOpen(true)}
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-extrabold text-[#071638] outline-none placeholder:text-[#8b94a7]"
                    placeholder="Type a service e.g. plumber"
                  />

                  <button
                    type="button"
                    onClick={() => setServiceOpen((value) => !value)}
                    className="text-[18px] font-black text-[#071638]"
                    aria-label="Open service list"
                  >
                    ⌄
                  </button>
                </div>

                {serviceOpen ? (
                  <div className="absolute left-0 right-0 top-[86px] z-30 max-h-[260px] overflow-y-auto rounded-[16px] border border-[#dfe7f2] bg-white p-2 shadow-[0_18px_40px_rgba(7,22,56,0.16)]">
                    {filteredServices.length ? (
                      filteredServices.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => chooseService(item)}
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-[#f3f7ff]"
                        >
                          <Icon type={item.icon} className="h-5 w-5 text-[#075cff]" />
                          <span className="text-[14px] font-black text-[#071638]">{item.label}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-[13px] font-bold text-[#d93025]">
                        Choose a service from the dropdown.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <label
                className={`mt-3 block rounded-[16px] border bg-white px-4 py-3 ${
                  error && error.toLowerCase().includes("postcode") ? "border-[#d93025]" : "border-[#e2e9f3]"
                }`}
              >
                <span className="text-[12px] font-extrabold text-[#071638]">Postcode</span>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="mobile-postcode-input"
                    value={postcode}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
                      setPostcode(nextValue);
                      setError(null);
                    }}
                    onBlur={() => {
                      if (postcode.trim()) setPostcode(formatPostcode(postcode));
                    }}
                    autoComplete="postal-code"
                    inputMode="text"
                    maxLength={8}
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-black uppercase tracking-[-0.01em] text-[#071638] outline-none placeholder:normal-case placeholder:text-[#9aa6b8]"
                    placeholder="Enter Slough postcode e.g. SL1 1AA"
                  />
                  <Icon type="pin" className="h-5 w-5 text-[#071638]" />
                </div>
              </label>

              {error ? <p className="mt-2 px-1 text-[12px] font-bold text-[#d93025]">{error}</p> : null}

              <button
                type="submit"
                className="mt-3 flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] bg-[#075cff] text-[16px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.25)]"
              >
                See fair Slough price
                <span className="text-[24px] leading-none">→</span>
              </button>
            </form>

            <div className="mt-5 grid max-w-[520px] grid-cols-2 gap-2 rounded-[16px] bg-[#effaf3] px-3 py-3 text-center sm:grid-cols-4 lg:hidden">
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> Free
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No spam calls
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No payment today
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No paid ranking
              </div>
            </div>

            <div className="mt-5 max-w-[520px] rounded-[22px] border border-[#dbe8ff] bg-[#f8fbff] p-4 shadow-[0_14px_30px_rgba(7,22,56,0.055)] lg:hidden">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e7efff] text-[#075cff]">
                  <Icon type="van" className="h-7 w-7" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black tracking-[-0.02em] text-[#071638]">
                    Example fair Slough price
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[12px] font-bold text-[#273651]">Man and Van</p>
                      <p className="mt-1 text-[24px] font-black tracking-[-0.05em] text-[#075cff]">
                        £40 – £70<span className="text-[13px]">/hr</span>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#52627a]">Typical fair range</p>
                    </div>

                    <div className="border-l border-[#dbe6f7] pl-3">
                      <p className="text-[12px] font-bold text-[#273651]">Check before paying</p>
                      <p className="mt-1 text-[24px] font-black tracking-[-0.05em] text-[#e11925]">
                        £100+<span className="text-[13px]">/hr</span>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#52627a]">May include hidden extras</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[12px] font-semibold text-[#40506a]">
                No spam. No pressure. Just fair local price guidance.
              </p>
            </div>

            {/* Desktop buttons */}
            <form id="desktop-price-check-form" onSubmit={handleSubmit} className="mt-8 hidden items-stretch gap-4 lg:flex">
              <button
                type="submit"
                className="flex h-[64px] items-center justify-center gap-4 rounded-[17px] bg-[#075cff] px-10 text-[18px] font-black text-white shadow-[0_18px_34px_rgba(0,92,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#034ee2]"
              >
                See fair Slough price
                <span className="text-[26px] leading-none">→</span>
              </button>

              <a
                href="#popular-services"
                className="flex h-[64px] items-center justify-center gap-3 rounded-[17px] border border-[#dce5f2] bg-white px-8 text-[17px] font-black text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5"
              >
                See Local Deals
                <span className="rounded-full border border-[#cfd8e7] px-1.5 py-0.5 text-[13px]">◇</span>
              </a>
            </form>

            <div className="mt-8 hidden grid-cols-3 gap-8 lg:grid lg:max-w-[650px]">
              {[
                ["chart", "100% local data", "Based on real local jobs"],
                ["refresh", "Updated regularly", "Prices change. We keep it accurate"],
                ["shield", "No paid ranking", "Fair guidance first"],
              ].map(([icon, title, subtitle]) => (
                <div key={title} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe6f4] bg-white text-[#075cff] shadow-[0_8px_18px_rgba(7,22,56,0.05)]">
                    <Icon type={icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[13px] font-black leading-[1.1] text-[#071638]">{title}</p>
                    <p className="mt-1 text-[12px] font-semibold leading-[1.2] text-[#40506a]">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop card */}
          <div className="hidden lg:block">
            <div className="relative rounded-[28px] border border-[#e1e9f5] bg-white p-5 shadow-[0_28px_65px_rgba(7,22,56,0.11)]">
              <div className="absolute -right-28 top-5 -z-10 h-[430px] w-[430px] rounded-[26px] bg-[linear-gradient(135deg,#eef6ff,#f5fff7)] opacity-80" />

              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-black tracking-[-0.04em] text-[#071638]">Your Price Check</h2>
                  <p className="mt-1 text-[13px] font-semibold text-[#52627a]">Quick local price guidance</p>
                </div>
                <span className="rounded-full bg-[#eaf8ef] px-3 py-1 text-[11px] font-black text-[#079448]">
                  Slough only
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative block">
                  <span className="mb-1.5 block text-[12px] font-extrabold text-[#52627a]">Service</span>

                  <div className="flex h-[54px] items-center gap-3 rounded-[14px] border border-[#dfe7f2] bg-white px-4">
                    <Icon type={selectedService.icon} className="h-5 w-5 text-[#071638]" />

                    <input
                      value={serviceSearch}
                      onChange={(event) => {
                        setServiceSearch(event.target.value);
                        setServiceOpen(true);
                        setError(null);
                      }}
                      onFocus={() => setServiceOpen(true)}
                      className="min-w-0 flex-1 bg-transparent text-[15px] font-black text-[#071638] outline-none placeholder:text-[#8b94a7]"
                      placeholder="Type a service e.g. plumber"
                    />

                    <button
                      type="button"
                      onClick={() => setServiceOpen((value) => !value)}
                      className="text-[18px] font-black text-[#071638]"
                      aria-label="Open service list"
                    >
                      ⌄
                    </button>
                  </div>

                  {serviceOpen ? (
                    <div className="absolute left-0 right-0 top-[76px] z-30 max-h-[280px] overflow-y-auto rounded-[16px] border border-[#dfe7f2] bg-white p-2 shadow-[0_18px_40px_rgba(7,22,56,0.16)]">
                      {filteredServices.length ? (
                        filteredServices.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => chooseService(item)}
                            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-[#f3f7ff]"
                          >
                            <Icon type={item.icon} className="h-5 w-5 text-[#075cff]" />
                            <span className="text-[14px] font-black text-[#071638]">{item.label}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-[13px] font-bold text-[#d93025]">
                          Choose a service from the dropdown.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-extrabold text-[#52627a]">Postcode</span>
                  <div
                    className={`flex h-[54px] items-center gap-3 rounded-[14px] border bg-white px-4 ${
                      error && error.toLowerCase().includes("postcode") ? "border-[#d93025]" : "border-[#dfe7f2]"
                    }`}
                  >
                    <Icon type="pin" className="h-5 w-5 text-[#071638]" />
                    <input
                      id="desktop-postcode-input"
                      value={postcode}
                      onChange={(event) => {
                        const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
                        setPostcode(nextValue);
                        setError(null);
                      }}
                      onBlur={() => {
                        if (postcode.trim()) setPostcode(formatPostcode(postcode));
                      }}
                      autoComplete="postal-code"
                      inputMode="text"
                      maxLength={8}
                      className="min-w-0 flex-1 bg-transparent text-[16px] font-black uppercase text-[#071638] outline-none placeholder:normal-case placeholder:text-[#9aa6b8]"
                      placeholder="Enter Slough postcode e.g. SL1 1AA"
                    />
                  </div>
                </label>

                {error ? <p className="text-[12px] font-bold text-[#d93025]">{error}</p> : null}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-[16px] border border-[#dfe7f2] bg-white p-4">
                    <p className="text-[12px] font-bold text-[#52627a]">Average Local Price</p>
                    <p className="mt-2 text-[38px] font-black tracking-[-0.06em] text-[#071638]">£54</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#52627a]">Typical range: £45 – £65</p>
                  </div>

                  <div className="rounded-[16px] border border-[#dff0e5] bg-[#eefaf3] p-4">
                    <p className="text-[12px] font-bold text-[#07833f]">Cheapest Nearby</p>
                    <p className="mt-2 text-[38px] font-black tracking-[-0.06em] text-[#079448]">£38</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#37543f]">Slough area</p>
                  </div>
                </div>

                <div className="rounded-[16px] bg-[#fff0f1] p-4">
                  <p className="text-[13px] font-black text-[#c31623]">Avoid overpaying by</p>
                  <div className="mt-2 flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[38px] font-black tracking-[-0.05em] text-[#d71920]">27%</p>
                      <p className="text-[12px] font-semibold text-[#503339]">
                        People can overpay when they book without checking
                      </p>
                    </div>
                    <div className="h-20 w-28 rounded-t-full border-[10px] border-b-0 border-[#16a35a] border-r-[#ffd3d5]" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-[54px] w-full rounded-[15px] bg-[#075cff] text-[16px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.22)]"
                >
                  See fair Slough price
                </button>
              </form>

              <div className="mt-4 rounded-[20px] border border-[#dbe8ff] bg-[#f8fbff] p-5">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#e7efff] text-[#075cff]">
                    <Icon type="van" className="h-8 w-8" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-black tracking-[-0.03em] text-[#071638]">
                      Example fair Slough price
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-5">
                      <div>
                        <p className="text-[13px] font-bold text-[#273651]">Man and Van</p>
                        <p className="mt-1 text-[32px] font-black tracking-[-0.06em] text-[#075cff]">
                          £40 – £70<span className="text-[15px]">/hr</span>
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-[#52627a]">Typical fair range</p>
                      </div>

                      <div className="border-l border-[#dbe6f7] pl-5">
                        <p className="text-[13px] font-bold text-[#273651]">Check before paying</p>
                        <p className="mt-1 text-[32px] font-black tracking-[-0.06em] text-[#e11925]">
                          £100+<span className="text-[15px]">/hr</span>
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-[#52627a]">May include hidden extras</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-center text-[13px] font-semibold text-[#40506a]">
                  No spam. No pressure. Just fair local price guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div id="popular-services" className="mt-7 lg:mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#071638] lg:text-[27px]">
Check fair prices for local services            </h2>
            <span className="hidden text-[13px] font-black text-[#075cff] lg:block">Choose a service to start</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {services.slice(0, 12).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => chooseService(item, true)}
className="rounded-[18px] border border-[#e2e9f4] bg-white p-4 text-left shadow-[0_12px_26px_rgba(7,22,56,0.045)] transition hover:-translate-y-0.5 hover:border-[#bcd2ff] hover:bg-[#fbfdff]"              >
                <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f3f7ff] text-[#075cff]">
                  <Icon type={item.icon} className="h-5 w-5" />
                </span>

<p className="mt-4 text-[13px] font-black leading-[1.15] text-[#071638]">{item.label}</p>

<p className="mt-2 min-h-[38px] text-[12px] font-semibold leading-[1.35] text-[#52627a]">
  {item.description}
</p>

<div className="mt-4 inline-flex items-center gap-1 text-[12px] font-black text-[#075cff]">
  Check price <span aria-hidden="true">→</span>
</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[24px] bg-[#061a3d] p-5 text-white shadow-[0_24px_55px_rgba(7,22,56,0.18)] lg:mt-10 lg:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr_260px]">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white text-[#075cff]">
                <Icon type="shield" className="h-7 w-7" />
              </span>

              <div>
                <h2 className="text-[25px] font-black leading-[1.05] tracking-[-0.045em] lg:text-[32px]">
                  Stop overpaying. Start saving.
                </h2>
                <p className="mt-3 max-w-[430px] text-[15px] font-medium leading-[1.55] text-white/78">
                  QuickOla shows you what local provider services should cost in Slough before you book.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Save money", "Avoid overpaying with fair price guidance"],
                ["Save time", "Compare local prices in seconds"],
                ["Choose better", "Make smarter choices with confidence"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[16px] border border-white/10 bg-white/5 p-3 lg:border-0 lg:bg-transparent lg:p-0 lg:text-left"
                >
                  <p className="text-[13px] font-black text-white">{title}</p>
                  <p className="mt-2 text-[11px] font-medium leading-[1.4] text-white/66">{body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.getElementById("popular-services")?.scrollIntoView({ behavior: "smooth" })}
              className="h-[56px] rounded-[15px] bg-[#075cff] px-6 text-[16px] font-black text-white shadow-[0_18px_36px_rgba(0,92,255,0.28)]"
            >
              See Services →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}