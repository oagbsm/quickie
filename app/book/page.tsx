import { saveCheckPriceRequest } from "../actions";

declare global {
  interface Window {
    __quickolaBookPhotosInitialised?: boolean;
  }
}

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

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.3]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m8.5 12 2.3 2.3 4.8-5" />
    </svg>
  );
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = (await searchParams) ?? {};
  const serviceSlug = getParam(params, "service", "local-pro");
  const service = formatService(serviceSlug);
  const serviceTitle = titleCase(service);
  const postcode = getParam(params, "postcode", "");
  const requestId = getParam(params, "request_id", "");
  const mode = getParam(params, "mode", "find-provider");
  const wasteType = getParam(params, "wasteType", "");
  const loadSize = getParam(params, "loadSize", "");

async function submitBookRequest(formData: FormData) {
  "use server";

  const honeypot = String(formData.get("company_website") || "").trim();
  if (honeypot) {
    throw new Error("Request blocked.");
  }

  const startedAt = Number(formData.get("started_at") || 0);
  const secondsTaken = startedAt ? (Date.now() - startedAt) / 1000 : 999;
  if (secondsTaken < 3) {
    throw new Error("Please take a few seconds to complete the form before sending.");
  }

  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const allowedPhotoTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]);

  if (photos.length > 5) {
    throw new Error("Please upload no more than 5 photos.");
  }

  for (const photo of photos) {
    if (!allowedPhotoTypes.has(photo.type)) {
      throw new Error("Please upload images only.");
    }

    if (photo.size > 8 * 1024 * 1024) {
      throw new Error("Each photo must be under 8MB.");
    }
  }

  const rawPhone = String(formData.get("phone") || "").trim();

  if (!/^07[0-9]{9}$/.test(rawPhone)) {
    throw new Error("Please enter a valid UK mobile number starting with 07 and using 11 digits only.");
  }

  formData.set("phone", rawPhone);
  formData.set("job_detail", String(formData.get("job_detail") || "").trim());

  const jobDetail = String(formData.get("job_detail") || "").toLowerCase();
  const spamWords = [
    "crypto",
    "casino",
    "viagra",
    "seo backlinks",
    "telegram channel",
    "loan offer",
    "make money fast",
  ];
  const linkCount = (jobDetail.match(/https?:\/\//g) || []).length;

  if (jobDetail.length > 2000 || linkCount >= 2 || spamWords.some((word) => jobDetail.includes(word))) {
    throw new Error("Request blocked as spam.");
  }

  formData.set("postcode", String(formData.get("postcode") || "").trim().toUpperCase());

  return saveCheckPriceRequest(formData);
}

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:bg-[radial-gradient(circle_at_74%_34%,rgba(7,131,63,0.10)_0%,rgba(7,131,63,0.04)_26%,transparent_45%),linear-gradient(180deg,#ffffff_0%,#ffffff_100%)]">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white px-4 pb-5 pt-3 lg:max-w-[1180px] lg:bg-transparent lg:px-8 lg:pb-6 lg:pt-3">
        <header className="relative flex h-[34px] items-center justify-center lg:h-[44px] lg:justify-between">
          <a
            href={`/results?service=${encodeURIComponent(serviceSlug)}&postcode=${encodeURIComponent(postcode)}`}
            aria-label="Back"
            className="absolute left-[-6px] grid h-9 w-9 place-items-center rounded-full text-[#071638] lg:static lg:h-11 lg:w-11 lg:bg-white lg:shadow-[0_10px_24px_rgba(7,22,56,0.08)] lg:ring-1 lg:ring-[#edf2f7]"
          >
            <BackIcon />
          </a>

          <a href="/" className="flex items-center gap-[7px] lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:gap-2" aria-label="Quickola homepage">
            <LogoMark />
            <span className="text-[15px] font-black uppercase leading-none tracking-[-0.055em] text-[#071638] lg:text-[17px]">
              QUICKOLA
            </span>
          </a>

          <a
            href="/"
            className="hidden h-11 items-center justify-center gap-2 rounded-[12px] border border-[#dfe6ef] bg-white px-5 text-[14px] font-black text-[#071638] shadow-[0_10px_24px_rgba(7,22,56,0.06)] transition hover:-translate-y-0.5 hover:border-[#07833f]/35 lg:flex"
          >
            <SearchIcon />
            New search
          </a>
        </header>

        <div className="mx-auto mt-3 hidden w-full max-w-[760px] items-center justify-center gap-6 rounded-full border border-[#e5edf5] bg-[#fbfffc] px-4 py-2 text-[13px] font-bold text-[#44506a] lg:flex">
          <span className="flex items-center gap-2">
            <LocationIcon /> Service: <strong className="text-[#071638]">{serviceTitle}</strong>
          </span>
          <span className="h-1 w-1 rounded-full bg-[#b7c2d2]" />
          <span className="flex items-center gap-2">
            <LocationIcon /> Postcode: <strong className="text-[#071638]">{postcode || "Slough"}</strong>
          </span>
          <span className="h-1 w-1 rounded-full bg-[#b7c2d2]" />
          <span className="flex items-center gap-2">
            <LockIcon /> No payment required
          </span>
        </div>

        <div className="lg:mt-4 lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.72fr)] lg:items-start lg:gap-6">
          <div className="lg:rounded-[24px] lg:border lg:border-[#e1e8ef] lg:bg-white lg:p-4 lg:shadow-[0_18px_50px_rgba(7,22,56,0.07)] xl:p-5">
            <div className="mt-2 flex items-center justify-center gap-3 lg:mt-0">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#07833f] text-[11px] font-black text-white">1</span>
              <div className="h-[2px] w-[48px] rounded-full bg-[#07833f]" />
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#07833f] text-[11px] font-black text-white">2</span>
              <div className="h-[2px] w-[48px] rounded-full bg-[#dfe6ef]" />
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#dfe6ef] text-[11px] font-black text-[#071638]">3</span>
            </div>

            <section className="mt-2 text-center lg:mt-2">
              <h1 className="text-[22px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] lg:text-[28px] xl:text-[30px]">
                Find someone available
              </h1>
              <p className="mx-auto mt-1 max-w-[260px] text-[13px] font-bold leading-[1.25] text-[#44506a] lg:mt-1 lg:max-w-[420px] lg:text-[14px]">
                Tell us a few details and we’ll match you with a suitable {service}.
              </p>
            </section>

            <form className="mt-4 grid gap-3 lg:mt-4 lg:gap-3" action={submitBookRequest}>
              <input type="hidden" name="service" value={serviceSlug} />
              <input type="hidden" name="area" value="slough" />
              <input type="hidden" name="source" value="book-page" />
              <input type="hidden" name="intent" value="wants-provider" />
<input type="hidden" name="started_at" value={String(Date.now())} /><input
  type="text"
  name="company_website"
  tabIndex={-1}
  autoComplete="off"
  className="hidden"
  aria-hidden="true"
/>              <input type="hidden" name="job_type" value={wasteType || serviceSlug} />
              {requestId ? <input type="hidden" name="request_id" value={requestId} /> : null}
              {wasteType ? <input type="hidden" name="waste_type" value={wasteType} /> : null}
              {loadSize ? <input type="hidden" name="load_size" value={loadSize} /> : null}

              <fieldset>
                <legend className="mb-2 text-[12px] font-black leading-none text-[#071638] lg:text-[13px]">When do you need it?</legend>
                <div className="grid grid-cols-4 gap-2 lg:gap-3">
                  <label className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="time_needed" value="today" defaultChecked />
                    <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white lg:h-[38px] lg:rounded-[10px] lg:text-[13px]">
                      Today
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="time_needed" value="tomorrow" />
                    <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white lg:h-[38px] lg:rounded-[10px] lg:text-[13px]">
                      Tomorrow
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="time_needed" value="this-week" />
                    <span className="grid h-[32px] place-items-center rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white lg:h-[38px] lg:rounded-[10px] lg:text-[13px]">
                      This week
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="time_needed" value="pick-date" />
                    <span className="flex h-[32px] items-center justify-center gap-1 rounded-[5px] border border-[#d9e1ec] bg-white text-[11px] font-black text-[#071638] peer-checked:border-[#07833f] peer-checked:bg-[#07833f] peer-checked:text-white lg:h-[38px] lg:rounded-[10px] lg:text-[13px]">
                      Pick date <CalendarIcon />
                    </span>
                  </label>
                </div>
              </fieldset>

              <label className="grid gap-2">
                <span className="text-[12px] font-black leading-none text-[#071638] lg:text-[13px]">Postcode</span>
                <div className="flex h-[45px] items-center overflow-hidden rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10 lg:h-[48px] lg:rounded-[12px]">
                  <span className="grid h-full w-[42px] place-items-center border-r border-[#e2e8f0] text-[#071638] lg:w-[52px]">
                    <LocationIcon />
                  </span>
                  <input
                    name="postcode"
                    defaultValue={postcode}
                    required
                    placeholder="e.g. SL1 1AA"
                    className="h-full min-w-0 flex-1 px-3 text-[15px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a6] lg:px-4 lg:text-[17px]"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-black leading-none text-[#071638] lg:text-[13px]">Add a short job description</span>
                <div className="rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10 lg:rounded-[12px]">
                  <textarea
                    name="job_detail"
                    required
                    maxLength={160}
                    rows={4}
                    placeholder="e.g. Moving a sofa and a few boxes from SL1 to SL3."
                    className="min-h-[88px] w-full resize-none rounded-[7px] px-3 py-2 text-[14px] font-bold leading-[1.35] text-[#071638] outline-none placeholder:text-[#8b94a6] lg:min-h-[82px] lg:rounded-[12px] lg:px-4 lg:py-2.5 lg:text-[15px]"
                  />
                  <div className="flex justify-end border-t border-[#edf1f5] px-3 py-1 text-[11px] font-bold text-[#44506a]">0 / 160</div>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-black leading-none text-[#071638] lg:text-[13px]">Your WhatsApp number</span>
                <div className="flex h-[45px] items-center overflow-hidden rounded-[7px] border border-[#ccd6e2] bg-white focus-within:border-[#07833f] focus-within:ring-2 focus-within:ring-[#07833f]/10 lg:h-[48px] lg:rounded-[12px]">
                  <span className="grid h-full w-[42px] place-items-center border-r border-[#e2e8f0] text-[#071638] lg:w-[52px]">
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
                    className="h-full min-w-0 flex-1 px-3 text-[15px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a6] lg:px-4 lg:text-[17px]"
                  />
                  <span className="grid h-full w-[42px] place-items-center border-l border-[#e2e8f0] text-[#07833f] lg:w-[52px]">
                    <WhatsAppIcon />
                  </span>
                </div>
              </label>

              <div className="grid gap-2">
                <label className="grid cursor-pointer gap-2" htmlFor="bookPhotosInput">
                  <span className="text-[12px] font-black leading-none text-[#071638] lg:text-[13px]">Add photos <span className="font-extrabold text-[#657089]">optional</span></span>
                  <div className="flex min-h-[56px] items-center gap-3 rounded-[9px] border border-dashed border-[#b9c7d8] bg-[#fbfcfd] px-3 py-3 text-left transition hover:border-[#07833f] hover:bg-[#f7fcf8] lg:min-h-[58px] lg:rounded-[14px] lg:px-4 lg:py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#071638] ring-1 ring-[#dfe6ef] lg:h-11 lg:w-11">
                      <CameraIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-black leading-tight text-[#071638] lg:text-[15px]">Upload photos of the job</p>
                      <p className="mt-1 text-[11px] font-bold leading-tight text-[#657089] lg:text-[12px]">Up to 5 photos. Large photos are compressed before sending.</p>
                    </div>
                    <span className="rounded-full bg-[#eef8f2] px-3 py-1 text-[11px] font-black text-[#07833f] lg:px-4 lg:py-1.5 lg:text-[12px]">Add</span>
                    <input id="bookPhotosInput" className="sr-only" type="file" name="photos" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" multiple />
                  </div>
                </label>

                <div id="bookPhotosPreview" className="hidden grid grid-cols-3 gap-2 lg:grid-cols-5" />
                <p id="bookPhotosCount" className="hidden text-[11px] font-bold text-[#657089]">0 photos selected</p>
              </div>
              <script
  dangerouslySetInnerHTML={{
    __html: `
      (() => {


        const input = document.getElementById("bookPhotosInput");
        const preview = document.getElementById("bookPhotosPreview");
        const count = document.getElementById("bookPhotosCount");

if (!input || !preview || !count) return;
if (window.__quickolaBookPhotosInitialised === true) return;
window.__quickolaBookPhotosInitialised = true;

        let selectedFiles = [];
        const maxPhotos = 5;
        const maxRawSize = 8 * 1024 * 1024;
        const maxOutputWidthOrHeight = 1400;
        const outputQuality = 0.78;
        const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

        const syncInputFiles = () => {
          const transfer = new DataTransfer();
          selectedFiles.forEach((file) => transfer.items.add(file));
          input.files = transfer.files;
        };

        const compressImageFile = (file) =>
          new Promise((resolve) => {
            if (
              !file.type.startsWith("image/") ||
              file.type === "image/heic" ||
              file.type === "image/heif" ||
              file.size < 900 * 1024
            ) {
              resolve(file);
              return;
            }

            const objectUrl = URL.createObjectURL(file);
            const image = new Image();

            image.onload = () => {
              URL.revokeObjectURL(objectUrl);

              const scale = Math.min(1, maxOutputWidthOrHeight / Math.max(image.width, image.height));
              const width = Math.max(1, Math.round(image.width * scale));
              const height = Math.max(1, Math.round(image.height * scale));
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;

              const context = canvas.getContext("2d");
              if (!context) {
                resolve(file);
                return;
              }

              context.drawImage(image, 0, 0, width, height);
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(file);
                    return;
                  }

                  const safeName = file.name.replace(/\\.[^.]+$/, "") || "quickola-photo";
                  const compressedFile = new File([blob], safeName + ".jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });

                  resolve(compressedFile.size < file.size ? compressedFile : file);
                },
                "image/jpeg",
                outputQuality
              );
            };

            image.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(file);
            };

            image.src = objectUrl;
          });

        const render = () => {
          preview.innerHTML = "";

          if (!selectedFiles.length) {
            preview.classList.add("hidden");
            count.classList.add("hidden");
            count.textContent = "0 photos selected";
            syncInputFiles();
            return;
          }

          preview.classList.remove("hidden");
          count.classList.remove("hidden");
          count.textContent = selectedFiles.length === 1 ? "1 photo selected" : selectedFiles.length + " photos selected";

          selectedFiles.forEach((file, index) => {
            const card = document.createElement("div");
            card.className = "relative overflow-hidden rounded-[10px] border border-[#dfe6ef] bg-white shadow-[0_8px_16px_rgba(7,22,56,0.06)]";

            const img = document.createElement("img");
            img.className = "h-[74px] w-full object-cover lg:h-[82px]";
            img.alt = file.name;

            if (file.type.startsWith("image/")) {
              img.loading = "lazy";
              img.decoding = "async";
              img.src = URL.createObjectURL(file);
              img.onload = () => URL.revokeObjectURL(img.src);
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-[16px] font-black leading-none text-[#071638] shadow-[0_4px_10px_rgba(7,22,56,0.18)]";
            button.setAttribute("aria-label", "Remove photo");
            button.textContent = "×";
            button.addEventListener("click", () => {
              selectedFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
              syncInputFiles();
              render();
            });

            card.appendChild(img);
            card.appendChild(button);
            preview.appendChild(card);
          });

          syncInputFiles();
        };

        input.addEventListener("change", async () => {
          const incomingFiles = Array.from(input.files || []);
          const mergedFiles = [...selectedFiles];

          for (const file of incomingFiles) {
            if (mergedFiles.length >= maxPhotos) break;
            if (!allowedTypes.has(file.type)) continue;
            if (file.size > maxRawSize) continue;

            const alreadySelected = mergedFiles.some(
              (selected) => selected.name === file.name && selected.size === file.size && selected.lastModified === file.lastModified
            );

            if (!alreadySelected) {
              const optimisedFile = await compressImageFile(file);
              mergedFiles.push(optimisedFile);
            }
          }

selectedFiles = mergedFiles.slice(0, maxPhotos);
syncInputFiles();
render();
        });
      })();
    `,
  }}
/>

              <div className="flex items-start gap-2 text-[11px] font-bold leading-[1.35] text-[#44506a] lg:text-[13px]">
                <span className="mt-[1px] text-[#071638]"><LockIcon /></span>
                <span>We only use this to connect you with one suitable local provider.</span>
              </div>

              <button
                type="submit"
                className="mt-1 flex h-[48px] items-center justify-center gap-3 rounded-[7px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[14px] font-black uppercase tracking-[0.035em] text-white shadow-[0_12px_24px_rgba(0,104,47,0.18)] transition hover:-translate-y-0.5 lg:h-[50px] lg:rounded-[14px] lg:text-[15px] lg:shadow-[0_14px_28px_rgba(0,104,47,0.22)]"
              >
                Find a trusted {service} near me
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.7]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </form>
          </div>

          <aside className="mt-5 hidden space-y-3 lg:sticky lg:top-4 lg:mt-0 lg:block">
            <section className="rounded-[22px] border border-[#dcebe1] bg-[#fbfffc] p-4 shadow-[0_14px_36px_rgba(7,22,56,0.06)]">
              <h2 className="text-[20px] font-black tracking-[-0.045em] text-[#071638]">What happens next?</h2>
              <div className="mt-4 space-y-3">
                <div className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#07833f] text-[14px] font-black text-white">1</span>
                  <div>
                    <p className="text-[15px] font-black text-[#071638]">We check your request</p>
                    <p className="mt-1 text-[14px] font-bold leading-[1.45] text-[#5d6678]">We review the details and match you with a suitable local provider.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#07833f] text-[14px] font-black text-white">2</span>
                  <div>
                    <p className="text-[15px] font-black text-[#071638]">One trusted {service} contacts you</p>
                    <p className="mt-1 text-[14px] font-bold leading-[1.45] text-[#5d6678]">They’ll get in touch on WhatsApp or phone to confirm details.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#07833f] text-[14px] font-black text-white">3</span>
                  <div>
                    <p className="text-[15px] font-black text-[#071638]">You decide — no obligation</p>
                    <p className="mt-1 text-[14px] font-bold leading-[1.45] text-[#5d6678]">You choose if the provider and price works for you.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e1e8ef] bg-white p-4 shadow-[0_14px_36px_rgba(7,22,56,0.05)]">
              <h2 className="text-[21px] font-black tracking-[-0.04em] text-[#071638]">Your request summary</h2>
              <div className="mt-4 divide-y divide-[#edf2f7] text-[14px] font-bold text-[#5d6678]">
                <div className="flex items-center justify-between py-3"><span>Service</span><strong className="text-[#071638]">{serviceTitle}</strong></div>
                <div className="flex items-center justify-between py-3"><span>Postcode</span><strong className="text-[#071638]">{postcode || "Not set"}</strong></div>
                <div className="flex items-center justify-between py-3"><span>When</span><strong className="text-[#071638]">Today</strong></div>
                <div className="flex items-center justify-between py-3"><span>Payment</span><strong className="text-[#071638]">No payment required</strong></div>
              </div>
            </section>
            <section className="rounded-[22px] border border-[#dbe9ff] bg-[#f8fbff] p-4 shadow-[0_14px_36px_rgba(7,22,56,0.04)]">
              <div className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#07833f] ring-1 ring-[#d7e9dd]">
                  <ShieldCheckIcon />
                </span>
                <div>
                  <h2 className="text-[19px] font-black tracking-[-0.035em] text-[#071638]">Your privacy is protected</h2>
                  <p className="mt-2 text-[15px] font-bold leading-[1.45] text-[#5d6678]">We only share your details with one suitable local provider. No spam.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-4 hidden rounded-[20px] border border-[#e1e8ef] bg-white p-4 shadow-[0_10px_28px_rgba(7,22,56,0.04)] lg:grid lg:grid-cols-4 lg:gap-4">
          <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><ShieldCheckIcon /></span>
            <div><p className="text-[14px] font-black text-[#071638]">No payment required</p><p className="mt-1 text-[12px] font-bold text-[#657089]">You only pay if you’re happy.</p></div>
          </div>
          <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><UserCheckIcon /></span>
            <div><p className="text-[14px] font-black text-[#071638]">Trusted local professionals</p><p className="mt-1 text-[12px] font-bold text-[#657089]">We connect you with one suitable provider.</p></div>
          </div>
          <div className="flex items-start gap-3 border-r border-[#e8eef5] pr-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><CheckIcon /></span>
            <div><p className="text-[14px] font-black text-[#071638]">Usually under 2 minutes</p><p className="mt-1 text-[12px] font-bold text-[#657089]">Quick request, no account.</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef9f1] text-[#07833f]"><LockIcon /></span>
            <div><p className="text-[14px] font-black text-[#071638]">No obligation</p><p className="mt-1 text-[12px] font-bold text-[#657089]">You decide what works.</p></div>
          </div>
        </section>
      </section>
    </main>
  );
}