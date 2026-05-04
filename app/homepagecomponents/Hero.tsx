"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const asset = (path: string) => `/quickola/${path}`;

const popularSearches = [
  { label: "Cleaner today", icon: "✣", service: "cleaner", area: "ilford" },
  { label: "Man with van", icon: "▱", service: "man-with-van", area: "ilford" },
  { label: "Plumber emergency", icon: "⌕", service: "plumber-emergency", area: "walthamstow" },
  { label: "End of tenancy clean", icon: "⌂", service: "end-of-tenancy-clean", area: "barking" },
  { label: "Small move", icon: "□", service: "small-move", area: "east-ham" },
];

const serviceSuggestions = [
  "Cleaner",
  "End of tenancy clean",
  "Deep cleaning",
  "Regular house cleaning",
  "Plumber",
  "Emergency plumber",
  "Man with van",
  "Small move",
  "Furniture removal",
  "House removal",
];

const eastLondonAreas = [
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
];

function StarTiny() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-[#08783f] stroke-[2.4]"
      strokeLinecap="round"
      strokeLinejoin="round"
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
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[14px] border border-[#dfe5ee] bg-white shadow-[0_12px_28px_rgba(7,22,56,0.13)]">
      <div className="max-h-[218px] overflow-y-auto p-1.5">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(item);
            }}
            className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[14px] font-extrabold text-[#071638] hover:bg-[#f1faf3] hover:text-[#08783f]"
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
    return serviceSuggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 6);
  }, [deferredService]);

  const filteredAreas = useMemo(() => {
    const query = deferredArea.trim().toLowerCase();
    return eastLondonAreas
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 7);
  }, [deferredArea]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveField(null);

    const trimmedService = service.trim();
    const trimmedArea = area.trim();

    const validService = findExactOption(trimmedService, serviceSuggestions);
    const validArea = findExactOption(trimmedArea, eastLondonAreas);

    if (!trimmedService || !trimmedArea || !validService || !validArea) {
      setErrors({
        service: !trimmedService
          ? "Choose a service first."
          : !validService
            ? "Select a service from the list."
            : undefined,
        area: !trimmedArea
          ? "Choose an East London area."
          : !validArea
            ? "Select an East London area from the list."
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
      <div className="relative min-h-[620px] w-full overflow-hidden bg-[#071638] sm:min-h-[635px] lg:min-h-[646px]">
        <img
          src={asset("bg.png")}
          alt="London skyline"
          className="absolute inset-0 h-full w-full object-cover object-[center_47%]"
        />
        <div className="absolute inset-0 bg-white/5" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,rgba(7,22,56,0)_0%,rgba(7,22,56,0.86)_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1366px] px-5 pb-[58px] pt-[62px] sm:px-8 lg:px-[74px] lg:pb-[60px] lg:pt-[68px]">
          <div className="inline-flex max-w-full items-center gap-[8px] rounded-full bg-white/80 px-[14px] py-[7px] text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#071638] shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/70 sm:text-[11px] lg:text-[12px]">
            <StarTiny />
            Fair prices. Trusted businesses. Real people.
          </div>

          <h1 className="mt-[28px] max-w-[700px] text-[48px] font-extrabold leading-[1] tracking-[-0.025em] text-[#071638] sm:text-[59px] lg:mt-[34px] lg:text-[69px]">
            Know the <span className="text-[#07813c]">fair price</span>
            <br />
            before you book.
          </h1>

          <p className="mt-[19px] max-w-[590px] text-[17px] font-semibold leading-[1.5] tracking-[0.002em] text-[#172545] sm:text-[19px] lg:text-[21px]">
            Get local prices, availability and reviews from trusted businesses in minutes.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-[30px] w-full max-w-[1128px] rounded-[16px] border border-[#dfe5ee] bg-white p-4 shadow-[0_22px_55px_rgba(7,22,56,0.18)] sm:p-[20px] lg:mt-[34px] lg:p-[25px]"
          >
            <div className="grid gap-4 lg:grid-cols-[390px_365px_250px] lg:items-end lg:gap-[32px]">
              <label className="relative block">
                <span className="mb-[12px] block text-[14px] font-bold tracking-[-0.005em] text-[#071638] lg:text-[15px]">
                  What do you need help with?
                </span>
                <div
                  className={`relative flex h-[50px] items-center gap-[12px] rounded-[8px] border bg-white px-[15px] focus-within:ring-4 lg:h-[55px] lg:px-[16px] ${
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
                    placeholder="e.g. Cleaner, Plumber, Man with van"
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
                  Where?
                </span>
                <div
                  className={`relative flex h-[50px] items-center gap-[12px] rounded-[8px] border bg-white px-[15px] focus-within:ring-4 lg:h-[55px] lg:px-[16px] ${
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
                      const validArea = findExactOption(area, eastLondonAreas);
                      if (area.trim() && !validArea) {
                        setErrors((current) => ({ ...current, area: "Select an East London area from the list." }));
                      }
                    }}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[-0.005em] text-[#071638] outline-none placeholder:text-[#8b94a7]"
                    placeholder="East London only, e.g. Ilford"
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
                className="flex h-[52px] items-center justify-center gap-[18px] rounded-[10px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-[22px] text-[18px] font-bold tracking-[-0.005em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.25)] lg:h-[60px] lg:gap-[20px] lg:text-[20px]"
              >
                Check price now
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[20px] leading-none text-[#08783f] lg:h-8 lg:w-8 lg:text-[22px]">
                  →
                </span>
              </button>
            </div>
          </form>

          <div className="mt-[26px] max-w-[1080px] pl-0 sm:pl-[12px] lg:mt-[34px] lg:pl-[28px]">
            <p className="mb-[12px] text-[13px] font-bold tracking-[0.01em] text-white/90 lg:text-[14px]">
              Popular East London searches
            </p>
            <div className="flex flex-wrap gap-[10px] sm:gap-[14px] lg:gap-[16px]">
              {popularSearches.map((item) => (
                <a
                  key={item.label}
                  href={`/check-price?service=${item.service}&area=${item.area}`}
                  className="inline-flex h-[40px] items-center gap-[8px] rounded-full bg-white px-[16px] text-[13px] font-bold tracking-[-0.005em] text-[#071638] shadow-[0_12px_28px_rgba(7,22,56,0.18)] transition hover:-translate-y-0.5 sm:h-[44px] sm:gap-[10px] sm:px-[22px] sm:text-[14px] lg:h-[52px] lg:gap-[12px] lg:px-[25px] lg:text-[15px]"
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
