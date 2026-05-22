import { notFound } from "next/navigation";
import Footer from "../components/Footer";
import { createClient } from "@supabase/supabase-js";
import { saveCheckPriceRequest } from "../actions";

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
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  indexable: boolean;
  status: "draft" | "published";
};

const serviceOptions = [
  { label: "Cleaning", value: "cleaning" },
  { label: "End of Tenancy Cleaning", value: "end-of-tenancy-cleaning" },
  { label: "Deep Cleaning", value: "deep-cleaning" },
  { label: "Carpet Cleaning", value: "carpet-cleaning" },
  { label: "Oven Cleaning", value: "oven-cleaning" },
  { label: "Man and Van", value: "man-and-van" },
  { label: "Removals", value: "removals" },
  { label: "Plumber", value: "plumber" },
  { label: "Emergency Plumber", value: "emergency-plumber" },
  { label: "Electrician", value: "electrician" },
  { label: "Locksmith", value: "locksmith" },
  { label: "Gardener", value: "gardener" },
  { label: "Handyman", value: "handyman" },
  { label: "Waste Removal", value: "waste-removal" },
  { label: "MOT and Car Repairs", value: "mot-car-repairs" },
  { label: "Tyres", value: "tyres" },
  { label: "Boiler Repair", value: "boiler-repair" },
];

