

type ServiceKey = string;

export type PriceConfig = {
  label: string;
  from: string;
  suffix?: string;
  note: string;
};

type PriceSearchParams = Record<string, string | string[] | undefined>;

type NumericRange = {
  min: number;
  max: number;
  suffix?: string;
  note: string;
};

const money = (min: number, max: number) => `£${min} – £${max}`;

const getOne = (params: PriceSearchParams, key: string) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
};

export const normalisePriceServiceSlug = (value: string | undefined): ServiceKey => {
  const slug = (value || "man-and-van")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const aliases: Record<string, ServiceKey> = {
    moving: "man-and-van",
    "man-with-van": "man-and-van",
    "van-man": "man-and-van",
    cleaner: "cleaner",
    clean: "cleaner",
    cleaning: "cleaner",
    plumbing: "plumber",
    electrical: "electrician",
    painting: "painter-decorator",
    painter: "painter-decorator",
    decorating: "painter-decorator",
  };

  return aliases[slug] ?? (slug as ServiceKey);
};

const bedroomCleaningRanges: Record<string, Record<string, NumericRange>> = {
  "regular-clean": {
    studio: { min: 35, max: 50, note: "Final price depends on cleaning hours, condition and extras." },
    "1-bed": { min: 45, max: 65, note: "Final price depends on cleaning hours, condition and extras." },
    "2-bed": { min: 55, max: 85, note: "Final price depends on cleaning hours, condition and extras." },
    "3-bed": { min: 70, max: 110, note: "Final price depends on cleaning hours, condition and extras." },
    "4-bed-plus": { min: 90, max: 140, note: "Final price depends on cleaning hours, condition and extras." },
  },
  "deep-clean": {
    studio: { min: 80, max: 120, note: "Final price depends on property condition, bathrooms and extras." },
    "1-bed": { min: 100, max: 150, note: "Final price depends on property condition, bathrooms and extras." },
    "2-bed": { min: 130, max: 200, note: "Final price depends on property condition, bathrooms and extras." },
    "3-bed": { min: 170, max: 280, note: "Final price depends on property condition, bathrooms and extras." },
    "4-bed-plus": { min: 230, max: 380, note: "Final price depends on property condition, bathrooms and extras." },
  },
  "end-of-tenancy": {
    studio: { min: 110, max: 170, note: "Final price depends on property condition, bathrooms, oven, carpet and windows." },
    "1-bed": { min: 140, max: 220, note: "Final price depends on property condition, bathrooms, oven, carpet and windows." },
    "2-bed": { min: 180, max: 300, note: "Final price depends on property condition, bathrooms, oven, carpet and windows." },
    "3-bed": { min: 240, max: 420, note: "Final price depends on property condition, bathrooms, oven, carpet and windows." },
    "4-bed-plus": { min: 320, max: 560, note: "Final price depends on property condition, bathrooms, oven, carpet and windows." },
  },
};

const carpetCleaningRanges: Record<string, NumericRange> = {
  "1-room": { min: 40, max: 65, note: "Final price depends on room size, stains, access and whether stairs are included." },
  "2-rooms": { min: 60, max: 95, note: "Final price depends on room size, stains, access and whether stairs are included." },
  "3-rooms": { min: 80, max: 130, note: "Final price depends on room size, stains, access and whether stairs are included." },
  "4-plus-rooms": { min: 110, max: 180, note: "Final price depends on room size, stains, access and whether stairs are included." },
  "stairs-too": { min: 90, max: 150, note: "Final price depends on room size, stains, access and stair layout." },
};

const ovenCleaningRanges: Record<string, NumericRange> = {
  "single-oven": { min: 50, max: 70, note: "Final price depends on oven condition and whether racks, hob or extractor are included." },
  "double-oven": { min: 65, max: 95, note: "Final price depends on oven condition and whether racks, hob or extractor are included." },
  "range-cooker": { min: 90, max: 140, note: "Final price depends on cooker size, condition and extras." },
  "hob-extractor": { min: 45, max: 80, note: "Final price depends on condition and whether it is booked with an oven clean." },
};

const windowCleaningRanges: Record<string, NumericRange> = {
  flat: { min: 20, max: 35, note: "Final price depends on window count, access and inside/outside cleaning." },
  "2-3-bed-house": { min: 30, max: 55, note: "Final price depends on window count, access and inside/outside cleaning." },
  "4-plus-bed-house": { min: 45, max: 85, note: "Final price depends on window count, access and inside/outside cleaning." },
  "shop-office": { min: 35, max: 120, note: "Final price depends on frontage, access, frequency and inside/outside cleaning." },
};

