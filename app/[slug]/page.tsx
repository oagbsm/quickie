import { notFound } from "next/navigation";
import Footer from "../components/Footer";
import { createClient } from "@supabase/supabase-js";

import {
  serviceFormConfigs,
  serviceOptions as dynamicServiceOptions,
  type ServiceKey,
  type ServiceFormField,
} from "../data/serviceFormConfigs";

import {
  getPriceConfigForResults,
  type PriceConfig as DynamicPriceConfig,
} from "../data/priceConfigs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SeoPageProps = {
  params: Promise<{ slug: string }>;
};

type SeoPage = {
  slug: string;
  serviceSlug: string;
  serviceName: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  areaType: "city" | "zone" | "area";
  location: string;
  parentLocation?: string | null;
  nearbyAreas: string[];
  localNeighbourhoods: string[];
  surroundingAreasLine?: string | null;
  localPriceNote?: string | null;
  localSearchNote?: string | null;
  primaryKeyword: string;
  secondaryKeywords: string[];
  priceGuide: Array<{
    label: string;
    from: string;
    typical: string;
  }>;
  dynamicPriceConfig?: DynamicPriceConfig;
  dynamicFormFields?: ServiceFormField[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  indexable: boolean;
  status: "draft" | "published";
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
}

function hydrateLocationText(value: string | null | undefined, location: string) {
  return String(value ?? "")
    .replace(/{{location}}/g, location)
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseServiceKey(value: string): ServiceKey | null {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const aliases: Record<string, ServiceKey> = {
    cleaning: "cleaner",
    clean: "cleaner",
    cleaner: "cleaner",
    painting: "painter-decorator",
    painter: "painter-decorator",
    decorating: "painter-decorator",
    plumbing: "plumber",
    electrical: "electrician",
    moving: "man-and-van",
    "man-with-van": "man-and-van",
    "van-man": "man-and-van",
  };

  const candidate = aliases[slug] ?? (slug as ServiceKey);
  return serviceFormConfigs[candidate] ? candidate : null;
}

async function getSeoPageBySlug(slug: string): Promise<SeoPage | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error("Missing Supabase env vars");
    return null;
  }

  const { data: pageRow, error: pageError } = await supabase
    .from("seo_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (pageError) {
    console.error("SEO page database error:", pageError);
    return null;
  }

  if (!pageRow) return null;

  const { data: locationRow, error: locationError } = await supabase
    .from("seo_locations")
    .select("*")
    .eq("slug", pageRow.location_slug)
    .maybeSingle();

  if (locationError || !locationRow) {
    console.error("SEO location error:", locationError ?? pageRow.location_slug);
    return null;
  }

  const { data: serviceRow, error: serviceError } = await supabase
    .from("seo_services")
    .select("*")
    .eq("slug", pageRow.service_slug)
    .maybeSingle();

  if (serviceError) {
    console.error("SEO service error:", serviceError);
    return null;
  }

  const locationName = locationRow.name;
  const serviceKey = normaliseServiceKey(pageRow.service_slug);

  const hydratedFaqs = Array.isArray(pageRow.faqs)
    ? pageRow.faqs.map((faq: { question?: string; answer?: string }) => ({
        question: hydrateLocationText(faq.question, locationName),
        answer: hydrateLocationText(faq.answer, locationName),
      }))
    : [];

  return {
    slug: pageRow.slug,
    serviceSlug: pageRow.service_slug,
    serviceName: serviceRow?.name ?? pageRow.service_slug,
    title: pageRow.title,
    metaTitle: hydrateLocationText(pageRow.meta_title, locationName),
    metaDescription: hydrateLocationText(pageRow.meta_description, locationName),
    h1: hydrateLocationText(pageRow.h1, locationName),
    intro: hydrateLocationText(pageRow.intro, locationName),
    areaType: locationRow.location_type,
    location: locationName,
    parentLocation: locationRow.parent_location,
    nearbyAreas: locationRow.nearby_areas ?? [],
    localNeighbourhoods: locationRow.local_neighbourhoods ?? [],
    surroundingAreasLine: hydrateLocationText(locationRow.surrounding_areas_line, locationName),
    localPriceNote: hydrateLocationText(locationRow.local_price_note, locationName),
    localSearchNote: hydrateLocationText(locationRow.local_search_note, locationName),
    primaryKeyword: serviceRow?.primary_keyword ?? pageRow.title,
    secondaryKeywords: serviceRow?.secondary_keywords ?? [],
    priceGuide: pageRow.price_guide ?? [],
    dynamicPriceConfig: getPriceConfigForResults({
      service: pageRow.service_slug,
      postcode: locationName,
    }),
    dynamicFormFields: serviceKey ? serviceFormConfigs[serviceKey]?.fields : undefined,
    faqs: hydratedFaqs,
    indexable: pageRow.indexable,
    status: pageRow.status,
  };
}

