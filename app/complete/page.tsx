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
    <span className="grid h-[23px] w-[23px] place-items-center rounded-[7px] bg-[#071638] lg:h-[32px] lg:w-[32px] lg:rounded-[9px]">
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

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m8.5 12 2.4 2.4 4.8-5" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15" />
      <rect x="4.5" y="5.5" width="15" height="15" rx="2.2" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 17h16M8 3v18M16 3v18" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z" />
      <path d="M7 10 12 2a3 3 0 0 1 3 3v4h4a2 2 0 0 1 2 2l-1.3 7.5A3 3 0 0 1 16.8 21H7" />
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
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[240px] overflow-hidden lg:h-[260px]">
      {pieces.map((className) => (
        <span key={className} className={`absolute h-[10px] w-[4px] rounded-full ${className}`} />
      ))}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf2f7] py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f] ring-1 ring-[#d8eddd]">{icon}</span>
        <span className="text-[13px] font-black text-[#44506a] lg:text-[14px]">{label}</span>
      </div>
      <strong className="max-w-[180px] truncate text-right text-[13px] font-black text-[#071638] lg:text-[14px]">{value}</strong>
    </div>
  );
}

function NextStep({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 lg:gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#dbe7df] lg:h-12 lg:w-12 lg:bg-[#eef9f1]">
        {icon}
      </span>
      <div>
        <p className="text-[13px] font-black leading-tight text-[#071638] lg:text-[16px]">{title}</p>
        <p className="mt-1 text-[12px] font-bold leading-tight text-[#657089] lg:text-[14px] lg:leading-[1.45]">{body}</p>
      </div>
    </div>
  );
}