const basePriceConfigs: Record<string, PriceConfig> = {
  "man-and-van": {
    label: "Man & Van",
    from: "£70 – £110",
    note: "Final price depends on distance, access, loading time and helpers.",
  },
  removals: {
    label: "Removals",
    from: "£220 – £650",
    note: "Final price depends on property size, distance, access, packing and number of movers.",
  },
  cleaner: {
    label: "Cleaner",
    from: "£45 – £65",
    note: "Final price depends on property size, clean type, condition and extras.",
  },
  "end-of-tenancy-cleaning": {
    label: "End of Tenancy Cleaning",
    from: "£140 – £300",
    note: "Final price depends on bedrooms, bathrooms, oven, carpet, windows and property condition.",
  },
  "carpet-cleaning": {
    label: "Carpet Cleaning",
    from: "£40 – £95",
    note: "Final price depends on number of rooms, stains, stairs and access.",
  },
  "oven-cleaning": {
    label: "Oven Cleaning",
    from: "£50 – £95",
    note: "Final price depends on oven type, condition, hob, racks and extractor.",
  },
  plumber: {
    label: "Plumber",
    from: "£80 – £160",
    note: "Final price depends on issue type, urgency, access, parts and repair details.",
  },
  "emergency-plumber": {
    label: "Emergency Plumber",
    from: "£120 – £240",
    note: "Final price depends on urgency, issue type, callout time, access and parts.",
  },
  "boiler-repair": {
    label: "Boiler Repair",
    from: "£90 – £220",
    note: "Final price depends on fault, parts, urgency and whether diagnostics are needed.",
  },
  electrician: {
    label: "Electrician",
    from: "£80 – £150",
    note: "Final price depends on issue type, property size, access, parts and urgency.",
  },
  locksmith: {
    label: "Locksmith",
    from: "£85 – £180",
    note: "Final price depends on lock type, urgency, time of day and replacement parts.",
  },
  handyman: {
    label: "Handyman",
    from: "£45 – £95",
    note: "Final price depends on job count, tools, wall type, access and time needed.",
  },
  "painter-decorator": {
    label: "Painter",
    from: "£180 – £350",
    note: "Final price depends on room count, prep work, surface condition and materials.",
  },
  gardener: {
    label: "Gardener",
    from: "£50 – £120",
    note: "Final price depends on garden size, condition, waste removal and job type.",
  },
  "waste-removal": {
    label: "Waste Removal",
    from: "£80 – £250",
    note: "Final price depends on load size, waste type, access, weight and disposal fees.",
  },
  "mobile-tyres": {
    label: "Mobile Tyres",
    from: "£65 – £180",
    note: "Final price depends on tyre size, tyre brand, location and urgency.",
  },
  "car-recovery": {
    label: "Car Recovery",
    from: "£80 – £220",
    note: "Final price depends on vehicle location, distance, recovery type and urgency.",
  },
  "mobile-mechanic": {
    label: "Mobile Mechanic",
    from: "£70 – £180",
    note: "Final price depends on diagnostics, parts, vehicle type and job complexity.",
  },
  "mobile-valeting": {
    label: "Mobile Valeting",
    from: "£45 – £140",
    note: "Final price depends on vehicle size, valet type, condition and extras.",
  },
  "airport-transfer": {
    label: "Airport Transfer",
    from: "£35 – £95",
    note: "Final price depends on airport, passenger count, pickup time and luggage.",
  },
  "same-day-courier": {
    label: "Same-day Courier",
    from: "£25 – £120",
    note: "Final price depends on parcel size, distance, urgency and waiting time.",
  },
  "appliance-repair": {
    label: "Appliance Repair",
    from: "£70 – £180",
    note: "Final price depends on appliance type, fault, parts and diagnostics.",
  },
  "pest-control": {
    label: "Pest Control",
    from: "£80 – £220",
    note: "Final price depends on pest type, treatment needed, property size and visits.",
  },
  "roofing-guttering": {
    label: "Roofing / Guttering",
    from: "£70 – £300",
    note: "Final price depends on access, height, damage, materials and job size.",
  },
  "window-cleaning": {
    label: "Window Cleaning",
    from: "£20 – £85",
    note: "Final price depends on property size, window count, access and inside/outside cleaning.",
  },
  "cctv-security": {
    label: "CCTV / Security",
    from: "£120 – £450",
    note: "Final price depends on number of cameras, wiring, property type and equipment.",
  },
  "blinds-curtains": {
    label: "Blinds / Curtains",
    from: "£45 – £180",
    note: "Final price depends on number of windows, fitting type, wall type and materials.",
  },
  "flooring-carpet-fitting": {
    label: "Flooring / Carpet Fitting",
    from: "£120 – £600",
    note: "Final price depends on room count, flooring type, prep work and materials.",
  },
  "bathroom-repairs": {
    label: "Bathroom Repairs",
    from: "£80 – £350",
    note: "Final price depends on issue type, access, parts, tiling and labour time.",
  },
  "kitchen-repairs": {
    label: "Kitchen Repairs",
    from: "£80 – £350",
    note: "Final price depends on repair type, access, parts and labour time.",
  },
  "furniture-assembly": {
    label: "Furniture Assembly",
    from: "£40 – £140",
    note: "Final price depends on item type, item count, complexity and time needed.",
  },
  "house-clearance": {
    label: "House Clearance",
    from: "£120 – £650",
    note: "Final price depends on rooms, waste type, access, labour and disposal fees.",
  },
  "storage-units": {
    label: "Storage Units",
    from: "£25 – £180",
    note: "Guide depends on storage size, location, access and rental length.",
  },
};

