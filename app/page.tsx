import Link from "next/link";
import Header from "./homepagecomponents/Header";
import Footer from "./components/Footer";

const audiences = [
  [
    "Letting agents",
    "Coordinate end-of-tenancy, turnaround and recurring cleans across managed properties.",
  ],
  [
    "Property managers",
    "Keep property details, access notes and cleaning requests together instead of across messages.",
  ],
  [
    "Airbnb operators",
    "Arrange repeat turnovers with clear requested times and a visible operational status.",
  ],
  [
    "Offices and premises",
    "Discuss recurring cleaning around the way your site operates.",
  ],
  [
    "Portfolio landlords",
    "Request managed-property cleaning without rebuilding the brief for every visit.",
  ],
  [
    "Block managers",
    "Coordinate communal-area requirements and retain a clear service history.",
  ],
];
const services = [
  [
    "Recurring property cleaning",
    "Regular cleaning arrangements for professionally managed properties and portfolios.",
  ],
  [
    "Airbnb turnovers",
    "Turnover cleaning for short-let and serviced-accommodation operations.",
  ],
  [
    "End-of-tenancy cleaning",
    "Managed changeover cleans for agents, landlords and property teams.",
  ],
  [
    "Office cleaning",
    "Recurring or planned cleaning for workplaces and commercial premises.",
  ],
  [
    "Communal-area cleaning",
    "Cleaning requirements for shared areas managed by block and accommodation teams.",
  ],
  [
    "Property deep cleaning",
    "Planned deeper cleans for managed properties and operational turnarounds.",
  ],
];
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#071638]">
      <Header />
      <section className="overflow-hidden bg-[#061a3d] px-5 py-16 text-white sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1.04fr_.96fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#4bd35f]">
              Managed cleaning · Slough pilot
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">
              Managed cleaning for properties and businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/75">
              Quickola helps property professionals and businesses organise
              reliable cleaning without chasing cleaners, managing scattered
              messages or losing visibility across properties.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/business/enquire"
                className="rounded-xl bg-[#4bd35f] px-6 py-4 text-center font-black text-[#061a3d]"
              >
                Request business cleaning
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-xl border border-white/25 px-6 py-4 text-center font-black"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-white/60">
              Already a customer?{" "}
              <Link
                href="/business/sign-in"
                className="text-white underline underline-offset-4"
              >
                Sign in to your business account
              </Link>
            </p>
          </div>
          <PortalPreview />
        </div>
      </section>
      <section className="border-b px-5 py-6 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-3 text-sm font-extrabold sm:grid-cols-3">
          <p>One place for properties and bookings</p>
          <p>Availability confirmed by Quickola</p>
          <p>Focused initial coverage in Slough</p>
        </div>
      </section>
      <section
        id="who-we-serve"
        className="scroll-mt-24 px-5 py-18 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <Eyebrow>Who we serve</Eyebrow>
          <div className="mt-3 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
            <h2 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">
              Built around property operations, not household browsing.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[#657089]">
              Quickola is for organisations that need cleaning coordinated
              responsibly across a property, portfolio or working site.
            </p>
          </div>
          <div className="mt-10 grid border-y border-[#dfe6eb] md:grid-cols-2 lg:grid-cols-3">
            {audiences.map(([title, text], i) => (
              <article
                key={title}
                className={`p-6 lg:p-7 ${i % 3 !== 2 ? "lg:border-r" : ""} ${i < 3 ? "border-b" : ""}`}
              >
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#657089]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="services"
        className="scroll-mt-24 bg-[#f3f6f8] px-5 py-18 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <Eyebrow>Cleaning services</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">
            Cleaning organised around the property, schedule and operational
            brief.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-0 md:grid-cols-2">
            {services.map(([title, text], i) => (
              <article key={title} className="border-t border-[#cad4dc] py-6">
                <div className="flex gap-4">
                  <span className="text-xs font-black text-[#08783f]">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[#657089]">
                      {text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 py-18 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
            A managed route from requirements to fulfilment.
          </h2>
          <ol className="mt-10 grid gap-4 lg:grid-cols-4">
            {[
              [
                "01",
                "Tell us what you manage",
                "Share the properties, premises, frequency and cleaning requirements.",
              ],
              [
                "02",
                "Agree the setup",
                "Quickola reviews coverage and the operational cleaning brief.",
              ],
              [
                "03",
                "Request and track cleans",
                "Approved customers save properties and submit requests through their account.",
              ],
              [
                "04",
                "Quickola coordinates",
                "We confirm availability, assign fulfilment and keep the status visible.",
              ],
            ].map(([n, title, text]) => (
              <li key={n} className="border-t-2 border-[#071638] pt-5">
                <p className="text-xs font-black text-[#08783f]">{n}</p>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#657089]">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        id="service-area"
        className="scroll-mt-24 bg-[#061a3d] px-5 py-16 text-white sm:px-8"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#4bd35f]">
              Controlled service area
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Starting with managed cleaning in Slough.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/70">
              We review every enquiry against current operational coverage. Work
              is requested first and only confirmed after availability has been
              checked.
            </p>
          </div>
          <Link
            href="/business/enquire"
            className="shrink-0 rounded-xl bg-[#4bd35f] px-6 py-4 text-center font-black text-[#061a3d]"
          >
            Discuss your cleaning requirements
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[.16em] text-[#08783f]">
      {children}
    </p>
  );
}
function PortalPreview() {
  return (
    <div className="rounded-[28px] bg-white p-3 text-[#071638] shadow-[0_32px_90px_rgba(0,0,0,.3)]">
      <div className="rounded-2xl border border-[#dfe6eb]">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <p className="text-xs font-black text-[#08783f]">
              QUICKOLA BUSINESS
            </p>
            <p className="mt-1 font-black">Cleaning operations</p>
          </div>
          <span className="rounded-lg bg-[#edf7f1] px-3 py-2 text-xs font-black text-[#08783f]">
            Business account
          </span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <PreviewItem label="Properties" text="Saved in one account" />
          <PreviewItem label="Bookings" text="Requested and tracked" />
          <PreviewItem label="Status" text="Clear next steps" />
        </div>
        <div className="mx-4 mb-4 border-t pt-4">
          <p className="text-sm font-black">What the portal keeps together</p>
          <div className="mt-3 grid gap-2 text-sm font-bold text-[#657089]">
            <p>Property and access information</p>
            <p>Requested dates, services and prices</p>
            <p>Booking history and operational updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function PreviewItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-[#f4f6f9] p-4">
      <p className="text-xs font-bold text-[#657089]">{label}</p>
      <p className="mt-1 text-sm font-black">{text}</p>
    </div>
  );
}
