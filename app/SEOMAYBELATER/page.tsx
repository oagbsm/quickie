import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "../components/Footer";
import { serviceFormConfigs, type ServiceKey } from "../data/serviceFormConfigs";
import {
  getSeoLocation,
  seoLocations,
  type LocationKey,
} from "../data/seoLocations";

const siteUrl = "https://quickola.co.uk";

export const dynamicParams = false;

type PageParams = {
  location?: string;
};

const priorityServices: ServiceKey[] = ["plumber", "cleaner", "man-and-van", "electrician", "locksmith"];
const highDemandServices: ServiceKey[] = ["plumber", "cleaner", "man-and-van"];

function getPageData(params: PageParams) {
  const locationKey = params.location?.toLowerCase() as LocationKey | undefined;

  if (!locationKey) return null;

  const location = getSeoLocation(locationKey);

  if (!location) return null;

  const areas = Object.entries(location.areas).map(([areaKey, area]) => ({
    ...area,
    key: areaKey,
  }));

  const neighbourhoodAreas = areas.filter((area) => !area.key.startsWith("sl"));
  const postcodeAreas = areas.filter((area) => area.key.startsWith("sl"));

  return {
    locationKey,
    location,
    areas,
    neighbourhoodAreas,
    postcodeAreas,
  };
}

