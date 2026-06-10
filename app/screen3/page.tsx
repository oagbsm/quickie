export const dynamic = "force-dynamic";
export const revalidate = 0;

type Screen3PageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    postcode?: string;
  }>;
};

type PriceConfig = {
  label: string;
  from: number;
  to: number;
};

const priceConfigs: Record<string, PriceConfig> = {
  "man-and-van": { label: "Man & Van", from: 70, to: 110 },
  moving: { label: "Man & Van", from: 70, to: 110 },
  removals: { label: "Removals", from: 220, to: 650 },
  cleaner: { label: "Cleaner", from: 45, to: 90 },
  cleaning: { label: "Cleaner", from: 45, to: 90 },
  "end-of-tenancy-cleaning": { label: "End of Tenancy", from: 120, to: 350 },
  "carpet-cleaning": { label: "Carpet Cleaning", from: 45, to: 120 },
  "oven-cleaning": { label: "Oven Cleaning", from: 50, to: 100 },
  plumber: { label: "Plumber", from: 80, to: 160 },
  "emergency-plumber": { label: "Emergency Plumber", from: 120, to: 240 },
  electrician: { label: "Electrician", from: 80, to: 150 },
  locksmith: { label: "Locksmith", from: 85, to: 180 },
  handyman: { label: "Handyman", from: 45, to: 95 },
  gardener: { label: "Gardener", from: 50, to: 120 },
  "painter-decorator": { label: "Painter", from: 180, to: 350 },
  "waste-removal": { label: "Waste Removal", from: 80, to: 250 },
};

