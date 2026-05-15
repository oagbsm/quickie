"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const asset = (path: string) => `/quickola/${path}`;

const popularSearches = [
  { label: "Cleaning", icon: "✣", service: "cleaning", postcode: "E17 6AA" },
  { label: "Plumber", icon: "▣", service: "plumber", postcode: "E17 6AA" },
  { label: "Man and van", icon: "▱", service: "man-and-van", postcode: "E17 6AA" },
  { label: "Locksmith", icon: "▤", service: "locksmith", postcode: "E17 6AA" },
  { label: "More", icon: "…", service: "cleaning", postcode: "E17 6AA" },
];

const serviceSuggestions = [
  "Cleaning",
  "End of Tenancy Cleaning",
  "Man and Van",
  "Removals",
  "Plumber",
  "Electrician",
  "Locksmith",
  "Handyman",
  "Gardener",
  "Pest Control",
  "Painter / Decorator",
  "Carpet Cleaning",
  "Oven Cleaning",
  "Waste Removal",
  "Appliance Repair",
];

const supportedPostcodeAreas = ["BR", "CR", "DA", "E", "EC", "EN", "HA", "IG", "KT", "N", "NW", "RM", "SE", "SM", "SW", "TW", "UB", "W", "WC", "WD"];

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

function isSupportedLondonPostcode(value: string) {
  const area = getPostcodeArea(value);
  return area ? supportedPostcodeAreas.includes(area) : false;
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.25]"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.4]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-none stroke-[#071638] stroke-[2.2]"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </svg>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normaliseValue(value: string) {
  return value.trim().toLowerCase();
}

function findExactOption(value: string, options: string[]) {
  const normalised = normaliseValue(value);
  return options.find((option) => normaliseValue(option) === normalised);
}

