import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveCheckPriceRequest } from "../actions";

type CheckPricePageProps = {
  searchParams?: Promise<{
    service?: string;
    postcode?: string;
  }>;
};

type PriceBand = {
  label: string;
  price: string;
  note: string;
  tone: "fair" | "normal" | "warning";
};

type ServiceConfig = {
  label: string;
  slug: string;
  icon: "van" | "plumbing" | "car" | "cleaning" | "flame" | "bolt" | "key" | "leaf" | "tool" | "shield";
  headline: string;
  fairPrice: string;
  totalEstimate?: string;
  sourceLine: string;
  warning: string;
  bands: PriceBand[];
  factors: string[];
  included: string[];
  common: string;
  jobOptions: { label: string; value: string }[];
  detailLabel: string;
  detailOptions: { label: string; value: string }[];
};

const urgencyOptions = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This week", value: "this-week" },
  { label: "Flexible", value: "flexible" },
];

const serviceAliases: Record<string, string> = {
  plumber: "plumbing",
  electrical: "electrician",
  electricians: "electrician",
  "painter-decorator": "painter-decorator",
  "painter-and-decorator": "painter-decorator",
};

function normalisePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

function formatPostcode(value: string) {
  const clean = normalisePostcode(value);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
}

function isValidUkPostcode(value: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(value.trim().toUpperCase());
}

function isSupportedSloughPostcode(value: string) {
  const clean = normalisePostcode(value);
  return /^SL[123][A-Z]?\d[A-Z]{2}$/.test(clean);
}

function slugify(value: string | undefined) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCanonicalServiceSlug(value: string | undefined) {
  const slug = slugify(value);
  return serviceAliases[slug] ?? slug;
}