export function generateStaticParams() {
  return Object.keys(seoLocations).map((location) => ({
    location,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const page = getPageData(resolvedParams);
  const shortLocationName = page?.location.displayName.replace(" and nearby SL areas", "") ?? "";

  if (!page) {
    return {
      title: "Quickola",
      robots: { index: false, follow: false },
    };
  }

  const title = `Quickola ${shortLocationName} | Check Fair Local Service Prices`;
  const description = `Check fair local prices for plumbers, cleaners, man and van, electricians, locksmiths and more in ${shortLocationName}. Quickola helps you know the fair price before you book.`;
  const canonical = `${siteUrl}/${page.locationKey}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
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
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-11 w-11 rounded-2xl object-contain"
          />
          <span className="text-[25px] font-black tracking-[-0.045em] text-[#071638]">
            Quickola
          </span>
        </a>

        <a
          href="#services"
          className="h-11 items-center justify-center rounded-[13px] bg-[#0b8f41] px-5 text-[13px] font-black text-white shadow-[0_12px_24px_rgba(11,143,65,0.22)] sm:inline-flex"
        >
          Find a service
        </a>
      </div>
    </header>
  );
}

export default async function LocationHubPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const page = getPageData(resolvedParams);

  if (!page) notFound();

  const { locationKey, location, neighbourhoodAreas, postcodeAreas } = page;
  const mainAreas = neighbourhoodAreas.slice(0, 18);
  const allAreas = [...neighbourhoodAreas, ...postcodeAreas];
  const shortLocationName = location.displayName.replace(" and nearby SL areas", "");

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Inter','Nunito_Sans',system-ui,sans-serif]">
      <Header />

      <section className="relative overflow-hidden border-b border-[#edf1f5] bg-[#fbfcfd]">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[#e6f7ec] blur-3xl" />
        <div className="absolute right-[-220px] top-[80px] h-[460px] w-[460px] rounded-full bg-[#edf4f8] blur-3xl" />

        <div className="relative mx-auto max-w-[1180px] px-5 py-12 sm:px-6 lg:px-8 lg:py-20">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0b8f41] sm:text-[12px]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b8f41] text-[11px] text-white">
              ✓
            </span>
            Quickola local hub
          </p>

          <h1 className="mt-5 max-w-[860px] text-[42px] font-black leading-[1.03] tracking-[-0.06em] text-[#071638] sm:text-[64px] lg:text-[76px]">
            Check fair local service prices in
            <span className="block text-[#0b8f41]">{shortLocationName}</span>
          </h1>

          <p className="mt-5 max-w-[680px] text-[17px] font-semibold leading-[1.62] text-[#4b5b78] sm:text-[19px]">
            Quickola helps people in {shortLocationName} check the fair local
            price before booking plumbers, cleaners, man and van providers,
            electricians, locksmiths and more.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#services"
              className="inline-flex h-[56px] items-center justify-center rounded-[14px] bg-[#0b8f41] px-8 text-[16px] font-black text-white shadow-[0_18px_34px_rgba(7,153,64,0.25)]"
            >
              Browse local services →
            </a>
            <a
              href="#areas"
              className="inline-flex h-[56px] items-center justify-center rounded-[14px] border border-[#dfe8ef] bg-white px-8 text-[16px] font-black text-[#071638]"
            >
              View areas covered
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">
              Popular services
            </p>
            <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#071638] sm:text-[48px]">
              Start with the service you need
            </h2>
            <p className="mt-3 text-[16px] font-medium leading-[1.65] text-[#556177]">
              These links help Google and local customers find the most useful
              {" "}{shortLocationName} service pages.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {priorityServices.map((serviceKey) => {
              const service = serviceFormConfigs[serviceKey];
              const firstArea = mainAreas[0] ?? postcodeAreas[0];

              if (!service || !firstArea) return null;

              return (
                <a
                  key={serviceKey}
                  href={`/${locationKey}/${firstArea.key}/${serviceKey}`}
                  className="rounded-[24px] border border-[#dfe8ef] bg-white p-6 shadow-[0_12px_30px_rgba(7,22,56,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(7,22,56,0.08)]"
                >
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#0b8f41]">
                    Fair price check
                  </p>
                  <h3 className="mt-3 text-[24px] font-black tracking-[-0.04em] text-[#071638]">
                    {service.label} in {shortLocationName}
                  </h3>
                  <p className="mt-3 text-[14px] font-semibold leading-[1.55] text-[#607089]">
                    Check the fair local price before booking. Start with
                    {" "}{firstArea.displayName} and nearby areas.
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fb] px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">
              High-demand local pages
            </p>
            <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#071638] sm:text-[48px]">
              Useful {shortLocationName} pages to crawl first
            </h2>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mainAreas.slice(0, 12).flatMap((area) =>
              highDemandServices.map((serviceKey) => {
                const service = serviceFormConfigs[serviceKey];
                if (!service) return null;

                return (
                  <a
                    key={`${area.key}-${serviceKey}`}
                    href={`/${locationKey}/${area.key}/${serviceKey}`}
                    className="rounded-[18px] border border-[#dfe8ef] bg-white px-4 py-4 text-[14px] font-black text-[#071638] shadow-[0_10px_24px_rgba(7,22,56,0.035)] hover:text-[#0b8f41]"
                  >
                    {service.label} in {area.displayName}
                  </a>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section id="areas" className="bg-white px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b8f41]">
              Areas covered
            </p>
            <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] text-[#071638] sm:text-[48px]">
              Areas and postcode districts around {shortLocationName}
            </h2>
            <p className="mt-3 text-[16px] font-medium leading-[1.65] text-[#556177]">
              Quickola pages are built around real local areas people search for,
              plus SL postcode districts.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {allAreas.map((area) => (
              <span
                key={area.key}
                className="rounded-full border border-[#dfe8ef] bg-[#fbfcfd] px-4 py-2 text-[13px] font-black text-[#34425d]"
              >
                {area.displayName}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 rounded-[28px] bg-[#071638] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 className="text-[30px] font-black tracking-[-0.04em] sm:text-[40px]">
              Check the fair price before you book.
            </h2>
            <p className="mt-2 text-[15px] font-medium text-white/75">
              Slough-first local price checks · Guide ranges only · No booking pressure
            </p>
          </div>
          <a
            href="#services"
            className="inline-flex h-[56px] items-center justify-center rounded-[14px] bg-[#0b8f41] px-8 text-[16px] font-black text-white"
          >
            Browse services →
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}