

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const cumarServices = [
  {
    label: "Man and Van",
    value: "man-and-van",
    icon: "van",
    description: "Small moves, pickups and furniture delivery",
  },


  {
    label: "Local Helper",
    value: "local-helper",
    icon: "tool",
    description: "Labourer, lifting help, small rubbish jobs, flat-pack and quick local tasks",
  },

  {
    label: "Removals",
    value: "removals",
    icon: "van",
    description: "Flat moves, house moves and larger removals",
  },
  {
    label: "Plumbing",
    value: "plumbing",
    icon: "plumbing",
    description: "Leaks, taps, toilets and local call-outs",
  },
  {
    label: "Emergency Plumber",
    value: "emergency-plumber",
    icon: "plumbing",
    description: "Urgent leaks, blockages and out-of-hours help",
  },
  {
    label: "Electricians",
    value: "electrician",
    icon: "bolt",
    description: "Faults, sockets, lighting and safety checks",
  },
  {
    label: "Boiler Repair",
    value: "boiler-repair",
    icon: "flame",
    description: "Heating issues, boiler faults and diagnostics",
  },
  {
    label: "Locksmith",
    value: "locksmith",
    icon: "key",
    description: "Lockouts, lock changes and key problems",
  },
  {
    label: "Cleaning",
    value: "cleaning",
    icon: "cleaning",
    description: "Home cleaning, regular cleans and one-off jobs",
  },
  {
    label: "End of Tenancy Cleaning",
    value: "end-of-tenancy-cleaning",
    icon: "cleaning",
    description: "Move-out cleaning for flats and houses",
  },
  {
    label: "Deep Cleaning",
    value: "deep-cleaning",
    icon: "cleaning",
    description: "Heavy cleans, kitchens, bathrooms and full homes",
  },
  {
    label: "Carpet Cleaning",
    value: "carpet-cleaning",
    icon: "cleaning",
    description: "Rooms, stains, rugs and upholstery checks",
  },
  {
    label: "Oven Cleaning",
    value: "oven-cleaning",
    icon: "cleaning",
    description: "Single ovens, double ovens and extractor cleans",
  },
  {
    label: "Gardener",
    value: "gardener",
    icon: "leaf",
    description: "Grass cutting, tidy-ups and garden maintenance",
  },
  {
    label: "Handyman",
    value: "handyman",
    icon: "tool",
    description: "Small repairs, mounting, assembly and fixes",
  },
  {
    label: "Painter & Decorator",
    value: "painter-decorator",
    icon: "tool",
    description: "Rooms, touch-ups, walls and decorating jobs",
  },
  {
    label: "Pest Control",
    value: "pest-control",
    icon: "shield",
    description: "Mice, insects, wasps and treatment checks",
  },
  {
    label: "Waste Removal",
    value: "waste-removal",
    icon: "van",
    description: "Bulky waste, garden waste and clearances",
  },
  {
    label: "Appliance Repair",
    value: "appliance-repair",
    icon: "tool",
    description: "Washing machines, ovens and appliance faults",
  },
  {
    label: "Roof Repair",
    value: "roof-repair",
    icon: "tool",
    description: "Leaks, tiles, guttering and roof checks",
  },
  {
    label: "MOT & Car Repairs",
    value: "mot-car-repairs",
    icon: "car",
    description: "MOT checks, diagnostics and garage repairs",
  },
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

function isSupportedSloughPostcode(value: string) {
  const clean = normalisePostcode(value);
  return /^SL[123][A-Z]?\d[A-Z]{2}$/.test(clean);
}

export function CumarIcon({
  type,
  className = "h-5 w-5",
}: {
  type: string;
  className?: string;
}) {
  const base = `${className} fill-none stroke-current stroke-[2]`;

  if (type === "search") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m16 16 4 4" />
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

function PriceCtaButton({
  className = "",
  isSubmitting = false,
}: {
  className?: string;
  isSubmitting?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`group relative flex h-[54px] w-full items-center justify-center overflow-hidden rounded-[15px] bg-[#075cff] px-5 text-[16px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004fe6] hover:shadow-[0_22px_44px_rgba(0,92,255,0.34)] active:translate-y-0 active:scale-[0.985] active:bg-[#003fc2] focus:outline-none focus:ring-4 focus:ring-[#075cff]/25 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.26)_45%,transparent_72%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
      <span className="relative z-10 flex items-center gap-3">
        {isSubmitting ? "Saving price check..." : "See fair Slough price"}
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/16 text-[25px] leading-none transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-2">
          →
        </span>
      </span>
    </button>
  );
}

type CumarIntakeFormProps = {
  variant?: "mobile" | "desktop";
  showExample?: boolean;
  className?: string;
};

export default function CumarIntakeForm({
  variant = "desktop",
  showExample = true,
  className = "",
}: CumarIntakeFormProps) {
  const router = useRouter();

  const [service, setService] = useState("man-and-van");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(
    () => cumarServices.find((item) => item.value === service) ?? cumarServices[0],
    [service]
  );

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return cumarServices;

return cumarServices.filter((item) => {
  const searchableText = `${item.label} ${item.description}`.toLowerCase();
  return searchableText.includes(query);
});  }, [serviceSearch]);

  const hasSelectedValidService = selectedService.label === serviceSearch;

  function chooseService(item: (typeof cumarServices)[number]) {
    setService(item.value);
    setServiceSearch(item.label);
    setServiceOpen(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formattedPostcode = formatPostcode(postcode);

    if (!serviceSearch.trim()) {
      setError("Enter the service you need, then choose it from the dropdown.");
      return;
    }

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
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cumar-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
body: JSON.stringify({
  service,
  service_label: selectedService.label,
  postcode: formattedPostcode,
  source: "homepage_cumar",
  cumar_mode: process.env.NEXT_PUBLIC_CUMAR_MODE || "rules",
  provider_lane: service === "local-helper" ? "local_helper" : "local_business",
  job_size: service === "local-helper" ? "small" : "normal",
  job_risk: service === "local-helper" ? "low" : "medium",
}),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The Cumar intake route is not returning JSON. Check app/api/cumar-intake/route.ts exists, then restart npm run dev."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not save your price check.");
      }

      const params = new URLSearchParams({
        service,
        postcode: formattedPostcode,
      });

      if (data?.request_id) {
        params.set("request_id", data.request_id);
      }

      router.push(`/check-price?${params.toString()}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMobile = variant === "mobile";
  const formId = isMobile ? "mobile-price-check-form" : "desktop-price-check-form";
  const postcodeInputId = isMobile ? "mobile-postcode-input" : "desktop-postcode-input";

  if (isMobile) {
    return (
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={`rounded-[22px] border border-[#e1e9f5] bg-white p-3 shadow-[0_16px_35px_rgba(7,22,56,0.07)] ${className}`}
      >
        <div className="relative block rounded-[16px] border border-[#e2e9f3] bg-white px-4 py-3">
          <span className="text-[12px] font-extrabold text-[#071638]">Choose a service</span>

          <div className="mt-2 flex items-center gap-3">
            <CumarIcon type={serviceSearch ? selectedService.icon : "search"} className="h-5 w-5 text-[#0b63ff]" />
            <input
              value={serviceSearch}
              onChange={(event) => {
                setServiceSearch(event.target.value);
                setServiceOpen(true);
                setError(null);
              }}
              onFocus={() => setServiceOpen(true)}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-extrabold text-[#071638] outline-none placeholder:text-[#8b94a7]"
              placeholder="Enter service needed"
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

          {serviceOpen ? <ServiceDropdown services={filteredServices} onChoose={chooseService} /> : null}
        </div>

        <PostcodeField
          id={postcodeInputId}
          postcode={postcode}
          setPostcode={setPostcode}
          setError={setError}
          hasError={Boolean(error && error.toLowerCase().includes("postcode"))}
          compact
        />

        {error ? <p className="mt-2 px-1 text-[12px] font-bold text-[#d93025]">{error}</p> : null}

        <PriceCtaButton className="mt-3 h-[52px] rounded-[14px]" isSubmitting={isSubmitting} />
      </form>
    );
  }

  return (
    <div className={`relative rounded-[28px] border border-[#e1e9f5] bg-white p-5 shadow-[0_28px_65px_rgba(7,22,56,0.11)] ${className}`}>
      <div className="absolute -right-28 top-5 -z-10 h-[430px] w-[430px] rounded-[26px] bg-[linear-gradient(135deg,#eef6ff,#f5fff7)] opacity-80" />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black tracking-[-0.04em] text-[#071638]">Your Price Check</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#52627a]">Quick local price guidance</p>
        </div>
        <span className="rounded-full bg-[#eaf8ef] px-3 py-1 text-[11px] font-black text-[#079448]">Slough only</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative block">
          <span className="mb-1.5 block text-[12px] font-extrabold text-[#52627a]">Service</span>

          <div className="flex h-[54px] items-center gap-3 rounded-[14px] border border-[#dfe7f2] bg-white px-4">
            <CumarIcon type={serviceSearch ? selectedService.icon : "search"} className="h-5 w-5 text-[#071638]" />
            <input
              value={serviceSearch}
              onChange={(event) => {
                setServiceSearch(event.target.value);
                setServiceOpen(true);
                setError(null);
              }}
              onFocus={() => setServiceOpen(true)}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-black text-[#071638] outline-none placeholder:text-[#8b94a7]"
              placeholder="Enter service needed"
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

          {serviceOpen ? <ServiceDropdown services={filteredServices} onChoose={chooseService} desktop /> : null}
        </div>

        <PostcodeField
          id={postcodeInputId}
          postcode={postcode}
          setPostcode={setPostcode}
          setError={setError}
          hasError={Boolean(error && error.toLowerCase().includes("postcode"))}
        />

        {error ? <p className="text-[12px] font-bold text-[#d93025]">{error}</p> : null}

        {showExample ? <ExamplePriceCheck /> : null}

        <PriceCtaButton isSubmitting={isSubmitting} />
      </form>

      {showExample ? <ExampleFairPriceCard /> : null}
    </div>
  );
}

function ServiceDropdown({
  services,
  onChoose,
  desktop = false,
}: {
  services: typeof cumarServices;
  onChoose: (item: (typeof cumarServices)[number]) => void;
  desktop?: boolean;
}) {
  return (
    <div
      className={`absolute left-0 right-0 z-30 max-h-[280px] overflow-y-auto rounded-[16px] border border-[#dfe7f2] bg-white p-2 shadow-[0_18px_40px_rgba(7,22,56,0.16)] ${
        desktop ? "top-[76px]" : "top-[86px]"
      }`}
    >
      {services.length ? (
        services.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChoose(item)}
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-[#f3f7ff]"
          >
            <CumarIcon type={item.icon} className="h-5 w-5 text-[#075cff]" />
            <span className="text-[14px] font-black text-[#071638]">{item.label}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-3 text-[13px] font-bold text-[#d93025]">Choose a service from the dropdown.</div>
      )}
    </div>
  );
}

function PostcodeField({
  id,
  postcode,
  setPostcode,
  setError,
  hasError,
  compact = false,
}: {
  id: string;
  postcode: string;
  setPostcode: (value: string) => void;
  setError: (value: string | null) => void;
  hasError: boolean;
  compact?: boolean;
}) {
  return (
    <label className={`${compact ? "mt-3" : ""} block rounded-[16px] border bg-white px-4 py-3 ${hasError ? "border-[#d93025]" : "border-[#e2e9f3]"}`}>
      <span className="text-[12px] font-extrabold text-[#071638]">Postcode</span>
      <div className="mt-2 flex items-center gap-3">
        {!compact ? <CumarIcon type="pin" className="h-5 w-5 text-[#071638]" /> : null}
        <input
          id={id}
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
        {compact ? <CumarIcon type="pin" className="h-5 w-5 text-[#071638]" /> : null}
      </div>
    </label>
  );
}

function ExamplePriceCheck() {
  return (
    <div className="rounded-[18px] border border-[#dbe8ff] bg-[#f8fbff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.09em] text-[#075cff]">Example price check</p>
          <p className="mt-2 text-[18px] font-black tracking-[-0.035em] text-[#071638]">See what is fair before you call.</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">
          Slough guide
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[15px] border border-[#e3eaf5] bg-white p-3">
          <p className="text-[11px] font-black text-[#52627a]">Service</p>
          <p className="mt-2 text-[14px] font-black leading-[1.15] text-[#071638]">Man and Van</p>
          <p className="mt-1 text-[11px] font-semibold leading-[1.3] text-[#657089]">Small local move</p>
        </div>

        <div className="rounded-[15px] border border-[#d8eddd] bg-[#effaf3] p-3">
          <p className="text-[11px] font-black text-[#08783f]">Fair range</p>
          <p className="mt-2 text-[22px] font-black tracking-[-0.06em] text-[#08783f]">£40–£70</p>
          <p className="mt-1 text-[11px] font-semibold text-[#355443]">per hour</p>
        </div>

        <div className="rounded-[15px] border border-[#ffd5d5] bg-[#fff3f3] p-3">
          <p className="text-[11px] font-black text-[#c51622]">Be careful above</p>
          <p className="mt-2 text-[22px] font-black tracking-[-0.06em] text-[#c51622]">£100+</p>
          <p className="mt-1 text-[11px] font-semibold text-[#6b3b3b]">unless extras apply</p>
        </div>
      </div>

      <div className="mt-4 rounded-[15px] border border-[#e7edf5] bg-white p-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-black text-[#08783f]">
          <span>Fair guide range</span>
          <span>£40–£70/hr</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#e7eef8]">
          <div className="h-full w-[62%] rounded-full bg-[#08783f]" />
        </div>

        <div className="mb-1 mt-3 flex items-center justify-between text-[11px] font-black text-[#c51622]">
          <span>Likely expensive</span>
          <span>£100+/hr</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#f7dede]">
          <div className="h-full w-[88%] rounded-full bg-[#c51622]" />
        </div>
      </div>
    </div>
  );
}

function ExampleFairPriceCard() {
  return (
    <div className="mt-4 rounded-[20px] border border-[#dbe8ff] bg-[#f8fbff] p-5">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#e7efff] text-[#075cff]">
          <CumarIcon type="van" className="h-8 w-8" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-black tracking-[-0.03em] text-[#071638]">Example fair Slough price</p>

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
  );
}