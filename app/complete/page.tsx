

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompletePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function formatLabel(value: string, fallback = "Local service") {
  if (!value) return fallback;

  const labels: Record<string, string> = {
    "man-and-van": "Man & Van",
    removals: "Removals",
    cleaner: "Cleaner",
    plumber: "Plumber",
    electrician: "Electrician",
    locksmith: "Locksmith",
    handyman: "Handyman",
    gardener: "Gardener",
    "painter-decorator": "Painter",
    "waste-removal": "Waste Removal",
    "end-of-tenancy-cleaning": "End of Tenancy",
    "carpet-cleaning": "Carpet Cleaning",
    "oven-cleaning": "Oven Cleaning",
  };

  return labels[value] ?? value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function LogoMark() {
  return (
    <span className="grid h-[23px] w-[23px] place-items-center rounded-[7px] bg-[#071638]">
      <svg viewBox="0 0 32 32" className="h-[78%] w-[78%]" aria-hidden="true">
        <path d="M16 3.8 26.5 8v8.2c0 6.8-4.5 10.8-10.5 12.5C10 27 5.5 23 5.5 16.2V8L16 3.8Z" fill="white" />
        <path d="m10.6 16.2 3.5 3.5 7.5-8" fill="none" stroke="#07833f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-[2.6]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CheckIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-[2.7]`} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 12.4 3.6 3.6L18.2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.2 19.2 0 0 1-5.9-5.9A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20l1.1-4.7a8.2 8.2 0 0 1-.9-3.8 8.9 8.9 0 0 1 17.8 0Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function Confetti() {
  const pieces = [
    "left-[13%] top-[78px] rotate-[-25deg] bg-[#07833f]",
    "left-[24%] top-[112px] rotate-[32deg] bg-[#f7b733]",
    "left-[78%] top-[70px] rotate-[28deg] bg-[#07833f]",
    "left-[88%] top-[118px] rotate-[-35deg] bg-[#6d5dfc]",
    "left-[18%] top-[175px] rotate-[18deg] bg-[#ed4b6e]",
    "left-[83%] top-[190px] rotate-[18deg] bg-[#f7b733]",
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[240px] overflow-hidden">
      {pieces.map((className) => (
        <span key={className} className={`absolute h-[10px] w-[4px] rounded-full ${className}`} />
      ))}
    </div>
  );
}

export default async function CompletePage({ searchParams }: CompletePageProps) {
  const params = (await searchParams) ?? {};
  const service = formatLabel(getParam(params, "service", "local service"));
  const postcode = getParam(params, "postcode", "Slough").toUpperCase();
  const phone = getParam(params, "phone", "your WhatsApp");
  const requestId = getParam(params, "request_id", "");

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-white px-4 pb-5 pt-3">
        <Confetti />

        <header className="relative z-10 flex h-[34px] items-center justify-center">
          <a href="/" aria-label="Back home" className="absolute left-[-6px] grid h-9 w-9 place-items-center rounded-full text-[#071638]">
            <BackIcon />
          </a>

          <a href="/" className="flex items-center gap-[7px]" aria-label="Quickola homepage">
            <LogoMark />
            <span className="text-[15px] font-black uppercase leading-none tracking-[-0.055em] text-[#071638]">
              QUICKOLA
            </span>
          </a>
        </header>

        <section className="relative z-10 flex flex-1 flex-col pt-7 text-center">
          <div className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-full bg-[#07833f] text-white shadow-[0_18px_42px_rgba(7,131,63,0.22)] ring-[12px] ring-[#e9f8ef]">
            <CheckIcon />
          </div>

          <h1 className="mx-auto mt-5 max-w-[320px] text-[32px] font-black leading-[0.98] tracking-[-0.06em] text-[#071638]">
            All set!
          </h1>

          <p className="mx-auto mt-3 max-w-[315px] text-[15px] font-bold leading-[1.38] text-[#44506a]">
            Your request is in. We’ll review it and look for someone suitable near you.
          </p>

          <div className="mt-5 rounded-[18px] border border-[#e1e7ef] bg-[#fbfcfd] p-3 text-left shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[13px] bg-white px-3 py-3 ring-1 ring-[#eef1f5]">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[#657089]">Service</p>
                <p className="mt-1 text-[14px] font-black leading-tight text-[#071638]">{service}</p>
              </div>
              <div className="rounded-[13px] bg-white px-3 py-3 ring-1 ring-[#eef1f5]">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[#657089]">Area</p>
                <p className="mt-1 text-[14px] font-black leading-tight text-[#071638]">{postcode}</p>
              </div>
            </div>
            {requestId ? (
              <p className="mt-2 rounded-[11px] bg-[#f7fcf8] px-3 py-2 text-center text-[11px] font-black text-[#07833f] ring-1 ring-[#d8eddd]">
                Request ID: {requestId.slice(0, 8).toUpperCase()}
              </p>
            ) : null}
          </div>

          <section className="mt-4 rounded-[18px] bg-[#f5f7fb] p-3 text-left">
            <h2 className="text-[14px] font-black tracking-[-0.02em] text-[#071638]">What happens next?</h2>

            <div className="mt-3 grid gap-3">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#dbe7df]"><ListIcon /></span>
                <div>
                  <p className="text-[13px] font-black leading-tight text-[#071638]">We review your details</p>
                  <p className="mt-1 text-[12px] font-bold leading-tight text-[#657089]">Quickola checks the request before anyone is contacted.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#dbe7df]"><PhoneIcon /></span>
                <div>
                  <p className="text-[13px] font-black leading-tight text-[#071638]">A suitable provider may contact you</p>
                  <p className="mt-1 text-[12px] font-bold leading-tight text-[#657089]">They’ll call or message you on {phone ? "WhatsApp" : "your phone"} if they can help.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#dbe7df]"><ChatIcon /></span>
                <div>
                  <p className="text-[13px] font-black leading-tight text-[#071638]">You decide what happens</p>
                  <p className="mt-1 text-[12px] font-bold leading-tight text-[#657089]">Final price and booking are agreed directly with them.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 rounded-[16px] border border-[#d8eddd] bg-[#f2fbf5] p-3 text-left">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#d8eddd]"><HeartIcon /></span>
              <div>
                <p className="text-[14px] font-black leading-tight text-[#071638]">No payment taken. No booking made yet.</p>
                <p className="mt-1 text-[12px] font-bold leading-tight text-[#44506a]">You’re in control. This is not a directory or quote auction.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto grid gap-2 pt-5">
            <a
              href="/"
              className="flex h-[48px] items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[14px] font-black uppercase tracking-[0.035em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.18)]"
            >
              Back to home
            </a>
            <a
              href="/"
              className="flex h-[42px] items-center justify-center rounded-[8px] border border-[#d8eddd] bg-white px-5 text-[14px] font-black text-[#07833f]"
            >
              Check another price
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}