function slugify(value: string | undefined, fallback: string) {
  return (value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normaliseServiceSlug(value: string | undefined) {
  const slug = slugify(value, "man-and-van");

  const aliases: Record<string, string> = {
    moving: "man-and-van",
    "man-with-van": "man-and-van",
    "van-man": "man-and-van",
    plumbing: "plumber",
    painting: "painter-decorator",
    painter: "painter-decorator",
    decorating: "painter-decorator",
    electrical: "electrician",
  };

  return aliases[slug] ?? slug;
}

function getPriceConfig(serviceSlug: string) {
  return (
    priceConfigs[serviceSlug] ?? {
      label: serviceSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      from: 70,
      to: 140,
    }
  );
}

function formatPlace(value: string | undefined) {
  const clean = (value || "Slough")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Slough";
  if (clean.toLowerCase() === "slough") return "Slough";
  return clean.toUpperCase();
}

function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-[7px] bg-[#071638] ${className}`}>
      <svg viewBox="0 0 32 32" className="h-[78%] w-[78%]" aria-hidden="true">
        <path d="M16 3.8 26.5 8v8.2c0 6.8-4.5 10.8-10.5 12.5C10 27 5.5 23 5.5 16.2V8L16 3.8Z" fill="white" />
        <path d="m10.6 16.2 3.5 3.5 7.5-8" fill="none" stroke="#07833f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function VanIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-[19px] w-[19px]" aria-hidden="true">
      <rect x="4" y="13" width="15" height="8" rx="1.8" fill="#071638" />
      <path d="M19 15.5h4.5L28 20v1h-9z" fill="#071638" />
      <rect x="7" y="10" width="8" height="4" rx="1" fill="#07833f" />
      <circle cx="9" cy="24" r="2.4" fill="#071638" />
      <circle cx="24" cy="24" r="2.4" fill="#071638" />
    </svg>
  );
}

export default async function Screen3Page({ searchParams }: Screen3PageProps) {
  const params = await searchParams;
  const serviceSlug = normaliseServiceSlug(params?.service);
  const config = getPriceConfig(serviceSlug);
  const place = formatPlace(params?.postcode || params?.area);

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_64%,#eef9f3_100%)] px-[14px] pb-4 pt-[48px]">
        <header className="relative flex h-[34px] items-center justify-center">
          <a href="/" aria-label="Back" className="absolute left-[-5px] grid h-9 w-9 place-items-center rounded-full text-[#071638]">
            <svg viewBox="0 0 24 24" className="h-[23px] w-[23px] fill-none stroke-current stroke-[2.7]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </a>

          <a href="/" className="flex items-center gap-[7px]" aria-label="Quickola homepage">
            <LogoMark className="h-[25px] w-[25px]" />
            <span className="text-[18px] font-black uppercase leading-none tracking-[-0.065em] text-[#071638]">
              QUICKOLA
            </span>
          </a>
        </header>

        <div className="relative mt-[30px] text-center">
          <h1 className="mx-auto max-w-[285px] text-[25px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638]">
            Quicko sniffed out
            <br />
            the <span className="text-[#07833f]">fair price</span>
          </h1>
        </div>

        <section className="relative mx-auto mt-[22px] w-full max-w-[344px] overflow-hidden rounded-[11px] border border-[#dce3ec] bg-white shadow-[0_14px_32px_rgba(7,22,56,0.15)]">
          <div className="px-4 pb-[8px] pt-[8px] text-center">
            <div className="flex items-center justify-center gap-[7px] text-[#071638]">
              <span className="grid h-[25px] w-[25px] place-items-center rounded-[8px] bg-[#f1f8f4] ring-1 ring-[#e0eee5]">
                <VanIcon />
              </span>
              <div className="text-[15.5px] font-black leading-[1.08] tracking-[-0.025em]">
                <p>{config.label}</p>
                <p>in {place === "SLOUGH" ? "Slough" : place}</p>
              </div>
            </div>
          </div>

          <div className="mx-4 border-t border-[#e8edf3] px-2 pb-[8px] pt-[10px] text-center">
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.025em] text-[#07833f]">
              Fair local price
            </p>
            <div className="mt-[2px] flex items-center justify-center text-[#07833f]">
              <span className="text-[33px] font-black leading-none tracking-[-0.065em]">
                £{config.from} – £{config.to}
              </span>
            </div>
          </div>

          <div className="relative min-h-[124px] bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_36%,#f3fbf6_100%)] px-4 pb-2 pt-[9px]">
            <div className="relative z-10 max-w-[178px] text-left">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.045em] text-[#07833f]">Price guide ready</p>
              <p className="mt-1 text-[11.6px] font-bold leading-[1.3] text-[#44506a]">
                Based on similar local jobs and your selected details.
              </p>
            </div>

            <img
              src="/quickola-koala-only.png"
              alt="Quickola koala"
              className="absolute bottom-[-8px] right-[-2px] h-auto w-[148px] object-contain drop-shadow-[0_9px_17px_rgba(7,22,56,0.12)]"
            />
          </div>
        </section>

        <div className="mx-auto mt-[8px] grid w-full max-w-[344px] gap-[7px]">
          <a
            href={`/check-price?service=${encodeURIComponent(serviceSlug)}&postcode=${encodeURIComponent(place)}&mode=find-provider`}
            className="flex h-[43px] items-center justify-center gap-3 rounded-[6px] bg-[#07833f] px-4 text-[12.5px] font-black uppercase tracking-[0.04em] text-white shadow-[0_10px_20px_rgba(7,131,63,0.18)]"
          >
            Find someone available
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.7]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>

          <a
            href={`/check-price?service=${encodeURIComponent(serviceSlug)}&postcode=${encodeURIComponent(place)}`}
            className="flex h-[30px] items-center justify-between rounded-[4px] border border-[#cfd8e6] bg-white px-4 text-[10.5px] font-black uppercase tracking-[0.03em] text-[#071638] shadow-[0_5px_12px_rgba(7,22,56,0.04)]"
          >
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.3]" strokeLinecap="round" aria-hidden="true">
                <path d="M5 7h14M8 12h8M10 17h4" />
              </svg>
              Refine price range
            </span>
            <span>›</span>
          </a>

          <a
            href="/"
            className="flex h-[30px] items-center justify-between rounded-[4px] border border-[#cfd8e6] bg-white px-4 text-[10.5px] font-black uppercase tracking-[0.03em] text-[#071638] shadow-[0_5px_12px_rgba(7,22,56,0.04)]"
          >
            <span className="inline-flex items-center gap-2">
              Just checking prices
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </a>
        </div>
      </section>
    </main>
  );
}