export async function generateMetadata({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);

  if (!page) {
    return {
      title: "Quickola",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    robots: {
      index: page.indexable === true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.quickola.co.uk/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://www.quickola.co.uk/${page.slug}`,
      siteName: "Quickola",
      type: "website",
    },
  };
}

function getHeadline(page: SeoPage) {
  return page.h1 || `${page.serviceName} prices in ${page.location}`;
}

function getDynamicServiceConfig(page: SeoPage) {
  const serviceKey = normaliseServiceKey(page.serviceSlug);
  return serviceKey ? serviceFormConfigs[serviceKey] : null;
}

function getPrimaryDynamicFields(page: SeoPage) {
  const config = getDynamicServiceConfig(page);
  if (!config) return [];

  const supportedFields = config.fields
    .filter((field) => field.type === "chips" || field.type === "select" || field.type === "text")
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  const priceFields = supportedFields.filter((field) => field.stage === "price");

  return (priceFields.length ? priceFields : supportedFields).slice(0, 2);
}

function getDynamicPriceGuideRows(page: SeoPage) {
  const dynamicRows = page.dynamicPriceConfig?.resultRows;

  if (dynamicRows?.length) {
    return dynamicRows.slice(0, 3).map((row) => ({
      label: row.label,
      from: row.price,
      typical:
        page.dynamicPriceConfig?.note ??
        "Final price depends on job details, urgency, access and local provider availability.",
    }));
  }

  return page.priceGuide;
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8edf3] bg-white/96 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Quickola home">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-11 w-11 rounded-2xl object-contain"
          />
          <span className="text-[25px] font-black tracking-[-0.045em] text-[#071638]">
            Quickola
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-[13px] font-bold text-[#293852] md:flex">
          <a className="hover:text-[#0b8f41]" href="#prices">Prices</a>
          <a className="hover:text-[#0b8f41]" href="#included">Included</a>
          <a className="hover:text-[#0b8f41]" href="#areas">Areas</a>
          <a className="hover:text-[#0b8f41]" href="#faq">FAQ</a>
        </nav>

        <a
          href="#request"
          className="hidden h-11 items-center justify-center rounded-[13px] bg-[#0b8f41] px-5 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(11,143,65,0.22)] sm:inline-flex"
        >
          Check price
        </a>

        <a
          href="#request"
          className="grid h-11 w-11 place-items-center rounded-[13px] border border-[#dfe8ef] bg-white text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.06)] sm:hidden"
          aria-label="Jump to price check"
        >
          <span className="text-[20px] font-black">£</span>
        </a>
      </div>
    </header>
  );
}

