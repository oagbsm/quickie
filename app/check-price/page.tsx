import Link from "next/link";
import Footer from "../components/Footer";
import { saveCheckPriceRequest } from "../actions";

type CheckPricePageProps = {
  searchParams?: Promise<{
    service?: string;
    area?: string;
    postcode?: string;
  }>;
};

type PriceItem = {
  label: string;
  from: string;
  typical: string;
};

type ServiceConfig = {
  label: string;
  slug: string;
  headline: string;
  shortLine: string;
  guideLabel: string;
  priceItems: PriceItem[];
  jobOptions: { label: string; value: string }[];
  detailLabel: string;
  detailOptions: { label: string; value: string }[];
};

const urgencyOptions = [
  { label: "As soon as possible", value: "asap" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This week", value: "this-week" },
  { label: "Flexible", value: "flexible" },
];

const serviceConfigs: Record<string, ServiceConfig> = {
  cleaning: {
    label: "Cleaning",
    slug: "cleaning",
    headline: "Cleaning prices",
    shortLine: "See fair cleaning ranges before you request a local match.",
    guideLabel: "Typical cleaning ranges",
    priceItems: [
      { label: "Regular cleaning", from: "£18/hr", typical: "Hourly range for regular home cleaning." },
      { label: "Deep cleaning", from: "£90", typical: "Fixed guide price depending on size and condition." },
      { label: "End of tenancy", from: "£120", typical: "Usually fixed price, extras may apply." },
    ],
    jobOptions: [
      { label: "Regular cleaning", value: "regular-cleaning" },
      { label: "One-off cleaning", value: "one-off-cleaning" },
      { label: "Deep cleaning", value: "deep-cleaning" },
      { label: "End of tenancy", value: "end-of-tenancy-cleaning" },
    ],
    detailLabel: "Property size",
    detailOptions: [
      { label: "Studio", value: "studio" },
      { label: "1 bedroom", value: "1-bedroom" },
      { label: "2 bedrooms", value: "2-bedrooms" },
      { label: "3 bedrooms", value: "3-bedrooms" },
      { label: "4+ bedrooms", value: "4-plus-bedrooms" },
    ],
  },
  "end-of-tenancy-cleaning": {
    label: "End of Tenancy Cleaning",
    slug: "end-of-tenancy-cleaning",
    headline: "End of tenancy cleaning prices",
    shortLine: "Check the fair move-out cleaning range before you book.",
    guideLabel: "Typical end of tenancy ranges",
    priceItems: [
      { label: "Studio / 1 bed", from: "£120", typical: "Small property guide range before extras." },
      { label: "2–3 bedrooms", from: "£180", typical: "Depends on condition, access and appliances." },
      { label: "Large property", from: "£300+", typical: "Bigger homes and heavy cleans cost more." },
    ],
    jobOptions: [
      { label: "End of tenancy clean", value: "end-of-tenancy-cleaning" },
      { label: "Move-out clean", value: "move-out-cleaning" },
      { label: "Deposit clean", value: "deposit-cleaning" },
    ],
    detailLabel: "Property size",
    detailOptions: [
      { label: "Studio", value: "studio" },
      { label: "1 bedroom", value: "1-bedroom" },
      { label: "2 bedrooms", value: "2-bedrooms" },
      { label: "3 bedrooms", value: "3-bedrooms" },
      { label: "4+ bedrooms", value: "4-plus-bedrooms" },
    ],
  },
  "man-and-van": {
    label: "Man and Van",
    slug: "man-and-van",
    headline: "Man and van prices",
    shortLine: "Check the fair local van job range before you book.",
    guideLabel: "Typical man and van ranges",
    priceItems: [
      { label: "Small van job", from: "£45/hr", typical: "Usually depends on distance and loading time." },
      { label: "Half-day move", from: "£140", typical: "Common for student moves or single-room moves." },
      { label: "Larger van job", from: "£250+", typical: "More helpers, stairs and distance increase price." },
    ],
    jobOptions: [
      { label: "Small move", value: "small-move" },
      { label: "Collection / delivery", value: "collection-delivery" },
      { label: "Furniture transport", value: "furniture-transport" },
      { label: "Urgent van job", value: "urgent-van-job" },
    ],
    detailLabel: "Job size",
    detailOptions: [
      { label: "Few items", value: "few-items" },
      { label: "One room", value: "one-room" },
      { label: "Small flat", value: "small-flat" },
      { label: "Large load", value: "large-load" },
    ],
  },
  removals: {
    label: "Removals",
    slug: "removals",
    headline: "Removal prices",
    shortLine: "See fair moving ranges before you request a removal quote.",
    guideLabel: "Typical removal ranges",
    priceItems: [
      { label: "Small flat move", from: "£250", typical: "Depends on distance, stairs and movers." },
      { label: "2–3 bed move", from: "£450", typical: "Packing, floors and parking affect the final price." },
      { label: "Large move", from: "£800+", typical: "Large homes usually need more movers and vehicles." },
    ],
    jobOptions: [
      { label: "Flat move", value: "flat-move" },
      { label: "House move", value: "house-move" },
      { label: "Office move", value: "office-move" },
    ],
    detailLabel: "Move size",
    detailOptions: [
      { label: "Studio / room", value: "studio-room" },
      { label: "1 bedroom", value: "1-bedroom" },
      { label: "2 bedrooms", value: "2-bedrooms" },
      { label: "3+ bedrooms", value: "3-plus-bedrooms" },
    ],
  },
  plumber: {
    label: "Plumber",
    slug: "plumber",
    headline: "Plumber prices",
    shortLine: "Check the fair plumbing callout range before you book.",
    guideLabel: "Typical plumber ranges",
    priceItems: [
      { label: "Callout", from: "£80", typical: "Before parts or extra labour." },
      { label: "Leak repair", from: "£90", typical: "Depends on access, urgency and parts." },
      { label: "Emergency job", from: "£120+", typical: "Evenings and weekends usually cost more." },
    ],
    jobOptions: [
      { label: "Leak", value: "leak" },
      { label: "Blocked sink/toilet", value: "blocked-sink-toilet" },
      { label: "Tap or pipe repair", value: "tap-pipe-repair" },
      { label: "Emergency plumbing", value: "emergency-plumbing" },
    ],
    detailLabel: "Job type",
    detailOptions: [
      { label: "Small repair", value: "small-repair" },
      { label: "Callout needed", value: "callout" },
      { label: "Urgent issue", value: "urgent" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  electrician: {
    label: "Electrician",
    slug: "electrician",
    headline: "Electrician prices",
    shortLine: "Check the fair electrical callout range before you book.",
    guideLabel: "Typical electrician ranges",
    priceItems: [
      { label: "Callout", from: "£80", typical: "Before parts or extra labour." },
      { label: "Small repair", from: "£90", typical: "Sockets, switches and small faults vary by access." },
      { label: "Emergency job", from: "£120+", typical: "Urgent or out-of-hours jobs cost more." },
    ],
    jobOptions: [
      { label: "Fault / repair", value: "fault-repair" },
      { label: "Sockets / switches", value: "sockets-switches" },
      { label: "Lighting", value: "lighting" },
      { label: "Emergency electrician", value: "emergency-electrician" },
    ],
    detailLabel: "Job type",
    detailOptions: [
      { label: "Small repair", value: "small-repair" },
      { label: "Installation", value: "installation" },
      { label: "Urgent issue", value: "urgent" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  locksmith: {
    label: "Locksmith",
    slug: "locksmith",
    headline: "Locksmith prices",
    shortLine: "Check the fair locksmith range before you book.",
    guideLabel: "Typical locksmith ranges",
    priceItems: [
      { label: "Lockout", from: "£85", typical: "Depends on lock type and time." },
      { label: "Lock change", from: "£95", typical: "Final price depends on lock and parts." },
      { label: "Emergency", from: "£120+", typical: "Out-of-hours callouts can cost more." },
    ],
    jobOptions: [
      { label: "Locked out", value: "locked-out" },
      { label: "Lock change", value: "lock-change" },
      { label: "Key issue", value: "key-issue" },
      { label: "Emergency locksmith", value: "emergency-locksmith" },
    ],
    detailLabel: "Lock type",
    detailOptions: [
      { label: "Front door", value: "front-door" },
      { label: "Internal door", value: "internal-door" },
      { label: "UPVC / patio", value: "upvc-patio" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  handyman: {
    label: "Handyman",
    slug: "handyman",
    headline: "Handyman prices",
    shortLine: "See fair handyman ranges before you request help.",
    guideLabel: "Typical handyman ranges",
    priceItems: [
      { label: "Hourly work", from: "£40/hr", typical: "Small jobs are usually charged hourly." },
      { label: "Flat pack", from: "£50", typical: "Depends on item size and complexity." },
      { label: "Half day", from: "£150", typical: "Good for several small jobs." },
    ],
    jobOptions: [
      { label: "Small repair", value: "small-repair" },
      { label: "Flat pack assembly", value: "flat-pack" },
      { label: "Mounting / fitting", value: "mounting-fitting" },
      { label: "Multiple jobs", value: "multiple-jobs" },
    ],
    detailLabel: "Job size",
    detailOptions: [
      { label: "One small job", value: "one-small-job" },
      { label: "Few small jobs", value: "few-small-jobs" },
      { label: "Half day", value: "half-day" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  gardener: {
    label: "Gardener",
    slug: "gardener",
    headline: "Gardener prices",
    shortLine: "Check the fair garden work range before you book.",
    guideLabel: "Typical gardener ranges",
    priceItems: [
      { label: "Hourly gardening", from: "£25/hr", typical: "Basic garden maintenance is often hourly." },
      { label: "Hedge trimming", from: "£60", typical: "Depends on height, length and waste." },
      { label: "Garden clearance", from: "£120+", typical: "Large clearances need more labour." },
    ],
    jobOptions: [
      { label: "Garden maintenance", value: "garden-maintenance" },
      { label: "Lawn mowing", value: "lawn-mowing" },
      { label: "Hedge trimming", value: "hedge-trimming" },
      { label: "Garden clearance", value: "garden-clearance" },
    ],
    detailLabel: "Garden size",
    detailOptions: [
      { label: "Small", value: "small" },
      { label: "Medium", value: "medium" },
      { label: "Large", value: "large" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "pest-control": {
    label: "Pest Control",
    slug: "pest-control",
    headline: "Pest control prices",
    shortLine: "Check the fair pest treatment range before you book.",
    guideLabel: "Typical pest control ranges",
    priceItems: [
      { label: "Initial treatment", from: "£90", typical: "Depends on pest type and property size." },
      { label: "Mice treatment", from: "£120", typical: "Often needs inspection and follow-up." },
      { label: "Bed bugs", from: "£180+", typical: "Usually costs more due to complexity." },
    ],
    jobOptions: [
      { label: "Mice / rats", value: "mice-rats" },
      { label: "Bed bugs", value: "bed-bugs" },
      { label: "Wasps", value: "wasps" },
      { label: "Other pest", value: "other-pest" },
    ],
    detailLabel: "Property type",
    detailOptions: [
      { label: "Flat", value: "flat" },
      { label: "House", value: "house" },
      { label: "Business", value: "business" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "painter-decorator": {
    label: "Painter / Decorator",
    slug: "painter-decorator",
    headline: "Painter decorator prices",
    shortLine: "Check the fair painting and decorating range before you book.",
    guideLabel: "Typical painter ranges",
    priceItems: [
      { label: "Day rate", from: "£180/day", typical: "Day rates vary by area and experience." },
      { label: "Small room", from: "£250", typical: "Depends on prep, paint and condition." },
      { label: "Full flat", from: "£900+", typical: "Larger jobs depend on rooms and finish." },
    ],
    jobOptions: [
      { label: "Room painting", value: "room-painting" },
      { label: "Full flat / house", value: "full-property" },
      { label: "Decorating", value: "decorating" },
      { label: "Touch-ups", value: "touch-ups" },
    ],
    detailLabel: "Job size",
    detailOptions: [
      { label: "One room", value: "one-room" },
      { label: "Few rooms", value: "few-rooms" },
      { label: "Whole property", value: "whole-property" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "carpet-cleaning": {
    label: "Carpet Cleaning",
    slug: "carpet-cleaning",
    headline: "Carpet cleaning prices",
    shortLine: "Check the fair carpet cleaning range before you book.",
    guideLabel: "Typical carpet cleaning ranges",
    priceItems: [
      { label: "Single room", from: "£40", typical: "Depends on room size and stains." },
      { label: "Two rooms", from: "£70", typical: "Often cheaper when bundled." },
      { label: "Whole flat", from: "£120+", typical: "Depends on room count and access." },
    ],
    jobOptions: [
      { label: "Single room", value: "single-room" },
      { label: "Multiple rooms", value: "multiple-rooms" },
      { label: "Rug / upholstery", value: "rug-upholstery" },
      { label: "End of tenancy carpets", value: "end-tenancy-carpets" },
    ],
    detailLabel: "Number of rooms",
    detailOptions: [
      { label: "1 room", value: "1-room" },
      { label: "2 rooms", value: "2-rooms" },
      { label: "3+ rooms", value: "3-plus-rooms" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "oven-cleaning": {
    label: "Oven Cleaning",
    slug: "oven-cleaning",
    headline: "Oven cleaning prices",
    shortLine: "Check the fair oven cleaning range before you book.",
    guideLabel: "Typical oven cleaning ranges",
    priceItems: [
      { label: "Single oven", from: "£50", typical: "Basic oven cleaning varies by condition." },
      { label: "Double oven", from: "£70", typical: "Larger ovens usually cost more." },
      { label: "Oven + hob", from: "£90+", typical: "Add-ons increase the total price." },
    ],
    jobOptions: [
      { label: "Single oven", value: "single-oven" },
      { label: "Double oven", value: "double-oven" },
      { label: "Oven + hob", value: "oven-hob" },
      { label: "Extractor included", value: "extractor-included" },
    ],
    detailLabel: "Condition",
    detailOptions: [
      { label: "Light use", value: "light-use" },
      { label: "Normal use", value: "normal-use" },
      { label: "Heavy grease", value: "heavy-grease" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "waste-removal": {
    label: "Waste Removal",
    slug: "waste-removal",
    headline: "Waste removal prices",
    shortLine: "Check the fair rubbish removal range before you book.",
    guideLabel: "Typical waste removal ranges",
    priceItems: [
      { label: "Small load", from: "£80", typical: "Depends on volume and waste type." },
      { label: "Medium load", from: "£140", typical: "Weight, labour and disposal fees affect price." },
      { label: "House clearance", from: "£250+", typical: "Large clearances need more labour." },
    ],
    jobOptions: [
      { label: "Rubbish removal", value: "rubbish-removal" },
      { label: "Furniture disposal", value: "furniture-disposal" },
      { label: "House clearance", value: "house-clearance" },
      { label: "Garden waste", value: "garden-waste" },
    ],
    detailLabel: "Load size",
    detailOptions: [
      { label: "Small load", value: "small-load" },
      { label: "Medium load", value: "medium-load" },
      { label: "Large load", value: "large-load" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "appliance-repair": {
    label: "Appliance Repair",
    slug: "appliance-repair",
    headline: "Appliance repair prices",
    shortLine: "Check the fair appliance repair range before you book.",
    guideLabel: "Typical appliance repair ranges",
    priceItems: [
      { label: "Callout", from: "£70", typical: "Diagnosis before parts or repair." },
      { label: "Common repair", from: "£90", typical: "Depends on appliance type and parts." },
      { label: "Urgent repair", from: "£120+", typical: "Same-day repairs can cost more." },
    ],
    jobOptions: [
      { label: "Washing machine", value: "washing-machine" },
      { label: "Fridge / freezer", value: "fridge-freezer" },
      { label: "Dishwasher", value: "dishwasher" },
      { label: "Other appliance", value: "other-appliance" },
    ],
    detailLabel: "Issue type",
    detailOptions: [
      { label: "Not working", value: "not-working" },
      { label: "Leaking", value: "leaking" },
      { label: "Noise / fault", value: "noise-fault" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
};

const popularSearches = [
  { label: "Cleaning near E17", service: "cleaning", postcode: "E17 6AA" },
  { label: "Man and van near NW4", service: "man-and-van", postcode: "NW4 4BT" },
  { label: "Plumber near HA8", service: "plumber", postcode: "HA8 6HU" },
  { label: "Locksmith near IG1", service: "locksmith", postcode: "IG1 1AA" },
];

function formatParam(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPostcodeParam(value: string | undefined) {
  if (!value) return "your postcode";

  const clean = value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!clean) return "your postcode";
  return clean;
}
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getServiceConfig(serviceSlug: string): ServiceConfig {
  return serviceConfigs[serviceSlug] ?? serviceConfigs.cleaning;
}

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Quickola homepage">
      <img
        src="/quickola/logo-mark.png"
        alt="Quickola"
        className="h-9 w-9 shrink-0 rounded-full object-contain sm:h-10 sm:w-10"
      />
      <span className="text-[24px] font-extrabold leading-none tracking-[-0.035em] text-[#071638] sm:text-[30px]">
        Quickola
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[62px] w-full max-w-[1220px] items-center justify-between px-4 sm:min-h-[74px] sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-extrabold text-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]"
        >
          New search
        </Link>
      </div>
    </header>
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

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3L20 10.7a2 2 0 0 1 0 2.8Z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 12h16" />
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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function SelectField({
  label,
  name,
  options,
  icon,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  icon: React.ReactNode;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-[#071638]">{label}</span>
      <div className="relative flex h-[48px] items-center gap-3 rounded-[13px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#08783f] focus-within:ring-4 focus-within:ring-[#08783f]/10">
        <span className="shrink-0 text-[#071638]">{icon}</span>
        <select
          name={name}
          defaultValue={defaultValue ?? options[0]?.value}
          className="min-w-0 flex-1 appearance-none bg-transparent text-[14px] font-bold text-[#071638] outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="pointer-events-none text-[20px] font-black text-[#071638]">⌄</span>
      </div>
    </label>
  );
}

function TextInput({
  label,
  name,
  placeholder,
  icon,
  type = "text",
  required,
  pattern,
  inputMode,
  title,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  required?: boolean;
  pattern?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  title?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-[#071638]">{label}</span>
      <div className="flex h-[48px] items-center gap-3 rounded-[13px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#08783f] focus-within:ring-4 focus-within:ring-[#08783f]/10">
        <span className="shrink-0 text-[#071638]">{icon}</span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          pattern={pattern}
          inputMode={inputMode}
          title={title}
          minLength={minLength}
          maxLength={maxLength}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a7]"
        />
      </div>
    </label>
  );
}

function PriceCard({ config }: { config: ServiceConfig }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-[#071638] text-white shadow-[0_18px_46px_rgba(7,22,56,0.16)]">
      <div className="px-4 py-4 text-center sm:px-7 sm:py-5">
        <p className="text-[13px] font-bold text-white/82 sm:text-[15px]">{config.guideLabel}</p>
        <div className="mt-2 flex flex-wrap items-end justify-center gap-2 sm:mt-3">
          <span className="text-[34px] font-black tracking-[-0.045em] sm:text-[46px]">{config.priceItems[0]?.from}</span>
          <span className="pb-1.5 text-[18px] font-bold text-white/80 sm:pb-2 sm:text-[22px]">from</span>
        </div>
        <p className="mt-1 text-[12px] font-medium text-white/68 sm:mt-2 sm:text-[15px]">Guide range before final job details.</p>
      </div>

      <div className="grid grid-cols-3 border-t border-white/12">
        {config.priceItems.slice(0, 3).map((item, index) => (
          <div key={item.label} className={`${index < 2 ? "border-r border-white/12" : ""} px-2 py-4 text-center sm:px-4`}>
            <p className="text-[11px] font-bold sm:text-[14px]">{item.label}</p>
            <p className="mt-1 text-[13px] font-black sm:text-[18px]">{item.from}</p>
            <p className="mt-0.5 text-[10px] font-bold text-white/65 sm:mt-1 sm:text-[12px]">Guide</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeftPanel({ config, postcode }: { config: ServiceConfig; postcode: string }) {
  return (
    <section className="rounded-[24px] border border-[#e1e6ee] bg-white p-4 shadow-[0_16px_50px_rgba(7,22,56,0.06)] sm:p-6 lg:p-7">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#08783f] sm:text-[12px]">Instant price range</p>
      <h1 className="mt-2 max-w-[650px] text-[32px] font-black leading-[1.04] tracking-[-0.055em] text-[#071638] sm:mt-3 sm:text-[48px] lg:text-[56px]">
        {config.headline} near <span className="text-[#08783f]">{postcode}</span>
      </h1>

      <p className="mt-3 max-w-[620px] text-[14px] font-semibold leading-[1.55] text-[#172545] sm:mt-4 sm:text-[17px] sm:leading-[1.6]">
        {config.shortLine} See the guide range first, then request a match only if useful.
      </p>

      <div className="mt-4 sm:mt-5">
        <PriceCard config={config} />
      </div>

      <Link
        href="#match-form"
        className="mt-4 flex h-[48px] w-full items-center justify-center gap-3 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5 sm:hidden"
      >
        Request a match
        <span className="text-[24px] leading-none">→</span>
      </Link>

      <div className="mt-4 rounded-[17px] border border-[#dfe5ee] bg-[#fbfcfd] px-4 py-3">
        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 text-[#08783f]"><TagIcon /></span>
          <p className="text-[14px] font-bold leading-[1.55] text-[#44506a]">
            Final price can change after job size, urgency, access, parking, parts, materials or extras are confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}

function DetailsForm({
  config,
  postcode,
}: {
  config: ServiceConfig;
  postcode: string;
}) {
  return (
    <aside id="match-form" className="scroll-mt-[86px] rounded-[24px] border border-[#e1e6ee] bg-white p-4 shadow-[0_16px_50px_rgba(7,22,56,0.06)] sm:p-5 lg:sticky lg:top-[84px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        {["1", "2", "3"].map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-black ${index === 0 ? "bg-[#071638] text-white" : "bg-[#eef3f7] text-[#40607e]"}`}>
              {step}
            </span>
            {index < 2 ? <span className="h-[2px] flex-1 rounded-full bg-[#dfe5ee]" /> : null}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-[25px] font-black leading-[1.08] tracking-[-0.04em] text-[#071638]">
          Request your <span className="text-[#08783f]">local match</span>
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-[#657089]">Takes around 30 seconds</p>
      </div>

      <form action={saveCheckPriceRequest} className="mt-5 space-y-3">
        <input type="hidden" name="service" value={config.slug} />
        <input type="hidden" name="postcode" value={postcode} />
        <input type="hidden" name="source" value="check-price" />

        <SelectField label="What job do you need?" name="job_type" options={config.jobOptions} icon={<BriefcaseIcon />} />
        <SelectField label={config.detailLabel} name="job_detail" options={config.detailOptions} icon={<TagIcon />} />
        <SelectField label="When do you need it?" name="time_needed" options={urgencyOptions} icon={<CalendarIcon />} />

        <div className="rounded-[14px] border border-[#dfe5ee] bg-[#fbfcfd] px-4 py-3">
          <div className="flex items-center gap-3 text-[#071638]">
            <LocationIcon />
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">Postcode</p>
              <p className="text-[15px] font-black text-[#071638]">{postcode}</p>
            </div>
          </div>
        </div>

        <TextInput
          label="Your email"
          name="email"
          type="email"
          placeholder="you@example.com"
          icon={<MailIcon />}
          required
        />
        <p className="-mt-2 text-[12px] font-bold text-[#08783f]">
          We’ll send your fair price and best next step here.
        </p>

        <TextInput
          label="Phone / WhatsApp (optional)"
          name="phone"
          type="tel"
          placeholder="07xxx xxxxxx"
          icon={<PhoneIcon />}
          pattern="07[0-9]{9}"
          inputMode="numeric"
          title="Enter an 11-digit UK mobile number starting with 07."
          minLength={11}
          maxLength={11}
        />
        <p className="-mt-2 text-[12px] font-bold text-[#08783f]">
          Optional — UK mobile only, 11 digits starting with 07.
        </p>
        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[13px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
        >
          Request my match
          <span className="text-[28px] leading-none">→</span>
        </button>

        <p className="text-center text-[12px] font-semibold text-[#657089]">No signup. No booking pressure. Your request stays private.</p>
      </form>

      <div className="mt-4 rounded-[18px] border border-[#dcebe1] bg-[#f7fcf8] p-4">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#08783f] text-white"><ShieldIcon /></span>
          <div>
            <p className="text-[17px] font-black text-[#071638]">Price first, match second</p>
            <p className="mt-1 text-[14px] font-semibold leading-[1.5] text-[#44506a]">
              We use your details only to help with this {config.label.toLowerCase()} request near {postcode}.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WhatHappensNext() {
  const steps = [
    ["1", "We receive your request", "Your job details are saved"],
    ["2", "We check suitable providers", "Manual matching while we launch"],
    ["3", "You choose what to do", "No obligation to book"],
  ];

  return (
    <section className="mx-auto mt-5 max-w-[1220px] rounded-[26px] border border-[#e1e6ee] bg-white p-5 shadow-[0_18px_50px_rgba(7,22,56,0.05)] sm:p-7">
      <h2 className="text-center text-[24px] font-black tracking-[-0.03em] text-[#071638]">What happens next?</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(([number, title, text]) => (
          <div key={title} className="rounded-[18px] border border-[#edf0f5] bg-[#fbfcfd] p-5 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f0faf3] text-[15px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">{number}</span>
            <p className="mt-4 text-[16px] font-black text-[#071638]">{title}</p>
            <p className="mt-1 text-[13px] font-bold text-[#657089]">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PopularSearches() {
  return (
    <div className="mx-auto mt-5 max-w-[1220px] rounded-[20px] border border-[#e1e6ee] bg-white p-4 shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-[16px] font-black text-[#071638]">Popular postcode searches</h2>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((item) => (
            <Link
              key={item.label}
              href={`/check-price?service=${item.service}&postcode=${encodeURIComponent(item.postcode)}`}
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
  const rawServiceSlug = params?.service ? slugify(params.service) : "cleaning";
  const config = getServiceConfig(rawServiceSlug);
  const postcode = formatPostcodeParam(params?.postcode);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] sm:bg-[#f4f8fb]">
      <Header />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-5 pt-5 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-black text-[#071638] transition hover:text-[#08783f] sm:gap-3 sm:text-[14px]">
          <span className="text-[#071638]">←</span>
          Back
        </Link>

        <div className="mt-4 grid gap-4 lg:mt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(370px,0.95fr)] lg:items-start">
          <LeftPanel config={config} postcode={postcode} />
          <DetailsForm config={config} postcode={postcode} />
        </div>

        <div className="hidden sm:block">
          <WhatHappensNext />
          <PopularSearches />
        </div>
      </section>

      <Footer />
    </main>
  );
}