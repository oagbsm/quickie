import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "../../../components/Footer";
import {
  serviceDropdownOrder,
  serviceFormConfigs,
  type ServiceFormField,
  type ServiceKey,
} from "../../../data/serviceFormConfigs";
import {
  getPriceConfigForResults,
  type PriceConfig as DynamicPriceConfig,
} from "../../../data/priceConfigs";
import { serviceSeoCopy } from "../../../data/serviceSeo";
import {
  getAreaNeighbourhoodText,
  getSeoArea,
  getSeoLocation,
  seoAreaParams,
  type SeoAreaConfig,
} from "../../../data/seoLocations";

const siteUrl = "https://quickola.co.uk";

export const dynamicParams = false;

type PageParams = {
  location?: string;
  area?: string;
  service?: string;
};

type LocalSeoPage = {
  slug: string;
  serviceSlug: ServiceKey;
  serviceName: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  location: string;
  locationKey: string;
  areaKey: string;
  area: SeoAreaConfig;
  nearbyAreas: string[];
  surroundingAreasLine: string;
  localPriceNote: string;
  localSearchNote: string;
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
};

function isServiceKey(value: string): value is ServiceKey {
  return serviceDropdownOrder.includes(value as ServiceKey);
}

function getDynamicServiceConfig(page: LocalSeoPage) {
  return serviceFormConfigs[page.serviceSlug] ?? null;
}

function getPrimaryDynamicFields(page: LocalSeoPage) {
  const config = getDynamicServiceConfig(page);
  if (!config) return [];

  const supportedFields = config.fields
    .filter((field) => field.type === "chips" || field.type === "select" || field.type === "text")
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  const priceFields = supportedFields.filter((field) => field.stage === "price");

  return (priceFields.length ? priceFields : supportedFields).slice(0, 2);
}

