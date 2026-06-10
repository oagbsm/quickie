import { saveCheckPriceRequest } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function formatService(value: string) {
  if (!value) return "local pro";

  const labels: Record<string, string> = {
    "man-and-van": "man & van",
    removals: "removals",
    cleaner: "cleaner",
    plumber: "plumber",
    electrician: "electrician",
    locksmith: "locksmith",
    handyman: "handyman",
    gardener: "gardener",
    "painter-decorator": "painter",
    "waste-removal": "waste removal",
  };

  return labels[value] ?? value.replace(/-/g, " ");
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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.2 19.2 0 0 1-5.9-5.9A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 5.1A9.8 9.8 0 0 0 3.6 16.8L3 21l4.3-1.1A9.8 9.8 0 0 0 19 5.1Z" />
      <path d="M8.9 8.4c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.1-.2.3-.1.5.3.6.7 1.1 1.2 1.6.5.5 1.1.9 1.8 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.9-.5.4-1.2.5-1.9.4-1.1-.2-2.5-.8-3.9-2.1-1.5-1.3-2.6-2.9-3.1-4.2-.3-.7-.2-1.4.1-1.9Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current stroke-[2.1]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8a2 2 0 0 1 2-2h2l1.4-1.8A2 2 0 0 1 11 3.5h2a2 2 0 0 1 1.6.7L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.3]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15" />
      <rect x="4.5" y="5.5" width="15" height="15" rx="2.2" />
    </svg>
  );
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = (await searchParams) ?? {};
  const serviceSlug = getParam(params, "service", "local-pro");
  const service = formatService(serviceSlug);
  const postcode = getParam(params, "postcode", "");

  async function submitBookRequest(formData: FormData) {
    "use server";

    const rawPhone = String(formData.get("phone") || "").trim();

    if (!/^07[0-9]{9}$/.test(rawPhone)) {
      throw new Error("Please enter a valid UK mobile number starting with 07 and using 11 digits only.");
    }

    formData.set("phone", rawPhone);
    formData.set("job_detail", String(formData.get("job_detail") || "").trim());
    formData.set("postcode", String(formData.get("postcode") || "").trim().toUpperCase());

    return saveCheckPriceRequest(formData);
  }

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white px-4 pb-5 pt-3">
        <header className="relative flex h-[34px] items-center justify-center">
          <a href={`/results?service=${encodeURIComponent(serviceSlug)}&postcode=${encodeURIComponent(postcode)}`} aria-label="Back" className="absolute left-[-6px] grid h-9 w-9 place-items-center rounded-full text-[#071638]">
            <BackIcon />
          </a>

          <a href="/" className="flex items-center gap-[7px]" aria-label="Quickola homepage">
            <LogoMark />
            <span className="text-[15px] font-black uppercase leading-none tracking-[-0.055em] text-[#071638]">
              QUICKOLA
            </span>
          </a>
        </header>

        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#07833f] text-[11px] font-black text-white">1</span>
          <div className="h-[2px] w-[48px] rounded-full bg-[#07833f]" />
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#07833f] text-[11px] font-black text-white">2</span>
          <div className="h-[2px] w-[48px] rounded-full bg-[#dfe6ef]" />
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#dfe6ef] text-[11px] font-black text-[#071638]">3</span>
        </div>

        <section className="mt-2 text-center">
          <h1 className="text-[22px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638]">
            Find someone available
          </h1>
          <p className="mx-auto mt-1 max-w-[260px] text-[13px] font-bold leading-[1.25] text-[#44506a]">
            Tell us a few details and we’ll match you with a suitable {service}.
          </p>
        </section>

        <form className="mt-4 grid gap-3" action={submitBookRequest}>
          <input type="hidden" name="service" value={serviceSlug} />
          <input type="hidden" name="area" value="slough" />
          <input type="hidden" name="source" value="book-page" />
          <input type="hidden" name="intent" value="wants-provider" />
          <input type="hidden" name="job_type" value={serviceSlug} />

          <fieldset>
            <legend className="mb-2 text-[12px] font-black leading-none text-[#071638]">When do you need it?</legend>
            <div className="grid grid-cols-4 gap-2">
              <label className="cursor-pointer">
                <input className="peer sr-only" type="radio" name="time_needed" value="today" defaultChecked />
                <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white">
                  Today
                </span>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" type="radio" name="time_needed" value="tomorrow" />
                <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white">
                  Tomorrow
                </span>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" type="radio" name="time_needed" value="this-week" />
                <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white">
                  This week
                </span>
              </label>
              <label className="cursor-pointer">
                <input className="peer sr-only" type="radio" name="time_needed" value="pick-date" />
                <span className="flex h-[32px] items-center justify-center gap-1 rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white">
                  Pick date <CalendarIcon />
                </span>
              </label>
            </div>
          </fieldset>

          <label className="grid gap-2">
            <span className="text-[12px] font-black leading-none text-[#071638]">Postcode</span>
            <div className="flex h-[45px] items-center overflow-hidden rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10">
              <span className="grid h-full w-[42px] place-items-center border-r border-[#e2e8f0] text-[#071638]">
                <LocationIcon />
              </span>
              <input
                name="postcode"
                defaultValue={postcode}
                required
                placeholder="e.g. SL1 1AA"
                className="h-full min-w-0 flex-1 px-3 text-[15px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a6]"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-black leading-none text-[#071638]">Add a short job description</span>
            <div className="rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10">
              <textarea
                name="job_detail"
                required
                maxLength={160}
                rows={4}
                placeholder="e.g. Moving a sofa and a few boxes from SL1 to SL3."
                className="min-h-[88px] w-full resize-none rounded-[7px] px-3 py-2 text-[14px] font-bold leading-[1.35] text-[#071638] outline-none placeholder:text-[#8b94a6]"
              />
              <div className="flex justify-end border-t border-[#edf1f5] px-3 py-1 text-[11px] font-bold text-[#44506a]">0 / 160</div>
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-black leading-none text-[#071638]">Your WhatsApp number</span>
            <div className="flex h-[45px] items-center overflow-hidden rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10">
              <span className="grid h-full w-[42px] place-items-center border-r border-[#e2e8f0] text-[#071638]">
                <PhoneIcon />
              </span>
              <input
                name="phone"
                type="tel"
                required
                inputMode="numeric"
                pattern="07[0-9]{9}"
                minLength={11}
                maxLength={11}
                placeholder="07123456789"
                title="Enter an 11-digit UK mobile number starting with 07. Numbers only."
                className="h-full min-w-0 flex-1 px-3 text-[15px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a6]"
              />
              <span className="grid h-full w-[42px] place-items-center border-l border-[#e2e8f0] text-[#07833f]">
                <WhatsAppIcon />
              </span>
            </div>
          </label>

          <label className="grid cursor-pointer gap-2">
            <span className="text-[12px] font-black leading-none text-[#071638]">Add photos <span className="font-extrabold text-[#657089]">optional</span></span>
            <div className="flex min-h-[56px] items-center gap-3 rounded-[9px] border border-dashed border-[#b9c7d8] bg-[#fbfcfd] px-3 py-3 text-left transition hover:border-[#07833f] hover:bg-[#f7fcf8]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#071638] ring-1 ring-[#dfe6ef]">
                <CameraIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black leading-tight text-[#071638]">Upload photos of the job</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-[#657089]">Photos help the provider understand the job faster.</p>
              </div>
              <span className="rounded-full bg-[#eef8f2] px-3 py-1 text-[11px] font-black text-[#07833f]">Add</span>
              <input className="sr-only" type="file" name="photos" accept="image/*" multiple />
            </div>
          </label>

          <div className="flex items-start gap-2 text-[11px] font-bold leading-[1.35] text-[#44506a]">
            <span className="mt-[1px] text-[#071638]"><LockIcon /></span>
            <span>We only use this to connect you with a suitable local provider.</span>
          </div>

          <button
            type="submit"
            className="mt-1 flex h-[48px] items-center justify-center gap-3 rounded-[7px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[14px] font-black uppercase tracking-[0.035em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.18)]"
          >
            Find me someone
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.7]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </form>
      </section>
    </main>
  );
}