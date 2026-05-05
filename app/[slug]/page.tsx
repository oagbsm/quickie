import { notFound, redirect } from "next/navigation";
import Footer from "../components/Footer";
import { createClient } from "@supabase/supabase-js";

type SeoPageProps = {
  params: Promise<{ slug: string }>;
};

type SeoPage = {
  slug: string;
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

const cleaningServices = [
  { label: "Cleaning", value: "cleaning" },
  { label: "End of Tenancy Cleaning", value: "end-of-tenancy-cleaning" },
  { label: "Domestic Cleaning", value: "domestic-cleaning" },
  { label: "Deep Cleaning", value: "deep-cleaning" },
  { label: "Carpet Cleaning", value: "carpet-cleaning" },
  { label: "Oven Cleaning", value: "oven-cleaning" },
  { label: "After Builders Cleaning", value: "after-builders-cleaning" },
  { label: "Move-out Cleaning", value: "move-out-cleaning" },
  { label: "One-off Cleaning", value: "one-off-cleaning" },
  { label: "Regular Cleaning", value: "regular-cleaning" },
  { label: "Airbnb Cleaning", value: "airbnb-cleaning" },
];

const propertySizes = [
  { label: "Studio", value: "studio" },
  { label: "1 bed", value: "1-bed" },
  { label: "2 bed", value: "2-bed" },
  { label: "3 bed", value: "3-bed" },
  { label: "4+ bed", value: "4-bed-plus" },
  { label: "Not sure yet", value: "not-sure" },
];

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSupabaseWriteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

  if (pageError || !pageRow) {
    console.error("SEO page error:", pageError ?? slug);
    return null;
  }

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
      canonical: `https://quickola.com/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://quickola.com/${page.slug}`,
      siteName: "Quickola",
      type: "website",
    },
  };
}

function getPrimaryService(page: SeoPage) {
  const lower = page.title.toLowerCase();

  if (lower.includes("end of tenancy")) return "End of Tenancy Cleaning";
  if (lower.includes("domestic")) return "Domestic Cleaning";
  if (lower.includes("deep")) return "Deep Cleaning";
  if (lower.includes("carpet")) return "Carpet Cleaning";
  if (lower.includes("oven")) return "Oven Cleaning";
  if (lower.includes("after builders")) return "After Builders Cleaning";
  if (lower.includes("airbnb")) return "Airbnb Cleaning";
  if (lower.includes("regular")) return "Regular Cleaning";
  if (lower.includes("one-off")) return "One-off Cleaning";
  if (lower.includes("move out")) return "Move-out Cleaning";

  return "Cleaning";
}

function getPrimaryServiceSlug(page: SeoPage) {
  const serviceName = getPrimaryService(page);
  const serviceSlug = slugify(serviceName);

  return cleaningServices.some((service) => service.value === serviceSlug)
    ? serviceSlug
    : "cleaning";
}

function getHeadline(page: SeoPage) {
  const service = getPrimaryService(page);

  if (service === "Cleaning") {
    return `Cleaning prices in ${page.location}`;
  }

  return `${service} prices in ${page.location}`;
}

async function saveSeoLandingRequest(formData: FormData) {
  "use server";

  const service = String(formData.get("service") ?? "cleaning").trim();
  const area = String(formData.get("area") ?? "london").trim();
  const propertySize = String(formData.get("propertySize") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const sourceSlug = String(formData.get("sourceSlug") ?? "").trim();

  if (!service || !area || !email) {
    throw new Error("Missing required request fields");
  }

  const supabase = getSupabaseWriteClient();

  const message = JSON.stringify({
    source: "seo-landing-page",
    source_slug: sourceSlug,
    property_size: propertySize || null,
  });

  const { error } = await supabase.from("requests").insert({
    service,
    area,
    email,
    phone: null,
    status: "new",
    message,
  });

  if (error) {
    console.error("Failed to save SEO landing request:", error);

    const { error: fallbackError } = await supabase.from("requests").insert({
      service,
      area,
      email,
      phone: null,
      status: "new",
    });

    if (fallbackError) {
      console.error("Failed to save SEO landing fallback request:", fallbackError);
      throw new Error("Could not save request");
    }
  }

  const params = new URLSearchParams({
    service,
    area,
    email,
    saved: "1",
  });

  if (propertySize) params.set("propertySize", propertySize);

  redirect(`/results?${params.toString()}`);
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
          <span className="block h-[2px] w-5 rounded-full bg-[#071638] shadow-[0_7px_0_#071638,0_-7px_0_#071638]" />
        </a>
      </div>
    </header>
  );
}

function RequestForm({ page }: { page: SeoPage }) {
  return (
    <form
      id="request"
      action={saveSeoLandingRequest}
      className="scroll-mt-[88px] rounded-[28px] border border-[#dfe8ef] bg-white p-5 shadow-[0_22px_60px_rgba(7,22,56,0.10)] sm:p-6"
    >
      <input type="hidden" name="sourceSlug" value={page.slug} />

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
            Cleaning type
          </span>
          <select
            name="service"
            defaultValue={getPrimaryServiceSlug(page)}
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            {cleaningServices.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">
            Property size
          </span>
          <select
            name="propertySize"
            defaultValue="2-bed"
            className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10"
          >
            {propertySizes.map((size) => (
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
            placeholder="e.g. W3, E15, Ilford"
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
            See the fair price range in under 30 seconds. No pressure to book.
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
          label: "Regular cleaning",
          from: "£18/hr",
          typical: "Most regular cleans are hourly and depend on frequency and property size.",
        },
        {
          label: "Deep cleaning",
          from: "£90",
          typical: "Usually quoted as a fixed price depending on condition and size.",
        },
        {
          label: "End of tenancy",
          from: "£120",
          typical: "Usually fixed price. Extras may include oven, carpets or appliances.",
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
            Typical price ranges in {page.location}
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
          Final price depends on property condition, access, appliances and add-ons.
        </p>
      </div>
    </section>
  );
}

function IncludedSection() {
  return (
    <section id="included" className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
          <h2 className="text-[26px] font-black tracking-[-0.035em] text-[#071638]">Usually included</h2>
          <div className="mt-5 grid gap-3 text-[15px] font-semibold leading-[1.5] text-[#34425d]">
            {[
              "Kitchen, bathroom and living areas",
              "Floors vacuumed and mopped",
              "Surfaces, skirting boards and switches",
              "Inside empty cupboards where agreed",
            ].map((item) => (
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
            {[
              "Oven, hob or extractor cleaning",
              "Carpet or upholstery cleaning",
              "Inside fridge or freezer",
              "Heavy limescale, mould or after-builders dust",
            ].map((item) => (
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

  if (!areas.length) {
    return null;
  }

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
    `${page.location} cleaner prices can change depending on property size, job type, notice period and availability.`,
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
      <IncludedSection />
      <AreasSection page={page} />
      <SeoText page={page} />
      <FinalCta />
      <Footer />
    </main>
  );
}