function getDynamicPriceGuideRows(page: LocalSeoPage) {
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

function getPageData(params: PageParams): LocalSeoPage | null {
  const locationKey = params.location?.toLowerCase();
  const areaKey = params.area?.toLowerCase();
  const serviceKey = params.service?.toLowerCase();

  if (!locationKey || !areaKey || !serviceKey || !isServiceKey(serviceKey)) {
    return null;
  }

  const location = getSeoLocation(locationKey);
  const area = getSeoArea(locationKey, areaKey);
  const service = serviceFormConfigs[serviceKey];
  const seo = serviceSeoCopy[serviceKey];

  if (!location || !area || !service || !seo) {
    return null;
  }

  const neighbourhoodText = getAreaNeighbourhoodText(area);
  const postcodeText = area.postcodeDistricts.join(", ");
  const displayLocation = area.displayName;
  const slug = `${locationKey}/${areaKey}/${serviceKey}`;
  const dynamicPriceConfig = getPriceConfigForResults({
    service: serviceKey,
    postcode: postcodeText || displayLocation,
  });

  return {
    slug,
    serviceSlug: serviceKey,
    serviceName: service.label,
    metaTitle: `${seo.searchName} in ${displayLocation} | Check Fair Prices | Quickola`,
    metaDescription: `Need a ${seo.singular} in ${displayLocation}? Quickola helps you check the fair local price before booking and can connect you with one available local provider.`,
    h1: `Need a ${seo.singular} in ${displayLocation}?`,
    intro: `Check the fair local price before you book. Quickola helps people in ${displayLocation} understand what ${seo.plural} should normally cost, then connect with one available local provider.`,
    location: displayLocation,
    locationKey,
    areaKey,
    area,
    nearbyAreas: area.nearby,
    surroundingAreasLine: `This page covers ${displayLocation}, postcode district ${postcodeText}, and nearby areas including ${neighbourhoodText}.`,
    localPriceNote: `${seo.searchName} prices in ${displayLocation} can change depending on job size, urgency, access, travel time and local provider availability.`,
    localSearchNote: `People nearby may search for ${seo.searchName.toLowerCase()} help in ${displayLocation}, ${postcodeText}, ${neighbourhoodText}.`,
    priceGuide: [],
    dynamicPriceConfig,
    dynamicFormFields: service.fields,
    faqs: [
      {
        question: `How much does a ${seo.singular} cost in ${displayLocation}?`,
        answer: "The fair price depends on the job details, urgency, access, materials and provider availability. Quickola helps you check a local guide range before you book.",
      },
      {
        question: `Can Quickola help me find a ${seo.singular} in ${displayLocation}?`,
        answer: "Yes. After checking the fair price, you can ask Quickola to connect you with one suitable local provider who is available.",
      },
      {
        question: `Does Quickola show lots of ${seo.plural}?`,
        answer: "No. Quickola is not a public directory. It checks the fair local price first, then helps match you with one suitable local provider.",
      },
      {
        question: `Which areas near ${area.label} are covered?`,
        answer: `This page covers ${displayLocation} and nearby areas including ${neighbourhoodText}.`,
      },
    ],
    indexable: true,
  };
}

export function generateStaticParams() {
  return seoAreaParams.flatMap(({ location, area }) =>
    serviceDropdownOrder.map((service) => ({
      location,
      area,
      service,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const page = getPageData(resolvedParams);

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
      canonical: `${siteUrl}/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${siteUrl}/${page.slug}`,
      siteName: "Quickola",
      type: "website",
    },
  };
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8edf3] bg-white/96 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Quickola home">
          <img src="/quickola/logo-mark.png" alt="Quickola" className="h-11 w-11 rounded-2xl object-contain" />
          <span className="text-[25px] font-black tracking-[-0.045em] text-[#071638]">Quickola</span>
        </a>

        <nav className="hidden items-center gap-8 text-[13px] font-bold text-[#293852] md:flex">
          <a className="hover:text-[#0b8f41]" href="#prices">Prices</a>
          <a className="hover:text-[#0b8f41]" href="#included">Included</a>
          <a className="hover:text-[#0b8f41]" href="#areas">Areas</a>
          <a className="hover:text-[#0b8f41]" href="#faq">FAQ</a>
        </nav>

        <a href="#request" className="hidden h-11 items-center justify-center rounded-[13px] bg-[#0b8f41] px-5 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(11,143,65,0.22)] sm:inline-flex">
          Check price
        </a>

        <a href="#request" className="grid h-11 w-11 place-items-center rounded-[13px] border border-[#dfe8ef] bg-white text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.06)] sm:hidden" aria-label="Jump to price check">
          <span className="text-[20px] font-black">£</span>
        </a>
      </div>
    </header>
  );
}

function RequestForm({ page }: { page: LocalSeoPage }) {
  const dynamicServiceConfig = getDynamicServiceConfig(page);
  const primaryFields = getPrimaryDynamicFields(page);
  const postcodeExample = `${page.area.postcodeDistricts[0] ?? "SL1"} 1AA`;

  return (
    <form id="request" action="/screen2" method="GET" className="scroll-mt-[88px] rounded-[28px] border border-[#dfe8ef] bg-white p-5 shadow-[0_22px_60px_rgba(7,22,56,0.10)] sm:p-6">
      <input type="hidden" name="source" value={`seo-page:${page.slug}`} />
      <input type="hidden" name="timeNeeded" value="this-week" />
      <input type="hidden" name="area" value={page.areaKey} />
      {dynamicServiceConfig ? <input type="hidden" name="matchingMode" value={dynamicServiceConfig.matchingMode} /> : null}

      <div className="text-left">
        <h2 className="text-[28px] font-black leading-[1.06] tracking-[-0.045em] text-[#071638]">Get your fair price range</h2>
        <p className="mt-2 text-[15px] font-semibold leading-[1.5] text-[#607089]">
          {dynamicServiceConfig?.intro ?? "Free to check. Not a booking."}
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">Service</span>
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
                <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">{field.label}</span>
                <select name={field.name} defaultValue={options[0]?.value ?? "not-sure"} className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10">
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">{field.label}</span>
              <input name={field.name} placeholder={field.placeholder ?? field.example ?? "Enter details"} className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black text-[#071638] outline-none transition placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10" />
            </label>
          );
        })}

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black text-[#34425d]">Postcode</span>
          <input name="postcode" required placeholder={`e.g. ${postcodeExample}`} pattern="^SL[0-9][A-Z]?\s?[0-9][A-Z]{2}$" title="Enter a valid SL postcode, for example SL1 1AA" className="h-[58px] w-full rounded-[16px] border border-[#dbe4ed] bg-white px-4 text-[15px] font-black uppercase text-[#071638] outline-none transition placeholder:normal-case placeholder:text-[#93a0b3] focus:border-[#0b8f41] focus:ring-4 focus:ring-[#0b8f41]/10" />
        </label>
      </div>

      <button type="submit" className="mt-5 flex h-[60px] w-full items-center justify-center rounded-[16px] bg-[#079940] text-[17px] font-black text-white shadow-[0_18px_34px_rgba(7,153,64,0.25)] transition hover:-translate-y-0.5">
        Check price →
      </button>

      <p className="mt-4 text-center text-[12px] font-semibold leading-[1.45] text-[#607089]">No email needed. This opens your fair-price result instantly.</p>
    </form>
  );
}