function SuggestionMenu({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[18px] border border-[#dfe5ee] bg-white shadow-[0_18px_40px_rgba(7,22,56,0.16)]">
      <div className="max-h-[238px] overflow-y-auto p-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(item);
            }}
            className="flex h-11 w-full items-center justify-between rounded-[12px] px-3.5 text-left text-[14px] font-extrabold text-[#071638] transition hover:bg-[#f1faf3] hover:text-[#08783f]"
          >
            <span>{item}</span>
            <span className="text-[15px] text-[#08783f]">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const router = useRouter();
  const [service, setService] = useState("");
  const [postcode, setPostcode] = useState("");
  const [activeField, setActiveField] = useState<"service" | null>(null);
  const [errors, setErrors] = useState<{ service?: string; postcode?: string }>({});
  const deferredService = useDeferredValue(service);

  const filteredServices = useMemo(() => {
    const query = deferredService.trim().toLowerCase();
    if (!query) return serviceSuggestions.slice(0, 7);

    return serviceSuggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 7);
  }, [deferredService]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveField(null);

    const trimmedService = service.trim();
    const trimmedPostcode = postcode.trim();
    const formattedPostcode = formatPostcode(trimmedPostcode);

    const validService = findExactOption(trimmedService, serviceSuggestions);
    const validPostcode = isValidUkPostcode(formattedPostcode);
    const supportedPostcode = isSupportedLondonPostcode(formattedPostcode);

    if (!trimmedService || !trimmedPostcode || !validService || !validPostcode || !supportedPostcode) {
      setErrors({
        service: !trimmedService
          ? "Choose a service first."
          : !validService
            ? "Select a service from the list."
            : undefined,
        postcode: !trimmedPostcode
          ? "Enter your postcode."
          : !validPostcode
            ? "Enter a valid UK postcode."
            : !supportedPostcode
              ? "We only support London and nearby postcodes right now."
              : undefined,
      });
      setActiveField(!trimmedService || !validService ? "service" : null);
      return;
    }

    setErrors({});
    setService(validService);
    setPostcode(formattedPostcode);

    const serviceSlug = slugify(validService);

    router.push(`/check-price?service=${serviceSlug}&postcode=${encodeURIComponent(formattedPostcode)}`);
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative w-full overflow-hidden bg-white lg:min-h-[760px] lg:bg-[#071638]">
        <img
          src={asset("bg.png")}
          alt="London skyline"
          className="absolute inset-0 hidden h-full w-full scale-[1.015] object-cover object-[center_47%] lg:block"
        />

        <div className="absolute inset-0 hidden bg-black/0 lg:block" />
        <div className="absolute inset-x-0 bottom-0 hidden h-[48%] bg-[linear-gradient(180deg,rgba(7,22,56,0)_0%,rgba(7,22,56,0.78)_100%)] lg:block" />

        <div className="relative z-10 mx-auto max-w-[1366px] px-[20px] pb-[16px] pt-[86px] sm:px-8 sm:pb-[52px] sm:pt-[52px] lg:px-[74px] lg:pb-[92px] lg:pt-[82px]">
          <div className="relative inline-flex max-w-full items-center gap-[6px] rounded-full bg-white px-[10px] py-[6px] text-[8.5px] font-black uppercase tracking-[0.06em] text-[#08783f] shadow-[0_4px_14px_rgba(7,22,56,0.08)] ring-1 ring-[#e5eaf1] sm:text-[11px] lg:text-[12px] lg:bg-white/92 lg:text-[#071638] lg:shadow-[0_10px_28px_rgba(15,23,42,0.1)] lg:ring-white/85">
            <span className="text-[13px] leading-none">←</span>
            FAIR PRICES, LOCAL PROS, NO HASSLE
          </div>

          <h1 className="relative mt-[15px] max-w-[780px] text-[33px] font-black leading-[1.03] tracking-[-0.055em] text-[#071638] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)] sm:mt-[28px] sm:text-[59px] lg:mt-[34px] lg:text-[68px]">
            Know the <span className="text-[#08783f]">fair price</span>
            <br />
            before you book.
          </h1>

          <div className="relative mt-[12px] max-w-[650px]">
            <p className="max-w-[260px] text-[14px] font-bold leading-[1.45] tracking-[-0.01em] text-[#172545] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:max-w-none sm:text-[19px] lg:text-[20px]">
              Check local prices for cleaners, plumbers, removals, locksmiths and more.
            </p>

            <div className="mt-[12px] flex flex-col gap-[5px] text-[13px] font-extrabold text-[#071638] sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:text-[15px]">
              {["Prices first", "No booking pressure", "Trusted local professionals"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="grid h-[16px] w-[16px] place-items-center rounded-full border border-[#08783f] text-[10px] leading-none text-[#08783f] sm:h-5 sm:w-5 sm:text-[12px]">
                    ✓
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <form
            id="hero-price-form"
            onSubmit={handleSubmit}
            className="relative mt-[16px] w-full max-w-[1128px] rounded-[15px] border border-[#e5eaf1] bg-white p-[12px] shadow-[0_10px_28px_rgba(7,22,56,0.07)] backdrop-blur-md sm:mt-[30px] sm:rounded-[24px] sm:p-[20px] lg:mt-[36px] lg:border-white/80 lg:bg-white/96 lg:p-[24px] lg:shadow-[0_26px_70px_rgba(7,22,56,0.18)]"
          >
            <div className="grid gap-[10px] lg:grid-cols-[400px_365px_250px] lg:items-end lg:gap-[24px]">
              <label className="relative block">
                <span className="mb-[7px] block text-[13px] font-black tracking-[-0.01em] text-[#071638] lg:mb-[12px] lg:text-[15px]">
                  What do you need?
                </span>
                <div
                  className={`relative flex h-[40px] items-center gap-[11px] rounded-[9px] border bg-white px-[13px] focus-within:ring-4 lg:h-[58px] lg:rounded-[15px] lg:px-[16px] ${
                    errors.service
                      ? "border-[#d93025] focus-within:border-[#d93025] focus-within:ring-[#d93025]/10"
                      : "border-[#dfe5ee] focus-within:border-[#08783f] focus-within:ring-[#08783f]/10"
                  }`}
                >
                  <SearchIcon />
                  <input
                    id="service-input"
                    value={service}
                    onChange={(event) => {
                      setService(event.target.value);
                      if (errors.service) setErrors((current) => ({ ...current, service: undefined }));
                      setActiveField("service");
                    }}
                    onFocus={() => setActiveField("service")}
                    onBlur={() => {
                      setActiveField(null);
                      const validService = findExactOption(service, serviceSuggestions);
                      if (service.trim() && !validService) {
                        setErrors((current) => ({ ...current, service: "Select a service from the list." }));
                      }
                    }}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-[13px] font-bold tracking-[-0.01em] text-[#071638] outline-none placeholder:text-[#8b94a7] lg:text-[16px]"
                    placeholder="Cleaning"
                  />
                  <span className="text-xl text-[#071638]">⌄</span>
                </div>
                {errors.service ? (
                  <p className="mt-2 text-[13px] font-extrabold text-[#d93025]">{errors.service}</p>
                ) : null}
                {activeField === "service" ? (
                  <SuggestionMenu
                    items={filteredServices}
                    onPick={(value) => {
                      setService(value);
                      setErrors((current) => ({ ...current, service: undefined }));
                      setActiveField(null);
                    }}
                  />
                ) : null}
              </label>

              <label className="relative block">
                <span className="mb-[7px] block text-[13px] font-black tracking-[-0.01em] text-[#071638] lg:mb-[12px] lg:text-[15px]">
                  Your area
                </span>
                <div
                  className={`relative flex h-[40px] items-center gap-[11px] rounded-[9px] border bg-white px-[13px] focus-within:ring-4 lg:h-[58px] lg:rounded-[15px] lg:px-[16px] ${
                    errors.postcode
                      ? "border-[#d93025] focus-within:border-[#d93025] focus-within:ring-[#d93025]/10"
                      : "border-[#dfe5ee] focus-within:border-[#08783f] focus-within:ring-[#08783f]/10"
                  }`}
                >
                  <PinIcon />
                  <input
                    value={postcode}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
                      setPostcode(nextValue);
                      if (errors.postcode) setErrors((current) => ({ ...current, postcode: undefined }));
                    }}
                    onBlur={() => {
                      if (!postcode.trim()) return;

                      const formattedPostcode = formatPostcode(postcode);
                      setPostcode(formattedPostcode);

                      if (!isValidUkPostcode(formattedPostcode)) {
                        setErrors((current) => ({ ...current, postcode: "Enter a valid UK postcode." }));
                        return;
                      }

                      if (!isSupportedLondonPostcode(formattedPostcode)) {
                        setErrors((current) => ({ ...current, postcode: "We only support London and nearby postcodes right now." }));
                      }
                    }}
                    autoComplete="postal-code"
                    inputMode="text"
                    maxLength={8}
                    className="min-w-0 flex-1 bg-transparent text-[13px] font-bold uppercase tracking-[-0.01em] text-[#071638] outline-none placeholder:normal-case placeholder:text-[#8b94a7] lg:text-[16px]"
                    placeholder="Walthamstow, E17"
                  />
                  <TargetIcon />
                </div>
                {errors.postcode ? (
                  <p className="mt-2 text-[13px] font-extrabold text-[#d93025]">{errors.postcode}</p>
                ) : null}
              </label>

              <button
                type="submit"
                className="flex h-[42px] items-center justify-center gap-[13px] rounded-[8px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-[22px] text-[14px] font-black tracking-[-0.01em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,104,47,0.3)] lg:h-[58px] lg:gap-[18px] lg:rounded-[15px] lg:text-[19px]"
              >
                See price range
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[17px] leading-none text-[#08783f] lg:h-8 lg:w-8 lg:text-[22px]">
                  →
                </span>
              </button>
            </div>
          </form>

          <p className="mt-[8px] flex items-center justify-center gap-2 pl-0 text-[11px] font-bold text-[#5d687c] sm:justify-start sm:pl-[12px] lg:pl-[24px] lg:text-[14px] lg:text-white/92">
            <span className="text-[15px]">▣</span>
            No signup needed.
          </p>

          <div className="mt-[16px] max-w-[1080px] pl-0 sm:pl-[12px] lg:mt-[30px] lg:pl-[24px]">
            <div className="mb-[8px] flex items-center justify-between">
              <p className="text-[12px] font-black tracking-[-0.01em] text-[#071638] lg:text-[14px] lg:text-white/92">
                Popular services
              </p>
              <a href="/check-price" className="text-[10px] font-extrabold text-[#5d687c] lg:hidden">
                See all
              </a>
            </div>

            <div className="grid grid-cols-5 gap-[9px] sm:flex sm:flex-wrap sm:gap-[14px] lg:gap-[16px]">
              {popularSearches.map((item) => (
                <a
                  key={item.label}
                  href={`/check-price?service=${item.service}&postcode=${encodeURIComponent(item.postcode)}`}
                  className="flex min-w-0 flex-col items-center justify-center gap-[5px] rounded-[8px] bg-white px-[2px] py-[6px] text-center text-[8.5px] font-extrabold tracking-[-0.03em] text-[#071638] shadow-[0_5px_14px_rgba(7,22,56,0.05)] ring-1 ring-[#e5eaf1] transition hover:-translate-y-0.5 hover:bg-white sm:inline-flex sm:h-[44px] sm:flex-row sm:gap-[10px] sm:rounded-full sm:px-[22px] sm:py-0 sm:text-[14px] lg:h-[50px] lg:gap-[12px] lg:bg-white/92 lg:px-[24px] lg:text-[15px] lg:shadow-[0_12px_28px_rgba(7,22,56,0.16)] lg:ring-white/80"
                >
                  <span className="grid h-[24px] w-[24px] place-items-center rounded-[7px] bg-[#f7fafc] text-[13px] text-[#071638] ring-1 ring-[#edf1f5] sm:h-auto sm:w-auto sm:bg-transparent sm:text-base sm:ring-0 lg:text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}