function RequestForm({ page }: { page: SeoPage }) {
  const dynamicServiceConfig = getDynamicServiceConfig(page);
  const primaryFields = getPrimaryDynamicFields(page);

  return (
    <form
      id="request"
      action="/screen2"
      method="GET"
      className="scroll-mt-[88px] rounded-[28px] border border-[#dfe8ef] bg-white p-5 shadow-[0_22px_60px_rgba(7,22,56,0.10)] sm:p-6"
    >
      <input type="hidden" name="source" value={`seo-page:${page.slug}`} />
      <input type="hidden" name="timeNeeded" value="this-week" />
      {dynamicServiceConfig ? (
        <input type="hidden" name="matchingMode" value={dynamicServiceConfig.matchingMode} />
      ) : null}

      <div className="text-left">
        <h2 className="text-[28px] font-black leading-[1.06] tracking-[-0.045em] text-[#071638]">
          Get your fair price range
        </h2>
        <p className="mt-2 text-[15px] font-semibold leading-[1.5] text-[#607089]">
          {dynamicServiceConfig?.intro ?? "Free to check. Not a booking."}
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Service
          </span>
          <input type="hidden" name="service" value={page.serviceSlug} />
          <div className="flex h-[58px] w-full items-center rounded-[16px] border border-[#dbe4ed] bg-[#f7fafc] px-4 text-[15px] font-black text-[#071638]">
            {dynamicServiceConfig?.shortLabel ?? dynamicServiceConfig?.label ?? page.serviceName}
          </div>
        </label>
        {primaryFields.map((field) => {
          const options = field.options ?? [];

          if ((field.type === "chips" || field.type === "select") && options.length) {
            return (
              <label key={field.name} className="block">
                <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
                  {field.label}
                </span>
                <select
                  name={field.name}
                  defaultValue={options[0]?.value ?? "not-sure"}
                  className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
                {field.label}
              </span>
              <input
                name={field.name}
                placeholder={field.placeholder ?? field.example ?? "Enter details"}
                className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
              />
            </label>
          );
        })}

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Postcode
          </span>
          <input
            name="postcode"
            required
            placeholder="e.g. SL1 1AA"
            pattern="^SL[1-9][A-Z]?\s?[0-9][A-Z]{2}$"
            title="Enter a valid SL postcode, for example SL1 1AA"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black uppercase text-[#071638] outline-none transition placeholder:normal-case placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 flex h-[60px] w-full items-center justify-center rounded-[16px] bg-[#079940] text-[17px] font-black text-white shadow-[0_18px_34px_rgba(7,153,64,0.25)] transition hover:-translate-y-0.5"
      >
        Check price →
      </button>

      <p className="mt-4 text-center text-[12px] font-semibold leading-[1.45] text-[#607089]">
        No email needed. This opens your fair-price result instantly.
      </p>
    </form>
  );
}

function Hero({ page }: { page: SeoPage }) {
  return (
    <section className="relative overflow-hidden border-b border-[#edf1f5] bg-[#fbfcfd]">
      <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[#e6f7ec] blur-3xl" />
      <div className="absolute right-[-220px] top-[80px] h-[460px] w-[460px] rounded-full bg-[#edf4f8] blur-3xl" />

      <div className="relative mx-auto grid max-w-[1180px] gap-7 px-5 py-9 sm:px-6 lg:grid-cols-[1fr_430px] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0b8f41] sm:text-[12px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b8f41] text-[11px] text-white">
              ✓
            </span>
            Know the fair price before you book
          </p>

          <h1 className="mt-5 max-w-[720px] text-[40px] font-black leading-[1.03] tracking-[-0.06em] text-[#071638] sm:text-[62px] lg:text-[70px]">
            {getHeadline(page).replace(` in ${page.location}`, "")}
            <span className="block text-[#0b8f41]">{page.location}</span>
          </h1>

          <p className="mt-5 max-w-[650px] text-[17px] font-semibold leading-[1.58] text-[#4b5b78] sm:text-[18px] lg:max-w-[560px]">
            {page.intro ||
              page.dynamicPriceConfig?.subheadline ||
              `See the fair ${page.serviceName.toLowerCase()} price range before you book. No pressure to continue.`}
          </p>
        </div>

        <RequestForm page={page} />
      </div>
    </section>
  );
}

function PriceGuide({ page }: { page: SeoPage }) {
  const dynamicRows = getDynamicPriceGuideRows(page);
  const rows = dynamicRows.length
    ? dynamicRows
    : [
        {
          label: "Small job",
          from: "£60",
          typical: "Usually depends on job type, access, availability and urgency.",
        },
        {
          label: "Medium job",
          from: "£120",
          typical: "Usually depends on size, time needed and materials or parts.",
        },
        {
          label: "Larger job",
          from: "£200+",
          typical: "Usually quoted after checking details, access and final scope.",
        },
      ];

  return (
    <section id="prices" className="bg-white px-5 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">
            Price guide
          </p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.045em] text-[#071638] sm:text-[46px]">
            {page.dynamicPriceConfig?.costGuide?.title ??
              `Typical ${page.serviceName.toLowerCase()} price ranges in ${page.location}`}
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 overflow-x-auto pb-1">
          {rows.slice(0, 3).map((row) => (
            <div
              key={row.label}
              className="min-w-[130px] rounded-[20px] border border-[#dfe8ef] bg-white p-4 shadow-[0_12px_28px_rgba(7,22,56,0.045)] sm:min-w-0 sm:p-5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f8ef] text-[16px] font-black text-[#0b8f41]">
                £
              </div>
              <h3 className="mt-4 min-h-[40px] text-[13px] font-black leading-[1.2] text-[#071638] sm:text-[16px]">
                {row.label}
              </h3>
              <p className="mt-4 text-[12px] font-bold text-[#748097]">From</p>
              <p className="mt-1 text-[30px] font-black tracking-[-0.055em] text-[#0b8f41] sm:text-[36px]">
                {row.from}
              </p>
              <p className="mt-3 text-[12px] font-semibold leading-[1.45] text-[#607089]">
                {row.typical}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[18px] border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-4 text-[13px] font-semibold leading-[1.55] text-[#607089] sm:px-5">
          <p className="font-black text-[#071638]">
            {page.dynamicPriceConfig?.costGuide?.updatedLabel ?? "Last updated: May 2026"}
          </p>
          <p className="mt-1">
            {page.dynamicPriceConfig?.note ??
              "Prices are guide ranges. Final quotes depend on job details, access, urgency, parts, materials and provider availability."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-black text-[#0b8f41]">
            <a href="/pricing-methodology" className="hover:underline">How Quickola estimates prices</a>
            <a href="/trust-safety" className="hover:underline">Trust & Safety</a>
            <a href="/quickola-price-index" className="hover:underline">UK Local Services Price Index 2026</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function IncludedSection({ page }: { page: SeoPage }) {
  const isCleaning = ["cleaning", "end-of-tenancy-cleaning", "deep-cleaning", "carpet-cleaning", "oven-cleaning", "cleaner"].includes(page.serviceSlug);

  const includedItems = isCleaning
    ? ["Property size price context", "Common cleaning tasks", "Access and urgency factors", "Add-on warning before booking"]
    : ["Local guide price context", "Common cost factors", "Urgency and access warning", "What may affect the final quote"];

  const extraItems = isCleaning
    ? ["Oven cleaning", "Carpet cleaning", "Inside appliances", "Heavy limescale or mould"]
    : ["Parts or materials", "Urgent booking", "Difficult access", "Larger job scope"];

  return (
    <section id="included" className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
          <h2 className="text-[26px] font-black tracking-[-0.035em] text-[#071638]">
            Usually included in the guide
          </h2>
          <div className="mt-5 grid gap-3 text-[15px] font-semibold leading-[1.5] text-[#34425d]">
            {includedItems.map((item) => (
              <p key={item} className="flex gap-3">
                <span className="font-black text-[#0b8f41]">✓</span>
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
          <h2 className="text-[26px] font-black tracking-[-0.035em] text-[#071638]">Common extras</h2>
          <div className="mt-5 grid gap-3 text-[15px] font-semibold leading-[1.5] text-[#34425d]">
            {extraItems.map((item) => (
              <p key={item} className="flex gap-3">
                <span className="font-black text-[#0b8f41]">•</span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AreasSection({ page }: { page: SeoPage }) {
  const areas = page.nearbyAreas.length
    ? page.nearbyAreas
    : page.localNeighbourhoods.length
      ? page.localNeighbourhoods
      : [];

  if (!areas.length) return null;

  return (
    <section id="areas" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">
            Local coverage
          </p>
          <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#071638] sm:text-[46px]">
            Areas around {page.location}
          </h2>
          <p className="mt-3 text-[16px] font-medium leading-[1.65] text-[#556177]">
            These are nearby areas used for local price context. They are not separate office locations.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {areas.slice(0, 14).map((area) => (
            <span
              key={area}
              className="rounded-full border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-2 text-[13px] font-black text-[#34425d]"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeoText({ page }: { page: SeoPage }) {
  const notes = [
    page.surroundingAreasLine,
    page.localPriceNote,
    page.localSearchNote,
    `${page.location} ${page.serviceName.toLowerCase()} prices can change depending on job type, urgency, access, parts, travel time and availability.`,
    `Quickola guide ranges are designed to help customers understand what may be reasonable before booking. Final quotes should always be confirmed directly with the provider before work begins.`,
  ].filter(Boolean);

  const faqs = page.faqs.filter((faq) => faq.question && faq.answer).slice(0, 5);

  return (
    <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
          <h2 className="text-[28px] font-black tracking-[-0.035em] text-[#071638]">
            Price notes for {page.location}
          </h2>
          <div className="mt-5 space-y-3">
            {notes.map((note) => (
              <p
                key={String(note)}
                className="rounded-[16px] bg-[#fbfcfd] p-4 text-[14px] font-medium leading-[1.6] text-[#44506a]"
              >
                {note}
              </p>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Operator note</p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.035em] text-[#071638]">
              Built for clearer local pricing
            </h2>
            <p className="mt-3 text-[14px] font-semibold leading-[1.65] text-[#556177]">
              Quickola is being built in the UK to make local service pricing clearer before people book.
            </p>
            <p className="mt-3 text-[14px] font-semibold leading-[1.65] text-[#556177]">
              Operating location: Slough-first, UK. Contact: <a href="mailto:hello@quickola.co.uk" className="font-black text-[#0b8f41] hover:underline">hello@quickola.co.uk</a>
            </p>
          </div>

          {faqs.length > 0 ? (
            <div id="faq" className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
              <h2 className="text-[28px] font-black tracking-[-0.035em] text-[#071638]">FAQ</h2>
              <div className="mt-4 divide-y divide-[#edf1f5]">
                {faqs.map((faq) => (
                  <details key={faq.question} className="py-4">
                    <summary className="cursor-pointer list-none text-[15px] font-black text-[#071638]">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-[14px] font-medium leading-[1.6] text-[#556177]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 rounded-[28px] bg-[#071638] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <h2 className="text-[30px] font-black tracking-[-0.04em] sm:text-[40px]">Check the fair price first.</h2>
          <p className="mt-2 text-[15px] font-medium text-white/75">Last updated: May 2026 · Guide ranges only · No booking pressure</p>
        </div>
        <a
          href="#request"
          className="inline-flex h-[56px] items-center justify-center rounded-[14px] bg-[#0b8f41] px-8 text-[16px] font-black text-white"
        >
          Start price check →
        </a>
      </div>
    </section>
  );
}

export default async function SeoLandingPage({ params }: SeoPageProps) {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);

  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Inter','Nunito_Sans',system-ui,sans-serif]">
      <Header />
      <Hero page={page} />
      <PriceGuide page={page} />
      <IncludedSection page={page} />
      <AreasSection page={page} />
      <SeoText page={page} />
      <FinalCta />
      <Footer />
    </main>
  );
}