function Hero({ page }: { page: LocalSeoPage }) {
  return (
    <section className="relative overflow-hidden border-b border-[#edf1f5] bg-[#fbfcfd]">
      <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[#e6f7ec] blur-3xl" />
      <div className="absolute right-[-220px] top-[80px] h-[460px] w-[460px] rounded-full bg-[#edf4f8] blur-3xl" />

      <div className="relative mx-auto grid max-w-[1180px] gap-7 px-5 py-9 sm:px-6 lg:grid-cols-[1fr_430px] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0b8f41] sm:text-[12px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b8f41] text-[11px] text-white">✓</span>
            Know the fair price before you book
          </p>

          <h1 className="mt-5 max-w-[720px] text-[40px] font-black leading-[1.03] tracking-[-0.06em] text-[#071638] sm:text-[62px] lg:text-[70px]">
            {page.h1.replace(` in ${page.location}`, "")}
            <span className="block text-[#0b8f41]">{page.location}</span>
          </h1>

          <p className="mt-5 max-w-[650px] text-[17px] font-semibold leading-[1.58] text-[#4b5b78] sm:text-[18px] lg:max-w-[560px]">
            {page.intro || page.dynamicPriceConfig?.subheadline || `See the fair ${page.serviceName.toLowerCase()} price range before you book. No pressure to continue.`}
          </p>
        </div>

        <RequestForm page={page} />
      </div>
    </section>
  );
}

function PriceGuide({ page }: { page: LocalSeoPage }) {
  const dynamicRows = getDynamicPriceGuideRows(page);
  const rows = dynamicRows.length
    ? dynamicRows
    : [
        { label: "Small job", from: "£60", typical: "Usually depends on job type, access, availability and urgency." },
        { label: "Medium job", from: "£120", typical: "Usually depends on size, time needed and materials or parts." },
        { label: "Larger job", from: "£200+", typical: "Usually quoted after checking details, access and final scope." },
      ];

  return (
    <section id="prices" className="bg-white px-5 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">Price guide</p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.045em] text-[#071638] sm:text-[46px]">
            {page.dynamicPriceConfig?.costGuide?.title ?? `Typical ${page.serviceName.toLowerCase()} price ranges in ${page.location}`}
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 overflow-x-auto pb-1">
          {rows.slice(0, 3).map((row) => (
            <div key={row.label} className="min-w-[130px] rounded-[20px] border border-[#dfe8ef] bg-white p-4 shadow-[0_12px_28px_rgba(7,22,56,0.045)] sm:min-w-0 sm:p-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f8ef] text-[16px] font-black text-[#0b8f41]">£</div>
              <h3 className="mt-4 min-h-[40px] text-[13px] font-black leading-[1.2] text-[#071638] sm:text-[16px]">{row.label}</h3>
              <p className="mt-4 text-[12px] font-bold text-[#748097]">From</p>
              <p className="mt-1 text-[30px] font-black tracking-[-0.055em] text-[#0b8f41] sm:text-[36px]">{row.from}</p>
              <p className="mt-3 text-[12px] font-semibold leading-[1.45] text-[#607089]">{row.typical}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[18px] border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-4 text-[13px] font-semibold leading-[1.55] text-[#607089] sm:px-5">
          <p className="font-black text-[#071638]">{page.dynamicPriceConfig?.costGuide?.updatedLabel ?? "Last updated: May 2026"}</p>
          <p className="mt-1">{page.dynamicPriceConfig?.note ?? "Prices are guide ranges. Final quotes depend on job details, access, urgency, parts, materials and provider availability."}</p>
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

function IncludedSection({ page }: { page: LocalSeoPage }) {
  const isCleaning = page.serviceSlug === "cleaner";
  const includedItems = isCleaning
    ? ["Property size price context", "Common cleaning tasks", "Access and urgency factors", "Add-on warning before booking"]
    : ["Local guide price context", "Common cost factors", "Urgency and access warning", "What may affect the final quote"];
  const extraItems = isCleaning
    ? ["Oven cleaning", "Carpet cleaning", "Inside appliances", "Heavy limescale or mould"]
    : ["Parts or materials", "Urgent booking", "Difficult access", "Larger job scope"];

  return (
    <section id="included" className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-2">
        {[{ title: "Usually included in the guide", items: includedItems, icon: "✓" }, { title: "Common extras", items: extraItems, icon: "•" }].map((card) => (
          <div key={card.title} className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <h2 className="text-[26px] font-black tracking-[-0.035em] text-[#071638]">{card.title}</h2>
            <div className="mt-5 grid gap-3 text-[15px] font-semibold leading-[1.5] text-[#34425d]">
              {card.items.map((item) => (
                <p key={item} className="flex gap-3"><span className="font-black text-[#0b8f41]">{card.icon}</span>{item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AreasSection({ page }: { page: LocalSeoPage }) {
  if (!page.nearbyAreas.length) return null;

  return (
    <section id="areas" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">Local coverage</p>
          <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#071638] sm:text-[46px]">Areas around {page.location}</h2>
          <p className="mt-3 text-[16px] font-medium leading-[1.65] text-[#556177]">These are nearby areas used for local price context. They are not separate office locations.</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {page.nearbyAreas.slice(0, 14).map((area) => (
            <span key={area} className="rounded-full border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-2 text-[13px] font-black text-[#34425d]">{area}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeoText({ page }: { page: LocalSeoPage }) {
  const notes = [
    page.surroundingAreasLine,
    page.localPriceNote,
    page.localSearchNote,
    `${page.location} ${page.serviceName.toLowerCase()} prices can change depending on job type, urgency, access, parts, travel time and availability.`,
    "Quickola guide ranges are designed to help customers understand what may be reasonable before booking. Final quotes should always be confirmed directly with the provider before work begins.",
  ].filter(Boolean);

  return (
    <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
          <h2 className="text-[28px] font-black tracking-[-0.035em] text-[#071638]">Price notes for {page.location}</h2>
          <div className="mt-5 space-y-3">
            {notes.map((note) => (
              <p key={String(note)} className="rounded-[16px] bg-[#fbfcfd] p-4 text-[14px] font-medium leading-[1.6] text-[#44506a]">{note}</p>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">Operator note</p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.035em] text-[#071638]">Built for clearer local pricing</h2>
            <p className="mt-3 text-[14px] font-semibold leading-[1.65] text-[#556177]">Quickola is being built in the UK to make local service pricing clearer before people book.</p>
            <p className="mt-3 text-[14px] font-semibold leading-[1.65] text-[#556177]">Operating location: Slough-first, UK. Contact: <a href="mailto:hello@quickola.co.uk" className="font-black text-[#0b8f41] hover:underline">hello@quickola.co.uk</a></p>
          </div>

          <div id="faq" className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.04)]">
            <h2 className="text-[28px] font-black tracking-[-0.035em] text-[#071638]">FAQ</h2>
            <div className="mt-4 divide-y divide-[#edf1f5]">
              {page.faqs.map((faq) => (
                <details key={faq.question} className="py-4">
                  <summary className="cursor-pointer list-none text-[15px] font-black text-[#071638]">{faq.question}</summary>
                  <p className="mt-2 text-[14px] font-medium leading-[1.6] text-[#556177]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
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
        <a href="#request" className="inline-flex h-[56px] items-center justify-center rounded-[14px] bg-[#0b8f41] px-8 text-[16px] font-black text-white">Start price check →</a>
      </div>
    </section>
  );
}

export default async function LocalServiceSeoPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const page = getPageData(resolvedParams);

  if (!page) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${page.serviceName} in ${page.location}`,
    serviceType: page.serviceName,
    areaServed: {
      "@type": "Place",
      name: page.location,
    },
    provider: {
      "@type": "LocalBusiness",
      name: "Quickola",
      url: siteUrl,
      areaServed: "Slough and nearby SL areas",
    },
    description: page.metaDescription,
    url: `${siteUrl}/${page.slug}`,
  };

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Inter','Nunito_Sans',system-ui,sans-serif]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
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