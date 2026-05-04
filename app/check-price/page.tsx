import Link from "next/link";
import Footer from "../components/Footer";

type CheckPricePageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
  }>;
};

const popularSearches = [
  { label: "Cleaner today", service: "cleaner", area: "ilford" },
  { label: "End of tenancy clean", service: "end-of-tenancy-clean", area: "barking" },
  { label: "Man with van", service: "man-with-van", area: "ilford" },
  { label: "Emergency plumber", service: "plumber-emergency", area: "walthamstow" },
  { label: "Furniture removal", service: "furniture-removal", area: "chingford" },
];

function formatParam(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <img
        src="/quickola/logo-mark.png"
        alt="Quickola"
        className="h-9 w-9 shrink-0 rounded-full object-contain"
      />
      <span className="text-[25px] font-extrabold leading-none tracking-[-0.035em] text-[#071638] sm:text-[30px]">
        Quickola
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[66px] w-full max-w-[1120px] items-center justify-between px-4 sm:min-h-[72px] sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe5ee] bg-white px-4 text-[14px] font-extrabold text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
        >
          New search
        </Link>
      </div>
    </header>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4h6l1 2h2a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 6 6h2l1-2Z" />
      <path d="M9 6h6" />
      <path d="m8.5 12 1.4 1.4 2.6-3" />
      <path d="M14.5 12h2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15" />
      <rect x="4.5" y="5.5" width="15" height="15" rx="2.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 5.5 6v5.2c0 4 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5.1 6.5-9.1V6L12 3.5Z" />
      <path d="m8.8 12 2 2 4.3-4.6" />
    </svg>
  );
}