const rangeToConfig = (label: string, range: NumericRange): PriceConfig => ({
  label,
  from: money(range.min, range.max),
  suffix: range.suffix,
  note: range.note,
});

const getCleanerPriceConfig = (params: PriceSearchParams): PriceConfig => {
  const cleanType = getOne(params, "cleanType") || "regular-clean";
  const bedrooms = getOne(params, "bedrooms") || "1-bed";
  const carpetRooms = getOne(params, "carpetRooms") || getOne(params, "rooms") || "1-room";
  const windowPropertySize = getOne(params, "windowPropertySize") || getOne(params, "propertySize") || "flat";
  const ovenType = getOne(params, "ovenType") || "single-oven";

  if (cleanType === "carpet-cleaning") {
    return rangeToConfig("Carpet Cleaning", carpetCleaningRanges[carpetRooms] ?? carpetCleaningRanges["1-room"]);
  }

  if (cleanType === "window-cleaning") {
    return rangeToConfig("Window Cleaning", windowCleaningRanges[windowPropertySize] ?? windowCleaningRanges.flat);
  }

  if (cleanType === "oven-cleaning") {
    return rangeToConfig("Oven Cleaning", ovenCleaningRanges[ovenType] ?? ovenCleaningRanges["single-oven"]);
  }

  const range = bedroomCleaningRanges[cleanType]?.[bedrooms] ?? bedroomCleaningRanges["regular-clean"][bedrooms] ?? bedroomCleaningRanges["regular-clean"]["1-bed"];
  const label = cleanType === "deep-clean" ? "Deep Clean" : cleanType === "end-of-tenancy" ? "End of Tenancy Cleaning" : "Cleaner";

  return rangeToConfig(label, range);
};

const getManAndVanPriceConfig = (params: PriceSearchParams): PriceConfig => {
  const loadSize = getOne(params, "loadSize") || "few-items";
  const distanceBand = getOne(params, "distanceBand") || "within-slough";

  let min = 70;
  let max = 110;

  if (loadSize === "single-item") [min, max] = [45, 80];
  if (loadSize === "few-items") [min, max] = [70, 110];
  if (loadSize === "room-small-move") [min, max] = [110, 190];
  if (loadSize === "house-move") [min, max] = [180, 380];
  if (loadSize === "office-business") [min, max] = [150, 350];

  if (distanceBand === "nearby-town") [min, max] = [min + 25, max + 55];
  if (distanceBand === "heathrow-west-london") [min, max] = [min + 35, max + 75];
  if (distanceBand === "further-away") [min, max] = [min + 70, max + 150];

  return {
    label: "Man & Van",
    from: money(min, max),
    note: "Final price depends on distance, access, loading time and helpers.",
  };
};

const getPlumberPriceConfig = (params: PriceSearchParams): PriceConfig => {
  const jobType = getOne(params, "jobType") || "tap-sink";
  const urgency = getOne(params, "urgency") || "this-week";

  let min = 80;
  let max = 160;

  if (jobType === "leak") [min, max] = [90, 180];
  if (jobType === "toilet") [min, max] = [80, 170];
  if (jobType === "tap-sink") [min, max] = [70, 140];
  if (jobType === "blocked-drain") [min, max] = [90, 220];
  if (jobType === "boiler-heating") [min, max] = [90, 240];
  if (jobType === "emergency") [min, max] = [120, 260];

  if (urgency === "now") [min, max] = [min + 30, max + 70];
  if (urgency === "today") [min, max] = [min + 15, max + 40];

  return {
    label: "Plumber",
    from: money(min, max),
    note: "Final price depends on issue type, urgency, access, parts and repair details.",
  };
};

export const getPriceConfigForResults = (params: PriceSearchParams): PriceConfig => {
  const serviceKey = normalisePriceServiceSlug(getOne(params, "service"));

  if (serviceKey === "cleaner") return getCleanerPriceConfig(params);
  if (serviceKey === "man-and-van") return getManAndVanPriceConfig(params);
  if (serviceKey === "plumber") return getPlumberPriceConfig(params);

  return (
    basePriceConfigs[serviceKey] ?? {
      label: "Local Service",
      from: "Guide price pending",
      note: "We do not have enough local price data for this service yet. Use this as a placeholder until Quickola has more local checks.",
    }
  );
};