const detailOptionsByService: Record<string, Array<{ label: string; value: string }>> = {
  cleaning: [
    { label: "Studio", value: "studio" },
    { label: "1 bed", value: "1-bed" },
    { label: "2 bed", value: "2-bed" },
    { label: "3 bed", value: "3-bed" },
    { label: "4+ bed", value: "4-bed-plus" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "end-of-tenancy-cleaning": [
    { label: "Studio", value: "studio" },
    { label: "1 bed", value: "1-bed" },
    { label: "2 bed", value: "2-bed" },
    { label: "3 bed", value: "3-bed" },
    { label: "4+ bed", value: "4-bed-plus" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "deep-cleaning": [
    { label: "Small flat", value: "small-flat" },
    { label: "2 bed", value: "2-bed" },
    { label: "3+ bed", value: "3-bed-plus" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "carpet-cleaning": [
    { label: "1 room", value: "1-room" },
    { label: "2 rooms", value: "2-rooms" },
    { label: "Whole flat / house", value: "whole-property" },
    { label: "Stairs included", value: "stairs" },
  ],
  "oven-cleaning": [
    { label: "Single oven", value: "single-oven" },
    { label: "Double oven", value: "double-oven" },
    { label: "Oven + hob / extractor", value: "oven-hob-extractor" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "man-and-van": [
    { label: "Small collection", value: "small-collection" },
    { label: "Furniture delivery", value: "furniture-delivery" },
    { label: "Flat move", value: "flat-move" },
    { label: "Need helper", value: "helper-needed" },
  ],
  removals: [
    { label: "Small flat move", value: "small-flat" },
    { label: "2–3 bed move", value: "2-3-bed" },
    { label: "House move", value: "house-move" },
    { label: "Packing needed", value: "packing-needed" },
  ],
  plumber: [
    { label: "Leak", value: "leak" },
    { label: "Tap / toilet repair", value: "tap-toilet" },
    { label: "Blocked pipe", value: "blocked-pipe" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "emergency-plumber": [
    { label: "Leak now", value: "leak-now" },
    { label: "Burst pipe", value: "burst-pipe" },
    { label: "Blocked toilet", value: "blocked-toilet" },
    { label: "No hot water", value: "no-hot-water" },
  ],
  electrician: [
    { label: "Fault / power issue", value: "fault" },
    { label: "Socket or switch", value: "socket-switch" },
    { label: "Lighting", value: "lighting" },
    { label: "Safety check", value: "safety-check" },
  ],
  locksmith: [
    { label: "Locked out", value: "locked-out" },
    { label: "Lock change", value: "lock-change" },
    { label: "UPVC door lock", value: "upvc-door" },
    { label: "Emergency locksmith", value: "emergency" },
  ],
  gardener: [
    { label: "Grass cutting", value: "grass-cutting" },
    { label: "Garden tidy-up", value: "garden-tidy" },
    { label: "Hedge trimming", value: "hedge-trimming" },
    { label: "Waste removal needed", value: "waste-removal" },
  ],
  handyman: [
    { label: "Small repair", value: "small-repair" },
    { label: "Mounting", value: "mounting" },
    { label: "Furniture assembly", value: "assembly" },
    { label: "Multiple jobs", value: "multiple-jobs" },
  ],
  "waste-removal": [
    { label: "Small load", value: "small-load" },
    { label: "Medium load", value: "medium-load" },
    { label: "Large clearance", value: "large-clearance" },
    { label: "Bulky items", value: "bulky-items" },
  ],
  "mot-car-repairs": [
    { label: "MOT test", value: "mot-test" },
    { label: "Diagnostics", value: "diagnostics" },
    { label: "Small repair", value: "small-repair" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  tyres: [
    { label: "Budget tyre", value: "budget-tyre" },
    { label: "Mid-range tyre", value: "mid-range-tyre" },
    { label: "Premium tyre", value: "premium-tyre" },
    { label: "Not sure yet", value: "not-sure" },
  ],
  "boiler-repair": [
    { label: "No heating", value: "no-heating" },
    { label: "No hot water", value: "no-hot-water" },
    { label: "Boiler fault", value: "boiler-fault" },
    { label: "Not sure yet", value: "not-sure" },
  ],
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

function getDetailLabel(page: SeoPage) {
  if (["cleaning", "end-of-tenancy-cleaning", "deep-cleaning"].includes(page.serviceSlug)) {
    return "Property size";
  }

  if (["man-and-van", "removals"].includes(page.serviceSlug)) return "Move type";
  if (["mot-car-repairs", "tyres"].includes(page.serviceSlug)) return "Vehicle / job type";
  if (page.serviceSlug === "locksmith") return "Locksmith issue";
  if (["plumber", "emergency-plumber", "boiler-repair"].includes(page.serviceSlug)) return "Issue type";
  if (page.serviceSlug === "electrician") return "Electrical issue";
  if (page.serviceSlug === "waste-removal") return "Waste amount";
  if (page.serviceSlug === "gardener") return "Garden job";
  if (page.serviceSlug === "handyman") return "Job type";

  return "Job details";
}

function getDetailOptions(page: SeoPage) {
  return detailOptionsByService[page.serviceSlug] ?? [
    { label: "Small job", value: "small-job" },
    { label: "Medium job", value: "medium-job" },
    { label: "Large job", value: "large-job" },
    { label: "Not sure yet", value: "not-sure" },
  ];
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
  return (
    <form
      id="request"
      action={saveCheckPriceRequest}
      className="scroll-mt-[88px] rounded-[28px] border border-[#dfe8ef] bg-white p-5 shadow-[0_22px_60px_rgba(7,22,56,0.10)] sm:p-6"
    >
      <input type="hidden" name="source" value={`seo-page:${page.slug}`} />
      <input type="hidden" name="time_needed" value="this-week" />

      <div className="text-left">
        <h2 className="text-[28px] font-black leading-[1.06] tracking-[-0.045em] text-[#071638]">
          Get your fair price range
        </h2>
        <p className="mt-2 text-[15px] font-semibold leading-[1.5] text-[#607089]">
          Free to check. Not a booking.
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Service
          </span>
          <select
            name="service"
            defaultValue={page.serviceSlug}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            {serviceOptions.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            {getDetailLabel(page)}
          </span>
          <select
            name="job_detail"
            defaultValue={getDetailOptions(page)[0]?.value ?? "not-sure"}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            {getDetailOptions(page).map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Area or postcode
          </span>
          <input
            name="area"
            defaultValue={page.location}
            required
            placeholder="e.g. SL1 1AA"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Email address
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 flex h-[60px] w-full items-center justify-center rounded-[16px] bg-[#079940] text-[17px] font-black text-white shadow-[0_18px_34px_rgba(7,153,64,0.25)] transition hover:-translate-y-0.5"
      >
        Get my fair price →
      </button>

      <p className="mt-4 text-center text-[12px] font-semibold leading-[1.45] text-[#607089]">
        Your request stays private.
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
            {page.intro || `See the fair ${page.serviceName.toLowerCase()} price range before you book. No pressure to continue.`}
          </p>
        </div>

        <RequestForm page={page} />
      </div>
    </section>
  );
}

function PriceGuide({ page }: { page: SeoPage }) {
  const rows = page.priceGuide.length
    ? page.priceGuide
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
            Typical {page.serviceName.toLowerCase()} price ranges in {page.location}
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

        <p className="mt-5 rounded-[14px] border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-3 text-[13px] font-semibold leading-[1.5] text-[#607089]">
          Final price depends on job details, urgency, access, parts or materials and local availability.
        </p>
      </div>
    </section>
  );
}

function IncludedSection({ page }: { page: SeoPage }) {
  const isCleaning = ["cleaning", "end-of-tenancy-cleaning", "deep-cleaning", "carpet-cleaning", "oven-cleaning"].includes(page.serviceSlug);

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
          <p className="mt-2 text-[15px] font-medium text-white/75">See the range first, then decide.</p>
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