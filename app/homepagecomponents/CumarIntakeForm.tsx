"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicServiceFields from "./DynamicServiceFields";
import {
  getServiceFormConfig,
  serviceOptions,
  type ServiceFormField,
} from "../data/serviceFormConfigs";

export const cumarServices = serviceOptions.map((service) => ({
  ...service,
  description: getServiceFormConfig(service.value).intro,
}));

type CumarService = (typeof cumarServices)[number];

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

  const publicIconMap: Record<string, string> = {
    "man-and-van": "/icons/man-and-van.svg",
    removals: "/icons/man-and-van.svg",
    van: "/icons/man-and-van.svg",
    truck: "/icons/man-and-van.svg",
    "moving-truck": "/icons/man-and-van.svg",

    cleaner: "/icons/cleaner.svg",
    clean: "/icons/cleaner.svg",
    cleaning: "/icons/cleaner.svg",
    "spray-can": "/icons/cleaner.svg",
    "home-check": "/icons/cleaner.svg",
    "end-of-tenancy-cleaning": "/icons/end-of-tenancy-cleaning.svg",
    "carpet-cleaning": "/icons/carpet-cleaning.svg",
    "oven-cleaning": "/icons/oven-cleaning.svg",
    "window-cleaning": "/icons/window-cleaning.svg",

    plumber: "/icons/plumber.svg",
    plumbing: "/icons/plumber.svg",
    tap: "/icons/plumber.svg",
    "water-alert": "/icons/plumber.svg",
    "emergency-plumber": "/icons/emergency-plumber.svg",
    "boiler-repair": "/icons/boiler-repair.svg",
    flame: "/icons/boiler-repair.svg",
    "bathroom-repairs": "/icons/bathroom-repairs.svg",
    "kitchen-repairs": "/icons/kitchen-repairs.svg",

    electrician: "/icons/electrician.svg",
    electrical: "/icons/electrician.svg",
    electric: "/icons/electrician.svg",
    bolt: "/icons/electrician.svg",
    plug: "/icons/electrician.svg",
    zap: "/icons/electrician.svg",

    locksmith: "/icons/locksmith.svg",
    key: "/icons/locksmith.svg",
    lock: "/icons/locksmith.svg",

    handyman: "/icons/handyman.svg",
    tool: "/icons/handyman.svg",
    hammer: "/icons/handyman.svg",

    "painter-decorator": "/icons/painter-decorator.svg",
    painter: "/icons/painter-decorator.svg",
    painting: "/icons/painter-decorator.svg",
    "paint-roller": "/icons/painter-decorator.svg",

    gardener: "/icons/gardener.svg",
    gardening: "/icons/gardener.svg",
    leaf: "/icons/gardener.svg",

    "waste-removal": "/icons/waste-removal.svg",
    waste: "/icons/waste-removal.svg",
    bin: "/icons/waste-removal.svg",
    trash: "/icons/waste-removal.svg",
    rubbish: "/icons/waste-removal.svg",
    recycle: "/icons/waste-removal.svg",
    "house-clearance": "/icons/house-clearance.svg",

    "appliance-repair": "/icons/appliance-repair.svg",
    "pest-control": "/icons/pest-control.svg",
    "roofing-guttering": "/icons/roofing-guttering.svg",
    "cctv-security": "/icons/cctv-security.svg",
    shield: "/icons/cctv-security.svg",
    "home-shield": "/icons/cctv-security.svg",
    "blinds-curtains": "/icons/blinds-curtains.svg",
    "flooring-carpet-fitting": "/icons/flooring-carpet-fitting.svg",
    "furniture-assembly": "/icons/furniture-assembly.svg",
  };

  const publicIconSrc = publicIconMap[type];

  if (publicIconSrc) {
    return <img src={publicIconSrc} alt="" aria-hidden="true" className={`${className} object-contain`} />;
  }

  if (type === "search") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (type === "grid") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h6v6h-6z" />
      </svg>
    );
  }

  if (type === "wifi") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5a10 10 0 0 1 14 0" />
        <path d="M8.5 16a5 5 0 0 1 7 0" />
        <path d="M12 20h.01" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (type === "van" || type === "truck" || type === "moving-truck") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h3.5l2.5 3v3h-6" />
        <circle cx="6.5" cy="18" r="2" />
        <circle cx="17.5" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "plumbing" || type === "tap" || type === "water-alert") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 14h9a4 4 0 0 0 4-4V6" />
        <path d="M17 6h3" />
        <path d="M7 10v8" />
        <path d="M4 18h6" />
      </svg>
    );
  }

  if (type === "car" || type === "car-shield") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12 7 7h10l2 5" />
        <path d="M5 12h14v5H5z" />
        <circle cx="8" cy="17" r="1.6" />
        <circle cx="16" cy="17" r="1.6" />
      </svg>
    );
  }

  if (type === "cleaning" || type === "spray-can" || type === "home-check") {
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

  if (type === "tool" || type === "hammer" || type === "paint-roller") {
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

  if (type === "shield" || type === "home-shield") {
    return (
      <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  return <CumarIcon type="grid" className={className} />;
}

type CumarIntakeFormProps = {
  variant?: "mobile" | "desktop";
  showExample?: boolean;
  className?: string;
};

export default function CumarIntakeForm({
  variant = "desktop",
  className = "",
}: CumarIntakeFormProps) {
  const router = useRouter();

  const dynamicFieldsRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  const [service, setService] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuoteInput, setShowQuoteInput] = useState(false);

  const selectedService = useMemo(
    () => cumarServices.find((item) => item.value === service) ?? null,
    [service]
  );

  const selectedServiceConfig = useMemo(() => {
    if (!selectedService) return null;
    return getServiceFormConfig(selectedService.value);
  }, [selectedService]);

  const popularServices = useMemo(() => {
    const popularValues = [
      "man-and-van",
      "cleaner",
      "plumber",
      "locksmith",
      "electrician",
      "waste-removal",
    ];

    return popularValues
      .map((value) => cumarServices.find((item) => item.value === value))
      .filter(Boolean) as CumarService[];
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
    }
  }, [selectedServiceConfig]);

  const dynamicFields = selectedServiceConfig?.fields ?? [];

  const visibleDynamicFields = useMemo(() => {
    return dynamicFields.filter((field) => {
      if (!field.dependsOn) return true;
      const parentValue = formValues[field.dependsOn.field];
      return field.dependsOn.values.includes(parentValue ?? "");
    });
  }, [dynamicFields, formValues]);

  const priceCheckFields = useMemo(() => {
    return visibleDynamicFields
      .filter((field) => field.stage === "price")
      .sort((firstField, secondField) => (firstField.priority ?? 99) - (secondField.priority ?? 99))
      .slice(0, 2);
  }, [visibleDynamicFields]);

  const quoteFields = useMemo(
    () => visibleDynamicFields.filter((field) => field.name === "quoteAmount"),
    [visibleDynamicFields]
  );

  const answeredPriceFieldCount = priceCheckFields.filter((field) =>
    String(formValues[field.name] ?? "").trim()
  ).length;

  const priceProgressPercent = selectedServiceConfig
    ? answeredPriceFieldCount === 0
      ? 12
      : Math.round((answeredPriceFieldCount / Math.max(priceCheckFields.length, 1)) * 100)
    : 12;

  const isPriceReady =
    Boolean(selectedServiceConfig) &&
    priceCheckFields.length > 0 &&
    answeredPriceFieldCount === priceCheckFields.length;

  const submitLabel = selectedService
    ? `Check ${selectedService.label.toLowerCase()} price`
    : "Check price";

  const hasSelectedValidService = Boolean(selectedService && selectedService.label === serviceSearch);
  const canSubmitPriceCheck = Boolean(selectedService) && (priceCheckFields.length === 0 || isPriceReady);

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();

    if (!query || hasSelectedValidService) return cumarServices;

    return cumarServices.filter((item) => {
      const searchableText = `${item.label} ${item.description}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [hasSelectedValidService, serviceSearch]);

  function chooseService(item: CumarService) {
    setService(item.value);
    setServiceSearch(item.label);
    setServiceOpen(false);
    setFormValues({});
    setShowQuoteInput(false);
    setError(null);

    window.setTimeout(() => {
      const target = dynamicFieldsRef.current;
      if (!target) return;

      const targetRect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (targetRect.top > viewportHeight * 0.62) {
        window.scrollBy({
          top: 200,
          behavior: "smooth",
        });
      }
    }, 100);
  }

  function updateFormValue(name: string, value: string) {
    setFormValues((current) => {
      const next = { ...current, [name]: value };

      dynamicFields.forEach((field) => {
        if (field.dependsOn?.field === name && !field.dependsOn.values.includes(value)) {
          delete next[field.name];
        }
      });

      return next;
    });
    setError(null);

    const answeredPriceField = priceCheckFields.some((field) => field.name === name);
    const hasValue = String(value ?? "").trim().length > 0;

    if (answeredPriceField && hasValue) {
      window.setTimeout(() => {
        window.scrollBy({
          top: 120,
          behavior: "smooth",
        });
      }, 90);
    }
  }

  function getRequiredMissingField(fields: ServiceFormField[]) {
    return fields.find((field) => {
      if (field.optional) return false;
      return !String(formValues[field.name] ?? "").trim();
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    if (!selectedService) {
      setError("Choose a service to continue.");
      return;
    }

    if (!hasSelectedValidService) {
      setError("Choose a service from the list or search results.");
      return;
    }

    if (!selectedServiceConfig) {
      setError("Choose a service from the dropdown.");
      return;
    }

    const missingField = getRequiredMissingField(priceCheckFields);

    if (missingField) {
      setError(`Answer this first: ${missingField.label}`);
      return;
    }

    const postcodeFields = priceCheckFields.filter((field) => field.type === "postcode");

    const formattedPostcodes = postcodeFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = formatPostcode(formValues[field.name] ?? "");
      return acc;
    }, {});

    const invalidPostcodeField = postcodeFields.find((field) => {
      const value = formattedPostcodes[field.name];
      return value && !isValidUkPostcode(value);
    });

    if (invalidPostcodeField) {
      setError(`Enter a valid postcode for: ${invalidPostcodeField.label}`);
      return;
    }

    const sloughOnlyField = postcodeFields.find((field) => {
      if (field.name !== "postcode") return false;
      return !isSupportedSloughPostcode(formattedPostcodes[field.name]);
    });

    if (sloughOnlyField) {
      setError("Quickola only supports Slough postcodes right now. Use an SL1, SL2 or SL3 postcode.");
      return;
    }

 const cleanedFormValues: Record<string, string> = {
  ...formValues,
  ...formattedPostcodes,
  quoteAmount: formValues.quoteAmount?.replace(/[^0-9.]/g, "") || "",
};

    setError(null);
    setFormValues(cleanedFormValues);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cumar-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          service: selectedService.value,
          service_label: selectedService.label,
          postcode: cleanedFormValues.postcode || cleanedFormValues.collectionPostcode || "SL1 1AA",
          collection_postcode: cleanedFormValues.collectionPostcode || "SL1 1AA",
          delivery_postcode: cleanedFormValues.deliveryPostcode || null,
          quote_amount: cleanedFormValues.quoteAmount || null,
          service_details: cleanedFormValues,
          price_inputs: priceCheckFields.reduce<Record<string, string>>((acc, field) => {
            acc[field.name] = cleanedFormValues[field.name] || "";
            return acc;
          }, {}),
          price_confidence: priceCheckFields.every((field) => {
            const value = cleanedFormValues[field.name];
            return value && value !== "not-sure";
          })
            ? "high"
            : priceCheckFields.some((field) => cleanedFormValues[field.name] === "not-sure")
              ? "low"
              : "medium",
          price_driver_summary: priceCheckFields
            .map((field) => cleanedFormValues[field.name])
            .filter(Boolean)
            .join(" → "),
          quote_stage: "price_check",
          needs_followup: priceCheckFields.some((field) => cleanedFormValues[field.name] === "not-sure"),
          source: "homepage_cumar",
          cumar_mode: process.env.NEXT_PUBLIC_CUMAR_MODE || "rules",
          provider_lane:
            selectedServiceConfig.matchingMode === "local-provider"
              ? "local_business"
              : selectedServiceConfig.matchingMode,
          job_size:
            cleanedFormValues.loadSize ||
            cleanedFormValues.propertySize ||
            cleanedFormValues.bedrooms ||
            cleanedFormValues.carpetRooms ||
            cleanedFormValues.windowPropertySize ||
            cleanedFormValues.ovenType ||
            cleanedFormValues.roomCount ||
            cleanedFormValues.exteriorSize ||
            cleanedFormValues.gardenSize ||
            cleanedFormValues.jobCount ||
            cleanedFormValues.scope ||
            cleanedFormValues.severity ||
            cleanedFormValues.access ||
            cleanedFormValues.greenWaste ||
            cleanedFormValues.gardenCondition ||
            "normal",
          job_risk: selectedServiceConfig.matchingMode === "local-provider" ? "medium" : "low",
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
        service: selectedService.value,
        postcode: cleanedFormValues.postcode || cleanedFormValues.collectionPostcode || "SL1 1AA",
      });

      if (cleanedFormValues.deliveryPostcode) {
        params.set("delivery_postcode", cleanedFormValues.deliveryPostcode);
      }

      priceCheckFields.forEach((field) => {
        const value = cleanedFormValues[field.name];
        if (value) params.set(field.name, value);
      });

      if (cleanedFormValues.quoteAmount) params.set("quote", cleanedFormValues.quoteAmount);
      if (data?.request_id) params.set("request_id", data.request_id);

      router.push(`/screen2?${params.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMobile = variant === "mobile";
  const formId = isMobile ? "mobile-price-check-form" : "desktop-price-check-form";

  return (
    <form id={formId} onSubmit={handleSubmit} className={`mx-auto w-full max-w-[900px] space-y-3 sm:space-y-4 ${className}`}>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-[15px] font-extrabold tracking-[-0.03em] text-[#071638] sm:text-[17px]">
            Choose a service
          </label>
          {selectedService ? (
            <span className="rounded-full bg-[#e8f8ee] px-3 py-1 text-[11px] font-extrabold text-[#07833f]">
              Selected
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6 lg:gap-3">
          {popularServices.map((item) => {
            const isSelected = selectedService?.value === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => chooseService(item)}
                className={`relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[14px] border bg-white px-2 py-2.5 text-center shadow-[0_8px_18px_rgba(7,22,56,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#07833f]/50 hover:shadow-[0_14px_28px_rgba(7,22,56,0.08)] active:translate-y-0 sm:min-h-[112px] sm:rounded-[16px] sm:py-3 lg:min-h-[104px] lg:px-2 lg:py-3 ${
                  isSelected
                    ? "border-[#07833f] bg-[#f5fff8] shadow-[0_14px_28px_rgba(7,131,63,0.12)]"
                    : "border-[#e4ebf1]"
                }`}
                aria-pressed={isSelected}
              >
                {isSelected ? (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#07833f] text-[14px] font-extrabold leading-none text-white shadow-[0_6px_14px_rgba(7,131,63,0.24)] sm:right-2.5 sm:top-2.5 sm:h-6 sm:w-6 sm:text-[16px] lg:h-5 lg:w-5 lg:text-[13px]">
                    ✓
                  </span>
                ) : null}

                <CumarIcon
                  type={item.icon}
                  className={`h-11 w-11 sm:h-12 sm:w-12 lg:h-11 lg:w-11 ${isSelected ? "text-[#07833f]" : "text-[#071638]"}`}
                />
                <span className="max-w-[94px] text-[12px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#071638] sm:text-[14px] lg:max-w-[110px] lg:text-[12px] xl:text-[13px]">
                  {item.label === "Man & Van" ? "Man & Van / Moving" : item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <CumarIcon
            type="search"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#071638]"
          />
          <input
            value={hasSelectedValidService ? "" : serviceSearch}
            onChange={(event) => {
              setServiceSearch(event.target.value);
              setServiceOpen(true);
              setError(null);
            }}
            onFocus={() => setServiceOpen(true)}
            className="h-[42px] w-full rounded-[14px] border border-[#dfe7ef] bg-white pl-12 pr-4 text-[14px] font-semibold text-[#071638] outline-none transition focus:border-[#07833f] focus:ring-4 focus:ring-[#07833f]/10 placeholder:font-medium placeholder:text-[#7f8ca3] sm:h-[50px] sm:text-[16px] lg:h-[48px]"
            placeholder="Search any service..."
          />

          {serviceOpen && serviceSearch.trim() && !hasSelectedValidService ? (
            <ServiceDropdown services={filteredServices} onChoose={chooseService} />
          ) : null}
        </div>
      </div>

      {selectedServiceConfig ? (
        <div ref={dynamicFieldsRef}>
          <DynamicServiceFields fields={priceCheckFields} values={formValues} onChange={updateFormValue} />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[12px] bg-[#fff3f3] px-4 py-3 text-[13px] font-bold text-[#d93025]">
          {error}
        </p>
      ) : null}

      {quoteFields.length ? (
        <div className="px-1 py-0.5">
          <button
            type="button"
            onClick={() => setShowQuoteInput((value) => !value)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="text-[11.5px] font-extrabold tracking-[-0.02em] text-[#52627a]">
              Got a quote already?
            </span>
            <span className="text-[11px] font-extrabold text-[#07833f] underline underline-offset-2">
              {showQuoteInput ? "Hide" : "Add it"}
            </span>
          </button>

          {showQuoteInput ? (
            <div className="mt-2">
              <DynamicServiceFields fields={quoteFields} values={formValues} onChange={updateFormValue} />
            </div>
          ) : null}
        </div>
      ) : null}


      <button
        type="submit"
        disabled={isSubmitting || !canSubmitPriceCheck}
        className={`group relative flex h-[44px] w-full items-center justify-center overflow-hidden rounded-[14px] px-5 text-[16px] font-extrabold tracking-[-0.02em] transition-all duration-200 active:scale-[0.985] sm:h-[52px] sm:text-[18px] lg:h-[50px] ${
          canSubmitPriceCheck && !isSubmitting
            ? "bg-[#07833f] text-white shadow-[0_14px_28px_rgba(7,131,63,0.24)] hover:-translate-y-0.5 hover:bg-[#066f36]"
            : "cursor-not-allowed bg-[#dcece2] text-[#7f9a8a] shadow-none"
        } ${isPriceReady && !isSubmitting ? "quickola-price-ready" : ""}`}
      >
        <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.20)_45%,transparent_72%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />

        <span className="relative z-10 flex items-center gap-3">
          {isSubmitting ? "Checking..." : submitLabel}
          <span
            className={`text-[25px] leading-none transition-transform duration-200 group-hover:translate-x-1 sm:text-[30px] ${
              isPriceReady && !isSubmitting ? "quickola-price-ready-arrow" : ""
            }`}
          >
            →
          </span>
        </span>
      </button>
      {!selectedService ? (
        <p className="text-center text-[12px] font-semibold text-[#7f8ca3] sm:text-[13px]">
          Please select a service to continue
        </p>
      ) : null}
    </form>
  );
}

function ServiceDropdown({
  services,
  onChoose,
}: {
  services: CumarService[];
  onChoose: (item: CumarService) => void;
}) {
  return (
    <div className="absolute left-0 right-0 z-[120] mt-2 max-h-[320px] overflow-y-auto rounded-[14px] border border-[#e7edf3] bg-white p-2 shadow-[0_16px_34px_rgba(7,22,56,0.14)] lg:max-h-[360px]">
      {services.length ? (
        services.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChoose(item)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-1.5 text-left hover:bg-[#f3f8f5]"
          >
            <CumarIcon type={item.icon} className="h-[26px] w-[26px] text-[#07833f]" />
            <span className="text-[13px] font-extrabold text-[#071638]">{item.label}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-3 text-[13px] font-bold text-[#d93025]">
          No matching service found. Try another search.
        </div>
      )}
    </div>
  );
}