const serviceConfigs: Record<string, ServiceConfig> = {
  "man-and-van": {
    label: "Man and Van",
    slug: "man-and-van",
    icon: "van",
    headline: "Man and Van in Slough",
    fairPrice: "£40 – £70/hr",
    totalEstimate: "Most small moves: £80 – £160 total",
    sourceLine: "Guide range based on mileage, load size, stairs, waiting time and typical Slough provider pricing.",
    warning: "Avoid hidden extras for stairs, waiting time, fuel or mileage.",
    bands: [
      { label: "Fair", price: "£40 – £70/hr", note: "Good local range", tone: "fair" },
      { label: "Higher but normal", price: "£70 – £100/hr", note: "Check distance, stairs or urgency", tone: "normal" },
      { label: "Check before paying", price: "£100+/hr", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Distance & mileage", "Stairs or no lift", "Loading time", "Parking & access", "Waiting time"],
    included: ["1 van + driver", "Loading & unloading", "Basic local mileage"],
    common: "Small flat moves, marketplace pickups, storage runs and Heathrow-area jobs.",
    jobOptions: [
      { label: "Small move", value: "small-move" },
      { label: "Collection / delivery", value: "collection-delivery" },
      { label: "Furniture transport", value: "furniture-transport" },
      { label: "Urgent van job", value: "urgent-van-job" },
    ],
    detailLabel: "Load size",
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
    icon: "van",
    headline: "Removal Prices in Slough",
    fairPrice: "£250 – £650",
    totalEstimate: "Small flat moves usually start around £250",
    sourceLine: "Guide range based on property size, distance, stairs, movers needed, parking and Slough removal pricing.",
    warning: "Avoid surprise extras for packing, dismantling, stairs, waiting time or parking.",
    bands: [
      { label: "Fair", price: "£250 – £650", note: "Typical small-to-medium move", tone: "fair" },
      { label: "Higher but normal", price: "£650 – £900", note: "Larger property or longer distance", tone: "normal" },
      { label: "Check before paying", price: "£900+", note: "Ask for full breakdown", tone: "warning" },
    ],
    factors: ["Property size", "Distance", "Stairs or lift", "Number of movers", "Packing help"],
    included: ["Vehicle", "Loading & unloading", "Basic local move"],
    common: "Flat moves, house moves, storage moves and Heathrow-area relocations.",
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
  plumbing: {
    label: "Plumbing",
    slug: "plumbing",
    icon: "plumbing",
    headline: "Plumbing Prices in Slough",
    fairPrice: "£45 – £85/hr",
    totalEstimate: "Common call-outs: £80 – £150 total before parts",
    sourceLine: "Guide range based on call-out fees, job type, urgency, parts and typical Slough plumber pricing.",
    warning: "Avoid unclear call-out fees, parts markups or emergency charges.",
    bands: [
      { label: "Fair", price: "£45 – £85/hr", note: "Normal local range", tone: "fair" },
      { label: "Higher but normal", price: "£85 – £120/hr", note: "Urgent or complex jobs", tone: "normal" },
      { label: "Check before paying", price: "£120+/hr", note: "Ask about call-out and parts", tone: "warning" },
    ],
    factors: ["Call-out fee", "Parts", "Urgency", "Access", "Job complexity"],
    included: ["Diagnosis", "Small labour time", "Basic advice"],
    common: "Leaks, blocked sinks, toilet issues, tap repairs and urgent plumbing call-outs.",
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
  "emergency-plumber": {
    label: "Emergency Plumber",
    slug: "emergency-plumber",
    icon: "plumbing",
    headline: "Emergency Plumber Prices in Slough",
    fairPrice: "£80 – £150 call-out",
    totalEstimate: "Final price can rise if parts or extra labour are needed",
    sourceLine: "Guide range based on emergency call-out fees, time of day, parts and Slough urgent plumber pricing.",
    warning: "Check if the quoted price includes call-out, first hour, VAT and parts.",
    bands: [
      { label: "Fair", price: "£80 – £150", note: "Normal emergency range", tone: "fair" },
      { label: "Higher but normal", price: "£150 – £220", note: "Evening/weekend or parts", tone: "normal" },
      { label: "Check before paying", price: "£220+", note: "Ask for breakdown first", tone: "warning" },
    ],
    factors: ["Time of day", "Parts", "Leak severity", "Access", "Parking"],
    included: ["Call-out", "Diagnosis", "Initial labour"],
    common: "Leaks, burst pipes, blocked toilets and urgent repair call-outs.",
    jobOptions: [
      { label: "Leak", value: "leak" },
      { label: "Burst pipe", value: "burst-pipe" },
      { label: "Blocked toilet", value: "blocked-toilet" },
      { label: "No hot water", value: "no-hot-water" },
    ],
    detailLabel: "Urgency",
    detailOptions: [
      { label: "Emergency now", value: "emergency-now" },
      { label: "Today", value: "today" },
      { label: "Tomorrow", value: "tomorrow" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  electrician: {
    label: "Electrician",
    slug: "electrician",
    icon: "bolt",
    headline: "Electrician Prices in Slough",
    fairPrice: "£60 – £90/hr",
    totalEstimate: "Common call-outs: £80 – £160 before parts",
    sourceLine: "Guide range based on call-out fees, fault type, urgency, parts and Slough electrician pricing.",
    warning: "Avoid unclear emergency charges, parts markups or vague minimum fees.",
    bands: [
      { label: "Fair", price: "£60 – £90/hr", note: "Normal local range", tone: "fair" },
      { label: "Higher but normal", price: "£90 – £130/hr", note: "Urgent or complex work", tone: "normal" },
      { label: "Check before paying", price: "£130+/hr", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Call-out fee", "Fault finding", "Parts", "Urgency", "Safety checks"],
    included: ["Diagnosis", "Basic labour", "Safety guidance"],
    common: "Sockets, lighting, tripping circuits, fuse board issues and small electrical repairs.",
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
  "boiler-repair": {
    label: "Boiler Repair",
    slug: "boiler-repair",
    icon: "flame",
    headline: "Boiler Repair Prices in Slough",
    fairPrice: "£60 – £110 call-out",
    totalEstimate: "Repairs often rise if parts are needed",
    sourceLine: "Guide range based on engineer call-out fees, issue type, urgency, parts and Slough heating pricing.",
    warning: "Ask if diagnosis, labour, VAT and parts are included before booking.",
    bands: [
      { label: "Fair", price: "£60 – £110", note: "Normal diagnosis/call-out", tone: "fair" },
      { label: "Higher but normal", price: "£110 – £180", note: "Urgent or part-related", tone: "normal" },
      { label: "Check before paying", price: "£180+", note: "Ask for part breakdown", tone: "warning" },
    ],
    factors: ["Boiler fault", "Parts", "Engineer call-out", "Urgency", "Access"],
    included: ["Diagnosis", "Initial labour", "Repair advice"],
    common: "No hot water, pressure issues, ignition faults and heating breakdowns.",
    jobOptions: [
      { label: "No hot water", value: "no-hot-water" },
      { label: "No heating", value: "no-heating" },
      { label: "Boiler fault", value: "boiler-fault" },
      { label: "Service / check", value: "service-check" },
    ],
    detailLabel: "Issue type",
    detailOptions: [
      { label: "Not working", value: "not-working" },
      { label: "Pressure issue", value: "pressure-issue" },
      { label: "Leaking", value: "leaking" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  locksmith: {
    label: "Locksmith",
    slug: "locksmith",
    icon: "key",
    headline: "Locksmith Prices in Slough",
    fairPrice: "£65 – £120",
    totalEstimate: "Emergency and lock parts can increase the total",
    sourceLine: "Guide range based on lock type, time, urgency, parts and Slough locksmith pricing.",
    warning: "Avoid vague lockout prices that exclude parts, VAT or emergency call-out fees.",
    bands: [
      { label: "Fair", price: "£65 – £120", note: "Normal local range", tone: "fair" },
      { label: "Higher but normal", price: "£120 – £180", note: "Emergency or lock parts", tone: "normal" },
      { label: "Check before paying", price: "£180+", note: "Ask for breakdown", tone: "warning" },
    ],
    factors: ["Lock type", "Emergency call-out", "Parts", "Time of day", "Door type"],
    included: ["Call-out", "Basic labour", "Lock advice"],
    common: "Lockouts, lock changes, broken keys and UPVC door lock issues.",
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
  cleaning: {
    label: "Cleaning",
    slug: "cleaning",
    icon: "cleaning",
    headline: "Cleaning Prices in Slough",
    fairPrice: "£15 – £25/hr",
    totalEstimate: "Most one-off cleans depend on hours and property size",
    sourceLine: "Guide range based on local hourly rates, job size, frequency and typical Slough cleaner pricing.",
    warning: "Check if supplies, oven, carpets, parking or deep-clean extras are included.",
    bands: [
      { label: "Fair", price: "£15 – £25/hr", note: "Normal local range", tone: "fair" },
      { label: "Higher but normal", price: "£25 – £35/hr", note: "Deep clean or short notice", tone: "normal" },
      { label: "Check before paying", price: "£35+/hr", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Property size", "Clean type", "Frequency", "Supplies", "Parking"],
    included: ["Basic cleaning", "Kitchen/bathroom areas", "General dusting"],
    common: "Regular cleans, one-off cleans, move-out cleans and small flat cleaning.",
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
    icon: "cleaning",
    headline: "End of Tenancy Cleaning Prices in Slough",
    fairPrice: "£120 – £260",
    totalEstimate: "Larger homes or heavy cleans can cost more",
    sourceLine: "Guide range based on property size, condition, appliances, parking and Slough move-out cleaner pricing.",
    warning: "Check if oven, carpets, windows, appliances and parking are included.",
    bands: [
      { label: "Fair", price: "£120 – £260", note: "Studio to 2-bed range", tone: "fair" },
      { label: "Higher but normal", price: "£260 – £400", note: "Larger or heavy clean", tone: "normal" },
      { label: "Check before paying", price: "£400+", note: "Ask for full extras list", tone: "warning" },
    ],
    factors: ["Bedrooms", "Condition", "Appliances", "Carpets", "Parking"],
    included: ["Move-out clean", "Kitchen/bathroom clean", "General rooms"],
    common: "Rental move-outs, deposit cleans, studio flats and family homes.",
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
  "deep-cleaning": {
    label: "Deep Cleaning",
    slug: "deep-cleaning",
    icon: "cleaning",
    headline: "Deep Cleaning Prices in Slough",
    fairPrice: "£90 – £180",
    totalEstimate: "Bigger homes or heavy condition can cost more",
    sourceLine: "Guide range based on property size, condition, hours needed and typical Slough cleaner pricing.",
    warning: "Ask if appliances, inside cupboards, carpets and supplies are included.",
    bands: [
      { label: "Fair", price: "£90 – £180", note: "Common small-property range", tone: "fair" },
      { label: "Higher but normal", price: "£180 – £300", note: "Larger or heavier clean", tone: "normal" },
      { label: "Check before paying", price: "£300+", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Property size", "Condition", "Hours", "Appliances", "Supplies"],
    included: ["Deep clean labour", "Kitchen/bathrooms", "General rooms"],
    common: "One-off deep cleans, post-renovation cleans and pre-guest cleaning.",
    jobOptions: [
      { label: "Home deep clean", value: "home-deep-clean" },
      { label: "Kitchen deep clean", value: "kitchen-deep-clean" },
      { label: "Post-builder clean", value: "post-builder-clean" },
    ],
    detailLabel: "Property size",
    detailOptions: [
      { label: "Studio", value: "studio" },
      { label: "1 bedroom", value: "1-bedroom" },
      { label: "2 bedrooms", value: "2-bedrooms" },
      { label: "3+ bedrooms", value: "3-plus-bedrooms" },
    ],
  },
  "carpet-cleaning": {
    label: "Carpet Cleaning",
    slug: "carpet-cleaning",
    icon: "cleaning",
    headline: "Carpet Cleaning Prices in Slough",
    fairPrice: "£45 – £120",
    totalEstimate: "Whole-flat carpet cleaning usually costs more",
    sourceLine: "Guide range based on room count, stains, access and typical Slough carpet cleaner pricing.",
    warning: "Check if stains, stairs, parking or minimum call-out are included.",
    bands: [
      { label: "Fair", price: "£45 – £120", note: "Common room-based range", tone: "fair" },
      { label: "Higher but normal", price: "£120 – £200", note: "Multiple rooms or stains", tone: "normal" },
      { label: "Check before paying", price: "£200+", note: "Ask for breakdown", tone: "warning" },
    ],
    factors: ["Number of rooms", "Stains", "Stairs", "Parking", "Minimum fee"],
    included: ["Machine clean", "Basic stain treatment", "Room carpet clean"],
    common: "Single-room carpet cleans, end-of-tenancy carpets and rugs.",
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
    icon: "cleaning",
    headline: "Oven Cleaning Prices in Slough",
    fairPrice: "£50 – £90",
    totalEstimate: "Oven + hob or extractor usually costs more",
    sourceLine: "Guide range based on oven type, condition, add-ons and Slough oven cleaner pricing.",
    warning: "Check if hob, extractor, trays and heavy grease are included.",
    bands: [
      { label: "Fair", price: "£50 – £90", note: "Single/double oven range", tone: "fair" },
      { label: "Higher but normal", price: "£90 – £140", note: "Add-ons or heavy grease", tone: "normal" },
      { label: "Check before paying", price: "£140+", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Oven type", "Condition", "Hob/extractor", "Trays", "Parking"],
    included: ["Oven clean", "Basic racks/trays", "Degreasing"],
    common: "Single ovens, double ovens, oven + hob and move-out oven cleans.",
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
  gardener: {
    label: "Gardener",
    slug: "gardener",
    icon: "leaf",
    headline: "Gardener Prices in Slough",
    fairPrice: "£25 – £45/hr",
    totalEstimate: "Clearance jobs usually cost more than maintenance",
    sourceLine: "Guide range based on garden size, waste, tools, time needed and Slough gardener pricing.",
    warning: "Ask if waste removal, tools, hedge work and minimum hours are included.",
    bands: [
      { label: "Fair", price: "£25 – £45/hr", note: "Normal maintenance range", tone: "fair" },
      { label: "Higher but normal", price: "£45 – £70/hr", note: "Clearance or specialist work", tone: "normal" },
      { label: "Check before paying", price: "£70+/hr", note: "Ask what is included", tone: "warning" },
    ],
    factors: ["Garden size", "Waste removal", "Hedges", "Tools", "Access"],
    included: ["Basic gardening", "Labour", "Light maintenance"],
    common: "Lawn mowing, hedge trimming, garden tidy-ups and clearance jobs.",
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
  handyman: {
    label: "Handyman",
    slug: "handyman",
    icon: "tool",
    headline: "Handyman Prices in Slough",
    fairPrice: "£45 – £80/hr",
    totalEstimate: "Half-day jobs often start around £150",
    sourceLine: "Guide range based on job size, tools, travel, materials and Slough handyman pricing.",
    warning: "Check if materials, parking, minimum hours and disposal are included.",
    bands: [
      { label: "Fair", price: "£45 – £80/hr", note: "Normal local range", tone: "fair" },
      { label: "Higher but normal", price: "£80 – £120/hr", note: "Specialist or urgent work", tone: "normal" },
      { label: "Check before paying", price: "£120+/hr", note: "Ask for breakdown", tone: "warning" },
    ],
    factors: ["Job complexity", "Materials", "Minimum hours", "Tools", "Parking"],
    included: ["Labour", "Basic tools", "Small fixes"],
    common: "Flat-pack assembly, mounting, small repairs and odd jobs.",
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
  "painter-decorator": {
    label: "Painter & Decorator",
    slug: "painter-decorator",
    icon: "tool",
    headline: "Painter & Decorator Prices in Slough",
    fairPrice: "£120 – £220/day",
    totalEstimate: "Room pricing depends on prep and finish",
    sourceLine: "Guide range based on day rates, room size, prep, materials and Slough decorator pricing.",
    warning: "Ask if paint, prep, filling, sanding and materials are included.",
    bands: [
      { label: "Fair", price: "£120 – £220/day", note: "Normal local day rate", tone: "fair" },
      { label: "Higher but normal", price: "£220 – £300/day", note: "Experienced or detailed work", tone: "normal" },
      { label: "Check before paying", price: "£300+/day", note: "Ask for full scope", tone: "warning" },
    ],
    factors: ["Room size", "Prep work", "Materials", "Finish", "Access"],
    included: ["Labour", "Basic prep", "Painting/decorating"],
    common: "Room painting, touch-ups, full-flat decorating and rental refreshes.",
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
  "pest-control": {
    label: "Pest Control",
    slug: "pest-control",
    icon: "shield",
    headline: "Pest Control Prices in Slough",
    fairPrice: "£80 – £160",
    totalEstimate: "Follow-up visits can increase the total",
    sourceLine: "Guide range based on pest type, property size, treatment visits and Slough pest control pricing.",
    warning: "Ask if inspection, treatment, follow-up and proofing are included.",
    bands: [
      { label: "Fair", price: "£80 – £160", note: "Common treatment range", tone: "fair" },
      { label: "Higher but normal", price: "£160 – £250", note: "Follow-ups or complex issue", tone: "normal" },
      { label: "Check before paying", price: "£250+", note: "Ask for treatment plan", tone: "warning" },
    ],
    factors: ["Pest type", "Property size", "Visits", "Proofing", "Urgency"],
    included: ["Inspection", "Initial treatment", "Advice"],
    common: "Mice, rats, wasps, bed bugs and small business pest issues.",
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
  "waste-removal": {
    label: "Waste Removal",
    slug: "waste-removal",
    icon: "van",
    headline: "Waste Removal Prices in Slough",
    fairPrice: "£60 – £180",
    totalEstimate: "Load size and disposal fees change the final price",
    sourceLine: "Guide range based on load size, waste type, labour, disposal fees and Slough waste removal pricing.",
    warning: "Ask if labour, loading, disposal fees and VAT are included.",
    bands: [
      { label: "Fair", price: "£60 – £180", note: "Small/medium load range", tone: "fair" },
      { label: "Higher but normal", price: "£180 – £300", note: "Large or heavy load", tone: "normal" },
      { label: "Check before paying", price: "£300+", note: "Ask for disposal breakdown", tone: "warning" },
    ],
    factors: ["Load size", "Waste type", "Weight", "Labour", "Disposal fees"],
    included: ["Loading", "Transport", "Basic disposal"],
    common: "Furniture disposal, rubbish clearance, garden waste and small house clearances.",
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
    icon: "tool",
    headline: "Appliance Repair Prices in Slough",
    fairPrice: "£55 – £120",
    totalEstimate: "Parts can increase the final price",
    sourceLine: "Guide range based on appliance type, diagnosis, parts, urgency and Slough repair pricing.",
    warning: "Ask if diagnosis, call-out, labour and parts are included.",
    bands: [
      { label: "Fair", price: "£55 – £120", note: "Normal diagnosis/repair range", tone: "fair" },
      { label: "Higher but normal", price: "£120 – £200", note: "Parts or same-day repair", tone: "normal" },
      { label: "Check before paying", price: "£200+", note: "Ask about parts first", tone: "warning" },
    ],
    factors: ["Appliance type", "Parts", "Call-out", "Fault type", "Urgency"],
    included: ["Diagnosis", "Basic labour", "Repair advice"],
    common: "Washing machines, dishwashers, fridges and common kitchen appliance faults.",
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
  "roof-repair": {
    label: "Roof Repair",
    slug: "roof-repair",
    icon: "tool",
    headline: "Roof Repair Prices in Slough",
    fairPrice: "£120 – £350",
    totalEstimate: "Large repairs and materials can cost more",
    sourceLine: "Guide range based on roof access, repair type, materials, urgency and Slough roofer pricing.",
    warning: "Ask if inspection, labour, materials, scaffolding and VAT are included.",
    bands: [
      { label: "Fair", price: "£120 – £350", note: "Small repair range", tone: "fair" },
      { label: "Higher but normal", price: "£350 – £750", note: "Larger repair/materials", tone: "normal" },
      { label: "Check before paying", price: "£750+", note: "Ask for written breakdown", tone: "warning" },
    ],
    factors: ["Access", "Materials", "Repair size", "Scaffolding", "Urgency"],
    included: ["Inspection", "Small repair labour", "Advice"],
    common: "Leaks, slipped tiles, gutter issues and small roof repairs.",
    jobOptions: [
      { label: "Roof leak", value: "roof-leak" },
      { label: "Tile repair", value: "tile-repair" },
      { label: "Gutter issue", value: "gutter-issue" },
      { label: "Not sure", value: "not-sure" },
    ],
    detailLabel: "Repair size",
    detailOptions: [
      { label: "Small repair", value: "small-repair" },
      { label: "Leak investigation", value: "leak-investigation" },
      { label: "Larger repair", value: "larger-repair" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
  "mot-car-repairs": {
    label: "MOT & Car Repairs",
    slug: "mot-car-repairs",
    icon: "car",
    headline: "MOT & Car Repair Prices in Slough",
    fairPrice: "£38 – £65 MOT",
    totalEstimate: "Repair costs depend on parts and labour",
    sourceLine: "Guide range based on MOT pricing, labour rates, parts and local Slough garage pricing.",
    warning: "Ask if diagnostic fees, parts, labour and VAT are included before agreeing to repairs.",
    bands: [
      { label: "Fair", price: "£38 – £65", note: "Typical MOT range", tone: "fair" },
      { label: "Higher but normal", price: "£65 – £150", note: "Diagnostics or small repair", tone: "normal" },
      { label: "Check before paying", price: "£150+", note: "Ask for repair breakdown", tone: "warning" },
    ],
    factors: ["MOT vs repair", "Parts", "Labour", "Diagnostics", "Vehicle type"],
    included: ["MOT test", "Basic inspection", "Repair quote if needed"],
    common: "MOTs, diagnostics, brake checks, tyre issues and small repairs.",
    jobOptions: [
      { label: "MOT", value: "mot" },
      { label: "Diagnostics", value: "diagnostics" },
      { label: "Car repair", value: "car-repair" },
      { label: "Brake / tyre issue", value: "brake-tyre" },
    ],
    detailLabel: "Vehicle type",
    detailOptions: [
      { label: "Small car", value: "small-car" },
      { label: "Medium car", value: "medium-car" },
      { label: "Van", value: "van" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
};

function getServiceConfig(serviceSlug: string): ServiceConfig | null {
  return serviceConfigs[serviceSlug] ?? null;
}

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Quickola homepage">
      <img src="/quickola/logo-mark.png" alt="Quickola" className="h-9 w-9 shrink-0 rounded-full object-contain sm:h-10 sm:w-10" />
      <span className="text-[24px] font-extrabold leading-none tracking-[-0.035em] text-[#071638] sm:text-[30px]">Quickola</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[62px] w-full max-w-[1220px] items-center justify-between px-4 sm:min-h-[74px] sm:px-6 lg:px-8">
        <Logo />
        <Link href="/" className="inline-flex h-9 shrink-0 items-center justify-center rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-extrabold text-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 hover:border-[#b7c2d2] sm:h-10 sm:px-4 sm:text-[14px]">
          New search
        </Link>
      </div>
    </header>
  );
}

function Icon({ type, className = "h-5 w-5" }: { type: ServiceConfig["icon"] | "pin" | "clock" | "mail" | "phone" | "briefcase" | "calendar" | "tag"; className?: string }) {
  const base = `${className} fill-none stroke-current stroke-[2]`;

  if (type === "van") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v9H3z" /><path d="M14 10h3.5l2.5 3v3h-6" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>;
  if (type === "plumbing") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h9a4 4 0 0 0 4-4V6" /><path d="M17 6h3" /><path d="M7 10v8" /><path d="M4 18h6" /></svg>;
  if (type === "car") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 7 7h10l2 5" /><path d="M5 12h14v5H5z" /><circle cx="8" cy="17" r="1.6" /><circle cx="16" cy="17" r="1.6" /></svg>;
  if (type === "cleaning") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="m14 4 6 6" /><path d="M4 20h8" /><path d="m12 6-7 7 6 6 7-7" /><path d="M7 16l-3 4" /></svg>;
  if (type === "flame") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4 0 7-2.8 7-6.8 0-3.2-2-5.5-4.2-7.6-.8 2.3-2.2 3.5-3.8 4.4.4-3.3-.8-6.2-3.1-8C7.4 7.8 5 10 5 15.2 5 19.2 8 22 12 22Z" /></svg>;
  if (type === "bolt") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" /></svg>;
  if (type === "key") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="3.2" /><path d="m10.3 12.7 8-8" /><path d="m15.5 7.5 2 2" /><path d="m17.5 5.5 1.5 1.5" /></svg>;
  if (type === "leaf") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M20 4c-7.5 0-13 4.8-13 11a5 5 0 0 0 5 5c6.2 0 8-8.2 8-16Z" /><path d="M4 20c3.5-5.5 8-8.5 14-10" /></svg>;
  if (type === "tool") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4.5a4.5 4.5 0 0 0 5 5L10 19a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2l9.5-9.5Z" /><path d="m13 7 4 4" /></svg>;
  if (type === "shield") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 19 6v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z" /><path d="m9 12 2 2 4-5" /></svg>;
  if (type === "pin") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>;
  if (type === "clock") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
  if (type === "mail") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="2" /><path d="m5 8 7 5 7-5" /></svg>;
  if (type === "phone") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" /></svg>;
  if (type === "briefcase") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" /><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M4 12h16" /></svg>;
  if (type === "calendar") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v3M17 3v3M4.5 9h15" /><rect x="4.5" y="5.5" width="15" height="15" rx="2.2" /></svg>;
  if (type === "tag") return <svg viewBox="0 0 24 24" className={base} strokeLinecap="round" strokeLinejoin="round"><path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3L20 10.7a2 2 0 0 1 0 2.8Z" /><circle cx="8.5" cy="8.5" r="1.2" /></svg>;

  return null;
}

function BandCard({ band }: { band: PriceBand }) {
  const styles = {
    fair: "border-[#cfeedd] bg-[#f1fbf5] text-[#08783f]",
    normal: "border-[#ffe0b8] bg-[#fff8ee] text-[#ea6a00]",
    warning: "border-[#ffd3d8] bg-[#fff4f5] text-[#e11925]",
  }[band.tone];

  return (
    <div className={`rounded-[17px] border p-4 text-center ${styles}`}>
      <p className="text-[13px] font-black">{band.label}</p>
      <p className="mt-2 text-[24px] font-black tracking-[-0.05em] text-[#071638] sm:text-[28px]">{band.price}</p>
      <div className={`mx-auto mt-3 h-1.5 w-20 rounded-full ${band.tone === "fair" ? "bg-[#13a85a]" : band.tone === "normal" ? "bg-[#ff8a00]" : "bg-[#e11925]"}`} />
      <p className="mt-3 text-[12px] font-bold leading-[1.3] text-[#273651]">{band.note}</p>
    </div>
  );
}

function SelectField({ label, name, options, icon }: { label: string; name: string; options: { label: string; value: string }[]; icon: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-black text-[#071638]">{label}</span>
      <div className="relative flex h-[50px] items-center gap-3 rounded-[14px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#075cff] focus-within:ring-4 focus-within:ring-[#075cff]/10">
        <span className="shrink-0 text-[#075cff]">{icon}</span>
        <select name={name} defaultValue={options[0]?.value} className="min-w-0 flex-1 appearance-none bg-transparent text-[14px] font-black text-[#071638] outline-none">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span className="pointer-events-none text-[18px] font-black text-[#071638]">⌄</span>
      </div>
    </label>
  );
}

function TextInput({ label, name, placeholder, icon, type = "text", required, pattern, inputMode, title, minLength, maxLength }: { label: string; name: string; placeholder: string; icon: ReactNode; type?: string; required?: boolean; pattern?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; title?: string; minLength?: number; maxLength?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-black text-[#071638]">{label}</span>
      <div className="flex h-[50px] items-center gap-3 rounded-[14px] border border-[#dfe5ee] bg-white px-4 transition focus-within:border-[#075cff] focus-within:ring-4 focus-within:ring-[#075cff]/10">
        <span className="shrink-0 text-[#075cff]">{icon}</span>
        <input name={name} type={type} placeholder={placeholder} required={required} pattern={pattern} inputMode={inputMode} title={title} minLength={minLength} maxLength={maxLength} className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#071638] outline-none placeholder:text-[#8b94a7]" />
      </div>
    </label>
  );
}

function ResultPanel({ config, postcode }: { config: ServiceConfig; postcode: string }) {
  return (
    <section className="rounded-[24px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_40px_rgba(7,22,56,0.055)] sm:rounded-[26px] sm:p-6 lg:p-7">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8f1] px-3 py-1.5 text-[11px] font-black text-[#08783f]">
          <Icon type="pin" className="h-3.5 w-3.5" />
          {config.label} · {postcode}
        </div>

        <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5 sm:flex-row sm:items-start sm:gap-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-[#eff5ff] text-[#075cff] sm:h-16 sm:w-16 sm:rounded-[22px]">
            <Icon type={config.icon} className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>

          <div>
            <h1 className="text-[30px] font-black leading-[1.02] tracking-[-0.055em] text-[#071638] sm:text-[46px]">
              {config.headline}
            </h1>

            <div className="mx-auto mt-4 max-w-[330px] rounded-[22px] border border-[#dbe8ff] bg-[#f7fbff] px-4 py-4 text-center sm:mx-0 sm:max-w-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-left">
              <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#075cff] sm:text-[18px] sm:normal-case sm:tracking-normal">
                Fair Slough price
              </p>

              <p className="mt-1 text-[44px] font-black leading-none tracking-[-0.075em] text-[#075cff] sm:text-[48px]">
                {config.fairPrice}
              </p>

              {config.totalEstimate ? (
                <p className="mt-3 text-[13px] font-black leading-[1.35] text-[#071638] sm:text-[14px]">
                  {config.totalEstimate}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-[700px] text-[13px] font-semibold leading-[1.55] text-[#273651] sm:mx-0 sm:text-[16px]">
          {config.sourceLine} Final price depends on your exact job details.
        </p>
      </div>

      <div className="mt-4 rounded-[18px] border border-[#ffe0b8] bg-[#fff9ef] p-4 sm:mt-5">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#f36b00] ring-1 ring-[#ffd8a8]">
            !
          </span>
          <p className="text-[13px] font-black leading-[1.45] text-[#071638] sm:text-[14px]">
            {config.warning}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="#match-form"
          className="flex h-[56px] w-full items-center justify-center rounded-[16px] bg-[#075cff] px-5 text-[15px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.22)] transition hover:-translate-y-0.5"
        >
          Get fair local options →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3">
        {config.bands.map((band) => (
          <BandCard key={band.label} band={band} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
        <div className="rounded-[18px] border border-[#e1e6ee] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#071638]">
            What changes the price?
          </h2>

          <div className="mt-3 space-y-2">
            {config.factors.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-[13px] font-bold text-[#273651]"
              >
                <span className="text-[#075cff]">＋</span> {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e1e6ee] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#071638]">
            Usually included in fair prices
          </h2>

          <div className="mt-3 space-y-2">
            {config.included.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-[13px] font-bold text-[#273651]"
              >
                <span className="text-[#08783f]">✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-[#dcebe1] bg-[#f1fbf5] p-4 sm:mt-5">
        <div className="flex gap-3">
          <Icon type="pin" className="mt-0.5 h-5 w-5 shrink-0 text-[#08783f]" />
          <p className="text-[13px] font-bold leading-[1.45] text-[#071638] sm:text-[14px]">
            <span className="font-black">Common in Slough:</span> {config.common}
          </p>
        </div>
      </div>
    </section>
  );
}


function DetailsForm({ config, postcode }: { config: ServiceConfig; postcode: string }) {
  return (
    <aside
      id="match-form"
      className="scroll-mt-[90px] rounded-[24px] border border-[#dfe6ef] bg-white p-4 shadow-[0_16px_50px_rgba(7,22,56,0.06)] sm:p-5 lg:sticky lg:top-[84px]"
    >
      <div className="rounded-[20px] bg-[linear-gradient(180deg,#075cff_0%,#0447ca_100%)] p-4 text-white shadow-[0_14px_30px_rgba(0,92,255,0.18)]">
        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/75">
          Next step
        </p>

        <h2 className="mt-1 text-[25px] font-black leading-[1.02] tracking-[-0.05em]">
          Want fair local options?
        </h2>

        <p className="mt-2 text-[13px] font-bold leading-[1.45] text-white/88">
          Send your job details and we’ll help you compare the fair Slough range.
          No booking is made.
        </p>
      </div>

      <form action={saveCheckPriceRequest} className="mt-4 space-y-3">
        <input type="hidden" name="service" value={config.slug} />
        <input type="hidden" name="postcode" value={postcode} />
        <input type="hidden" name="source" value="check-price-match" />

        <div className="rounded-[16px] border border-[#dcebe1] bg-[#f7fcf8] px-4 py-3">
          <p className="text-[13px] font-black leading-[1.35] text-[#071638]">
            Your fair price range is ready for {postcode}.
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-[1.45] text-[#44506a]">
            Only continue if you want help finding suitable local options.
          </p>
        </div>

        <SelectField
          label="What job do you need?"
          name="job_type"
          options={config.jobOptions}
          icon={<Icon type="briefcase" />}
        />

        <SelectField
          label={config.detailLabel}
          name="job_detail"
          options={config.detailOptions}
          icon={<Icon type="tag" />}
        />

        <SelectField
          label="When do you need it?"
          name="time_needed"
          options={urgencyOptions}
          icon={<Icon type="calendar" />}
        />

        <TextInput
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          icon={<Icon type="mail" />}
          required
        />

        <TextInput
          label="WhatsApp optional"
          name="phone"
          type="tel"
          placeholder="07xxx xxxxxx"
          icon={<Icon type="phone" />}
          pattern="07[0-9]{9}"
          inputMode="numeric"
          title="Enter an 11-digit UK mobile number starting with 07."
          minLength={11}
          maxLength={11}
        />

        <button
          type="submit"
          className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[15px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-5 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)] transition hover:-translate-y-0.5"
        >
          Send me fair options →
        </button>

        <p className="text-center text-[12px] font-semibold text-[#657089]">
          Free · No spam calls · No payment today · No paid ranking
        </p>
      </form>
    </aside>
  );
}
function MobileStickyCta({ config, postcode }: { config: ServiceConfig; postcode: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe6ef] bg-white/96 px-4 py-3 shadow-[0_-12px_34px_rgba(7,22,56,0.12)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-[520px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">
            {config.label} · {postcode}
          </p>

          <p className="truncate text-[16px] font-black tracking-[-0.04em] text-[#071638]">
            Fair price: {config.fairPrice}
          </p>
        </div>

        <Link
          href="#match-form"
          className="flex h-12 shrink-0 items-center justify-center rounded-[14px] bg-[#075cff] px-4 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(0,92,255,0.22)]"
        >
          Get options
        </Link>
      </div>
    </div>
  );
}

export default async function CheckPricePage({ searchParams }: CheckPricePageProps) {
  const params = await searchParams;
  const serviceSlug = getCanonicalServiceSlug(params?.service);
  const config = getServiceConfig(serviceSlug);
  const postcode = formatPostcode(params?.postcode || "");

  if (!config || !postcode || !isValidUkPostcode(postcode) || !isSupportedSloughPostcode(postcode)) {
    redirect("/");
  }

  return (
<main className="min-h-screen overflow-x-hidden bg-[#f4f8fb] pb-24 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif] lg:pb-0">      <Header />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-black text-[#071638] transition hover:text-[#08783f]">
          ← Back
        </Link>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(370px,0.72fr)] lg:items-start">
          <div className="space-y-4">
            <ResultPanel config={config} postcode={postcode} />
          </div>
          <DetailsForm config={config} postcode={postcode} />
        </div>
      </section>
            <MobileStickyCta config={config} postcode={postcode} />
    </main>
  );
}