export default async function CompletePage({ searchParams }: CompletePageProps) {
  const params = (await searchParams) ?? {};
  const service = formatLabel(getParam(params, "service", "local service"));
  const postcode = getParam(params, "postcode", "Slough").toUpperCase();
  const phone = getParam(params, "phone", "your WhatsApp");
  const requestId = getParam(params, "request_id", "");
  const timeNeeded = formatLabel(getParam(params, "time_needed", "This week"), "This week");
  const jobDetail = getParam(params, "job_detail", "");
  const shortRequestId = requestId ? requestId.slice(0, 8).toUpperCase() : "Pending";

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:bg-[radial-gradient(circle_at_50%_18%,rgba(7,131,63,0.08)_0%,rgba(7,131,63,0.03)_28%,transparent_52%)]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-white px-4 pb-5 pt-3 lg:max-w-[1180px] lg:bg-transparent lg:px-8 lg:pb-10 lg:pt-5">
        <Confetti />

        <header className="relative z-10 flex h-[34px] items-center justify-center lg:h-[54px] lg:justify-between">
          <a href="/" aria-label="Back home" className="absolute left-[-6px] grid h-9 w-9 place-items-center rounded-full text-[#071638] lg:static lg:h-11 lg:w-11 lg:bg-white lg:shadow-[0_10px_24px_rgba(7,22,56,0.08)] lg:ring-1 lg:ring-[#edf2f7]">
            <BackIcon />
          </a>

          <a href="/" className="flex items-center gap-[7px] lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:gap-2" aria-label="Quickola homepage">
            <LogoMark />
            <span className="text-[15px] font-black uppercase leading-none tracking-[-0.055em] text-[#071638] lg:text-[20px]">
              QUICKOLA
            </span>
          </a>

          <a href="/" className="hidden h-11 items-center justify-center gap-2 rounded-[12px] border border-[#dfe6ef] bg-white px-5 text-[14px] font-black text-[#071638] shadow-[0_10px_24px_rgba(7,22,56,0.06)] transition hover:-translate-y-0.5 hover:border-[#07833f]/35 lg:flex">
            <SearchIcon />
            New search
          </a>
        </header>

        <div className="relative z-10 flex flex-1 flex-col pt-7 text-center lg:pt-8">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-start lg:gap-7 lg:text-left">
            <section className="rounded-[28px] bg-white lg:border lg:border-[#e1e8ef] lg:p-8 lg:text-center lg:shadow-[0_24px_70px_rgba(7,22,56,0.08)]">
              <div className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-full bg-[#07833f] text-white shadow-[0_18px_42px_rgba(7,131,63,0.22)] ring-[12px] ring-[#e9f8ef] lg:h-[104px] lg:w-[104px]">
                <CheckIcon className="h-12 w-12 lg:h-14 lg:w-14" />
              </div>

              <h1 className="mx-auto mt-5 max-w-[320px] text-[32px] font-black leading-[0.98] tracking-[-0.06em] text-[#071638] lg:mt-6 lg:text-[54px]">
                All set!
              </h1>

              <p className="mx-auto mt-3 max-w-[315px] text-[15px] font-bold leading-[1.38] text-[#44506a] lg:max-w-[520px] lg:text-[18px]">
                Your request is in. We’ll check it and send it to one suitable local provider.
              </p>

              <div className="mt-5 rounded-[18px] border border-[#e1e7ef] bg-[#fbfcfd] p-3 text-left shadow-[0_10px_28px_rgba(7,22,56,0.04)] lg:mx-auto lg:mt-7 lg:max-w-[560px] lg:rounded-[20px] lg:bg-white lg:p-4">
                <h2 className="mb-1 px-1 text-[14px] font-black tracking-[-0.02em] text-[#071638] lg:text-[16px]">Request summary</h2>
                <SummaryRow icon={<LockIcon />} label="Service" value={service} />
                <SummaryRow icon={<LocationIcon />} label="Area" value={postcode} />
                <SummaryRow icon={<CalendarIcon />} label="When" value={timeNeeded} />
                {jobDetail ? <SummaryRow icon={<ListIcon />} label="Job" value={jobDetail} /> : null}
                <SummaryRow icon={<IdIcon />} label="Request ID" value={shortRequestId} />
              </div>

              <div className="mt-4 rounded-[16px] border border-[#d8eddd] bg-[#f2fbf5] p-3 text-left lg:mx-auto lg:mt-5 lg:max-w-[560px] lg:rounded-[18px] lg:p-4">
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#d8eddd] lg:h-11 lg:w-11"><HeartIcon /></span>
                  <div>
                    <p className="text-[14px] font-black leading-tight text-[#071638] lg:text-[18px]">No payment taken. No booking made yet.</p>
                    <p className="mt-1 text-[12px] font-bold leading-tight text-[#44506a] lg:text-[14px] lg:leading-[1.45]">A provider may contact you if they’re available. You stay in control — with no obligation.</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="mt-4 grid gap-4 text-left lg:mt-0 lg:gap-5">
              <section className="rounded-[18px] bg-[#f5f7fb] p-3 lg:rounded-[24px] lg:border lg:border-[#e1e8ef] lg:bg-white lg:p-6 lg:shadow-[0_18px_48px_rgba(7,22,56,0.06)]">
                <h2 className="text-[14px] font-black tracking-[-0.02em] text-[#071638] lg:text-[24px]">What happens next?</h2>
                <div className="mt-3 grid gap-3 lg:mt-5 lg:gap-5">
                  <NextStep icon={<ListIcon />} title="We review your details" body="Quickola checks your request before anyone is contacted." />
                  <NextStep icon={<PhoneIcon />} title="One suitable provider may contact you" body={`They’ll call or message you on ${phone ? "WhatsApp" : "your phone"} if they can help.`} />
                  <NextStep icon={<ChatIcon />} title="You decide what happens" body="Final price and booking are agreed directly with them." />
                </div>
              </section>

              <section className="rounded-[16px] border border-[#d8eddd] bg-[#f2fbf5] p-3 lg:rounded-[22px] lg:p-5 lg:shadow-[0_14px_36px_rgba(7,22,56,0.04)]">
                <div className="flex gap-3 lg:gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#d8eddd] lg:h-12 lg:w-12"><ShieldIcon /></span>
                  <div>
                    <p className="text-[14px] font-black leading-tight text-[#07833f] lg:text-[18px]">Privacy protected</p>
                    <p className="mt-1 text-[12px] font-bold leading-tight text-[#44506a] lg:text-[14px] lg:leading-[1.45]">We never share your details publicly. Only suitable providers in your area may contact you.</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div className="mt-auto grid gap-2 pt-5 lg:mx-auto lg:mt-8 lg:grid-cols-2 lg:gap-8 lg:pt-0">
            <a
              href="/"
              className="flex h-[48px] items-center justify-center gap-2 rounded-[8px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[14px] font-black uppercase tracking-[0.035em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.18)] transition hover:-translate-y-0.5 lg:h-[58px] lg:w-[260px] lg:rounded-[12px]"
            >
              <HomeIcon />
              Back to home
            </a>
            <a
              href="/"
              className="flex h-[42px] items-center justify-center gap-2 rounded-[8px] border border-[#d8eddd] bg-white px-5 text-[14px] font-black text-[#07833f] transition hover:-translate-y-0.5 hover:border-[#07833f]/50 lg:h-[58px] lg:w-[280px] lg:rounded-[12px] lg:border-2"
            >
              <SearchIcon />
              Check another price
            </a>
          </div>

          <p className="mt-3 flex items-center justify-center gap-2 text-[12px] font-black text-[#657089] lg:mt-4 lg:text-[14px]">
            <LockIcon /> Your details are secure and never shared publicly.
          </p>

          <section className="mt-5 hidden rounded-[22px] border border-[#e1e8ef] bg-white p-5 text-left shadow-[0_14px_36px_rgba(7,22,56,0.05)] lg:grid lg:grid-cols-4 lg:gap-4">
            <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><ShieldIcon /></span>
              <div><p className="text-[14px] font-black text-[#071638]">Trusted local providers</p><p className="mt-1 text-[12px] font-bold text-[#657089]">Checked and rated by real customers.</p></div>
            </div>
            <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><ThumbsUpIcon /></span>
              <div><p className="text-[14px] font-black text-[#071638]">Fast & reliable</p><p className="mt-1 text-[12px] font-bold text-[#657089]">Providers respond quickly.</p></div>
            </div>
            <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><LockIcon /></span>
              <div><p className="text-[14px] font-black text-[#071638]">Secure & private</p><p className="mt-1 text-[12px] font-bold text-[#657089]">Your details are safe with Quickola.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><PeopleIcon /></span>
              <div><p className="text-[14px] font-black text-[#071638]">You’re in control</p><p className="mt-1 text-[12px] font-bold text-[#657089]">No obligation. You decide.</p></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}