function TimeOption({ value, title, text, defaultChecked }: { value: string; title: string; text: string; defaultChecked?: boolean }) {
  return (
    <label className="group relative block min-w-0 cursor-pointer">
      <input
        type="radio"
        name="time_needed"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex min-h-[68px] min-w-0 items-center gap-3 rounded-2xl border border-[#dfe5ee] bg-white px-3 py-3 transition peer-checked:border-[#08783f] peer-checked:bg-[#f0faf3] peer-focus-visible:ring-2 peer-focus-visible:ring-[#98d7ad] sm:px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4f6f9] text-[#071638] group-has-[:checked]:bg-white group-has-[:checked]:text-[#08783f]">
          <CalendarIcon />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-extrabold text-[#071638] sm:text-[15px]">{title}</span>
          <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#657089]">{text}</span>
        </span>
        <span className="ml-auto hidden h-5 w-5 shrink-0 place-items-center rounded-full bg-[#08783f] text-[12px] font-black text-white group-has-[:checked]:grid">
          ✓
        </span>
      </span>
    </label>
  );
}

function RequestSummary({ service, area }: { service: string; area: string }) {
  return (
    <div className="rounded-[22px] border border-[#dcebe1] bg-[#f8fcf9] p-4 shadow-[0_12px_30px_rgba(7,22,56,0.04)] sm:p-5">
      <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 sm:grid-cols-[44px_minmax(0,1fr)_auto]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#08783f] ring-1 ring-[#d8eddd]">
          <ClipboardIcon />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#657089] sm:text-[13px]">Your price check</p>
          <h1 className="mt-1 break-words text-[26px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#071638] sm:text-[34px]">
            {service} <span className="text-[#08783f]">in {area}</span>
          </h1>
          <p className="mt-2 text-[14px] font-semibold leading-[1.45] text-[#44506a] sm:text-[15px]">
            Pick when you need it. We’ll show the fair price first, then you can choose if you want a match.
          </p>
        </div>
        <Link href="/" className="col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[14px] font-extrabold text-[#08783f] ring-1 ring-[#d8eddd] sm:col-span-1 sm:h-auto sm:self-start sm:px-4 sm:py-2">
          Edit search
        </Link>
      </div>
    </div>
  );
}

function PriceCheckForm({ serviceSlug, areaSlug }: { serviceSlug: string; areaSlug: string }) {
  return (
    <form
      action="/results"
      method="GET"
      className="w-full max-w-full rounded-[24px] border border-[#e1e6ee] bg-white p-4 shadow-[0_18px_46px_rgba(7,22,56,0.06)] sm:p-6"
    >
      <input type="hidden" name="service" value={serviceSlug} />
      <input type="hidden" name="area" value={areaSlug} />

      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0faf3] text-[#08783f] ring-1 ring-[#d8eddd]">
          <CalendarIcon />
        </span>
        <div>
          <h2 className="text-[21px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#071638]">
            When do you need it?
          </h2>
          <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#657089]">
            No phone or email needed here. Contact details are only asked after the fair price is shown.
          </p>
        </div>
      </div>

      <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TimeOption value="today" title="Today" text="Fastest option" defaultChecked />
        <TimeOption value="tomorrow" title="Tomorrow" text="More availability" />
        <TimeOption value="this-week" title="This week" text="Flexible timing" />
        <TimeOption value="pick-date" title="Pick a date" text="Choose later" />
      </div>

      <button
        type="submit"
        className="mt-5 flex h-[56px] w-full max-w-full items-center justify-center gap-3 rounded-[14px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-4 text-[17px] font-extrabold tracking-[-0.01em] text-white shadow-[0_15px_28px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5 sm:h-[60px] sm:text-[19px]"
      >
        Show my fair price range
        <span className="text-[26px] leading-none sm:text-[30px]">→</span>
      </button>

      <p className="mt-3 text-center text-[12px] font-semibold leading-[1.45] text-[#657089]">
        You’ll see the price first. Email is only asked if you want us to find the best match.
      </p>
    </form>
  );
}

function SideCard() {
  return (
    <aside className="rounded-[24px] border border-[#e1e6ee] bg-white p-4 shadow-[0_18px_46px_rgba(7,22,56,0.05)] lg:sticky lg:top-[90px]">
      <div className="rounded-[18px] bg-[#071638] p-4 text-white">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.07em] text-white/70">Quickola flow</p>
        <h2 className="mt-2 text-[24px] font-extrabold leading-[1.05] tracking-[-0.035em]">
          Price first. Match second.
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-[16px] bg-[#fbfcfd] p-4 ring-1 ring-[#edf0f5]">
          <p className="text-[14px] font-extrabold text-[#071638]">1. Check fair price</p>
          <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#657089]">No login, phone or email needed.</p>
        </div>
        <div className="rounded-[16px] bg-[#fbfcfd] p-4 ring-1 ring-[#edf0f5]">
          <p className="text-[14px] font-extrabold text-[#071638]">2. Choose help</p>
          <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#657089]">Only after the price is shown.</p>
        </div>
        <div className="rounded-[16px] bg-[#f6fcf8] p-4 ring-1 ring-[#d8eddd]">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#08783f] ring-1 ring-[#d8eddd]">
              <ShieldIcon />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-[#071638]">No public list</p>
              <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#44506a]">We hide weak supply and check approved providers manually.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileTrustStrip() {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-[18px] border border-[#e1e6ee] bg-white shadow-[0_10px_26px_rgba(7,22,56,0.04)]">
      <div className="px-3 py-4 text-center">
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[#f1faf3] text-[#08783f]"><ShieldIcon /></div>
        <p className="mt-2 text-[12px] font-extrabold text-[#08783f]">No login</p>
      </div>
      <div className="border-x border-[#e1e6ee] px-3 py-4 text-center">
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[#f1faf3] text-[#08783f]"><MailIcon /></div>
        <p className="mt-2 text-[12px] font-extrabold text-[#08783f]">Email later</p>
      </div>
      <div className="px-3 py-4 text-center">
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[#f1faf3] text-[#08783f]"><CalendarIcon /></div>
        <p className="mt-2 text-[12px] font-extrabold text-[#08783f]">Fast check</p>
      </div>
    </div>
  );
}

function PopularSearches() {
  return (
    <div className="rounded-[20px] border border-[#e1e6ee] bg-white p-4 shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-[16px] font-extrabold text-[#071638]">Popular East London searches</h2>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((item) => (
            <Link
              key={item.label}
              href={`/check-price?service=${item.service}&area=${item.area}`}
              className="inline-flex h-10 min-w-0 items-center rounded-full border border-[#e1e6ee] bg-white px-4 text-[13px] font-bold text-[#071638] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CheckPricePage({ searchParams }: CheckPricePageProps) {
  const params = await searchParams;
  const service = formatParam(params?.service, "Cleaner");
  const area = formatParam(params?.area, "Ilford");
  const serviceSlug = slugify(service);
  const areaSlug = slugify(area);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfd] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />

      <section className="mx-auto w-full max-w-[1120px] px-4 pb-8 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
        <Link href="/" className="inline-flex items-center gap-3 text-[14px] font-bold text-[#071638] transition hover:text-[#08783f]">
          <span className="text-[#08783f]">←</span>
          Back to home
        </Link>

        <div className="mt-4 sm:mt-5">
          <RequestSummary service={service} area={area} />
        </div>

        <div className="mt-4 grid w-full min-w-0 gap-4 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <PriceCheckForm serviceSlug={serviceSlug} areaSlug={areaSlug} />
          <div className="hidden lg:block">
            <SideCard />
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <MobileTrustStrip />
        </div>

        <div className="mt-4">
          <PopularSearches />
        </div>
      </section>
      <Footer />
    </main>
  );
}