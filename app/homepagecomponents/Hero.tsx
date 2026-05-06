"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const asset = (path: string) => `/quickola/${path}`;

const popularSearches = [
{ label: "Cleaning", icon: "✣", service: "cleaning", area: "east-london" },
{ label: "Man and van", icon: "▱", service: "man-and-van", area: "east-london" },
{ label: "Plumber", icon: "◈", service: "plumber", area: "east-london" },
{ label: "End of tenancy", icon: "⌂", service: "end-of-tenancy-cleaning", area: "east-london" },
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

const londonAreas = [
  "East London",
  "West London",
  "North London",
  "South London",
  "Central London",
  "Ilford",
  "Barking",
  "East Ham",
  "Stratford",
  "Walthamstow",
  "Leyton",
  "Leytonstone",
  "Forest Gate",
  "Romford",
  "Dagenham",
  "Hackney",
  "Bethnal Green",
  "Whitechapel",
  "Mile End",
  "Bow",
  "Poplar",
  "Canning Town",
  "Plaistow",
  "Newham",
  "Wanstead",
  "Woodford",
  "Chingford",
  "Seven Kings",
  "Goodmayes",
  "Redbridge",
  "Gants Hill",
  "Manor Park",
  "Upton Park",
  "Ealing",
  "Acton",
  "Chiswick",
  "Hammersmith",
  "Fulham",
  "Chelsea",
  "Kensington",
  "Notting Hill",
  "Hounslow",
  "Richmond",
  "Camden",
  "Islington",
  "Enfield",
  "Croydon",
  "Bromley",
  "Lewisham",
  "Clapham",
  "Brixton",
];

function StarTiny() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-[#08783f] stroke-[2.4]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2.2]"
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
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2.2]"
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
      className="h-5 w-5 fill-none stroke-[#071638] stroke-[2]"
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
  const [area, setArea] = useState("");
  const [activeField, setActiveField] = useState<"service" | "area" | null>(null);
  const [errors, setErrors] = useState<{ service?: string; area?: string }>({});
  const deferredService = useDeferredValue(service);
  const deferredArea = useDeferredValue(area);

  const filteredServices = useMemo(() => {
    const query = deferredService.trim().toLowerCase();
    if (!query) return serviceSuggestions.slice(0, 7);

    return serviceSuggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 7);
  }, [deferredService]);

  const filteredAreas = useMemo(() => {
    const query = deferredArea.trim().toLowerCase();
    if (!query) return londonAreas.slice(0, 7);

    return londonAreas
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 7);
  }, [deferredArea]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveField(null);

    const trimmedService = service.trim();
    const trimmedArea = area.trim();

    const validService = findExactOption(trimmedService, serviceSuggestions);
    const validArea = findExactOption(trimmedArea, londonAreas);

    if (!trimmedService || !trimmedArea || !validService || !validArea) {
      setErrors({
        service: !trimmedService
          ? "Choose a service first."
          : !validService
            ? "Select a service from the list."
            : undefined,
        area: !trimmedArea
          ? "Choose a London area."
          : !validArea
            ? "Select a London area from the list."
            : undefined,
      });
      setActiveField(!trimmedService || !validService ? "service" : "area");
      return;
    }

    setErrors({});
    setService(validService);
    setArea(validArea);

    const serviceSlug = slugify(validService);
    const areaSlug = slugify(validArea);

    router.push(`/check-price?service=${serviceSlug}&area=${areaSlug}`);
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative min-h-[700px] w-full overflow-hidden bg-[#071638] sm:min-h-[650px] lg:min-h-[calc(100vh-72px)] lg:min-h-[760px]">
        <img
          src={asset("bg.png")}
          alt="London skyline"
          className="absolute inset-0 h-full w-full scale-[1.015] object-cover object-[center_47%]"
        />

        <div className="absolute inset-0 bg-black/0" />
        <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,rgba(7,22,56,0)_0%,rgba(7,22,56,0.78)_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1366px] px-5 pb-[42px] pt-[42px] sm:px-8 sm:pb-[64px] sm:pt-[64px] lg:px-[74px] lg:pb-[92px] lg:pt-[82px]">
          <div className="relative inline-flex max-w-full items-center gap-[8px] rounded-full bg-white/92 px-[15px] py-[8px] text-[10px] font-extrabold uppercase tracking-[0.07em] text-[#071638] shadow-[0_10px_28px_rgba(15,23,42,0.1)] ring-1 ring-white/85 sm:text-[11px] lg:text-[12px]">
            <StarTiny />
            Fair local service prices first.
          </div>

          <h1 className="relative mt-[24px] max-w-[780px] text-[43px] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#071638] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)] sm:mt-[28px] sm:text-[59px] lg:mt-[34px] lg:text-[68px]">
            Know the <span className="text-[#08783f]">fair price</span>
            <br />
            before you book.
          </h1>

          <div className="relative mt-[21px] max-w-[650px]">
            <p className="max-w-[560px] text-[16px] font-bold leading-[1.55] tracking-[0.002em] text-[#172545] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:max-w-none sm:text-[19px] lg:text-[20px]">
              Check local prices for cleaners, plumbers, removals, locksmiths and more.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-extrabold text-[#071638] sm:mt-5 sm:gap-x-6 sm:text-[15px]">
              {["Prices first", "15 service categories", "No booking pressure"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-[#08783f] text-[12px] text-[#08783f]">
                    ✓
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative mt-[26px] w-full max-w-[1128px] rounded-[24px] border border-white/80 bg-white/96 p-4 shadow-[0_26px_70px_rgba(7,22,56,0.18)] backdrop-blur-md sm:mt-[30px] sm:p-[20px] lg:mt-[36px] lg:p-[24px]"
          >
            <div className="grid gap-4 lg:grid-cols-[400px_365px_250px] lg:items-end lg:gap-[24px]">
              <label className="relative block">
                <span className="mb-[12px] block text-[14px] font-bold tracking-[-0.005em] text-[#071638] lg:text-[15px]">
                  What do you need?
                </span>
                <div
                  className={`relative flex h-[54px] items-center gap-[12px] rounded-[15px] border bg-white px-[15px] focus-within:ring-4 lg:h-[58px] lg:px-[16px] ${
                    errors.service
                      ? "border-[#d93025] focus-within:border-[#d93025] focus-within:ring-[#d93025]/10"
                      : "border-[#dfe5ee] focus-within:border-[#08783f] focus-within:ring-[#08783f]/10"
                  }`}
                >
                  <SearchIcon />
                  <input
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
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[-0.005em] text-[#071638] outline-none placeholder:text-[#8b94a7]"
                    placeholder="Cleaner, plumber, man and van..."
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
                <span className="mb-[12px] block text-[14px] font-bold tracking-[-0.005em] text-[#071638] lg:text-[15px]">
                  Your area
                </span>
                <div
                  className={`relative flex h-[54px] items-center gap-[12px] rounded-[15px] border bg-white px-[15px] focus-within:ring-4 lg:h-[58px] lg:px-[16px] ${
                    errors.area
                      ? "border-[#d93025] focus-within:border-[#d93025] focus-within:ring-[#d93025]/10"
                      : "border-[#dfe5ee] focus-within:border-[#08783f] focus-within:ring-[#08783f]/10"
                  }`}
                >
                  <PinIcon />
                  <input
                    value={area}
                    onChange={(event) => {
                      setArea(event.target.value);
                      if (errors.area) setErrors((current) => ({ ...current, area: undefined }));
                      setActiveField("area");
                    }}
                    onFocus={() => setActiveField("area")}
                    onBlur={() => {
                      setActiveField(null);
                      const validArea = findExactOption(area, londonAreas);
                      if (area.trim() && !validArea) {
                        setErrors((current) => ({ ...current, area: "Select a London area from the list." }));
                      }
                    }}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[-0.005em] text-[#071638] outline-none placeholder:text-[#8b94a7]"
                    placeholder="e.g. Fulham, Ilford"
                  />
                  <TargetIcon />
                </div>
                {errors.area ? (
                  <p className="mt-2 text-[13px] font-extrabold text-[#d93025]">{errors.area}</p>
                ) : null}
                {activeField === "area" ? (
                  <SuggestionMenu
                    items={filteredAreas}
                    onPick={(value) => {
                      setArea(value);
                      setErrors((current) => ({ ...current, area: undefined }));
                      setActiveField(null);
                    }}
                  />
                ) : null}
              </label>

              <button
                type="submit"
                className="flex h-[54px] items-center justify-center gap-[16px] rounded-[15px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-[22px] text-[18px] font-bold tracking-[0.002em] text-white shadow-[0_14px_30px_rgba(0,104,47,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,104,47,0.3)] lg:h-[58px] lg:gap-[18px] lg:text-[19px]"
              >
                See price range
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[20px] leading-none text-[#08783f] lg:h-8 lg:w-8 lg:text-[22px]">
                  →
                </span>
              </button>
            </div>
          </form>

          <p className="mt-4 flex items-center gap-2 pl-0 text-[14px] font-bold text-white/92 sm:pl-[12px] lg:pl-[24px]">
            <span className="text-[15px]">▣</span>
            No signup needed. See the fair range first.
          </p>

          <div className="mt-[24px] max-w-[1080px] pl-0 sm:pl-[12px] lg:mt-[30px] lg:pl-[24px]">
            <p className="mb-[12px] text-[13px] font-extrabold tracking-[0.01em] text-white/92 lg:text-[14px]">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-[10px] sm:gap-[14px] lg:gap-[16px]">
              {popularSearches.map((item) => (
                <a
                  key={item.label}
                  href={`/check-price?service=${item.service}&area=${item.area}`}
                  className="inline-flex h-[42px] items-center gap-[8px] rounded-full bg-white/92 px-[16px] text-[13px] font-extrabold tracking-[0em] text-[#071638] shadow-[0_12px_28px_rgba(7,22,56,0.16)] ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white sm:h-[44px] sm:gap-[10px] sm:px-[22px] sm:text-[14px] lg:h-[50px] lg:gap-[12px] lg:px-[24px] lg:text-[15px]"
                >
                  <span className="text-lg text-[#071638]">{item.icon}</span>
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