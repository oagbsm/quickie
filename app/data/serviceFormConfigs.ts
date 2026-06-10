export type ServiceKey =
  | "man-and-van"
  | "removals"
  | "cleaner"
  | "end-of-tenancy-cleaning"
  | "carpet-cleaning"
  | "oven-cleaning"
  | "plumber"
  | "emergency-plumber"
  | "boiler-repair"
  | "electrician"
  | "locksmith"
  | "handyman"
  | "painter-decorator"
  | "gardener"
  | "waste-removal"
  | "mobile-tyres"
  | "car-recovery"
  | "mobile-mechanic"
  | "mobile-valeting"
  | "car-hire"
  | "van-hire"
  | "airport-transfer"
  | "same-day-courier"
  | "broadband"
  | "energy"
  | "car-insurance"
  | "home-insurance"
  | "sim-deals"
  | "appliance-repair"
  | "pest-control"
  | "roofing-guttering"
  | "window-cleaning"
  | "cctv-security"
  | "blinds-curtains"
  | "flooring-carpet-fitting"
  | "bathroom-repairs"
  | "kitchen-repairs"
  | "furniture-assembly"
  | "house-clearance"
  | "storage-units";

export type FieldType = "chips" | "postcode" | "money" | "select" | "text";

export type ServiceFormOption = {
  label: string;
  value: string;
  helper?: string;
  recommended?: boolean;
};

export type ServiceFormFieldCondition = {
  field: string;
  values: string[];
};

export type ServiceFormField = {
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  example?: string;
  optional?: boolean;
  dependsOn?: ServiceFormFieldCondition;
  stage?: "price" | "match";
  priority?: number;
  options?: ServiceFormOption[];
};

export type ServiceFormConfig = {
  key: ServiceKey;
  label: string;
  shortLabel?: string;
  icon: string;
  category:
    | "home"
    | "moving"
    | "vehicle"
    | "comparison"
    | "business"
    | "property";
  intro: string;
  matchingMode: "local-provider" | "affiliate" | "comparison" | "concierge";
  ctaLabel?: string;
  fields: ServiceFormField[];
};

const urgencyField: ServiceFormField = {
  type: "chips",
  name: "urgency",
  label: "When do you need it?",
  stage: "match",
  priority: 80,
  options: [
    { label: "Now", value: "now" },
    { label: "Today", value: "today" },
    { label: "This week", value: "this-week" },
    { label: "Flexible", value: "flexible" },
  ],
};

const quoteAmountField: ServiceFormField = {
  type: "money",
  name: "quoteAmount",
  label: "Got a quote already?",
  optional: true,
  stage: "match",
  priority: 999,
  placeholder: "Enter amount",
  example: "Optional, e.g. £180",
};

const sloughPostcodeField: ServiceFormField = {
  type: "postcode",
  name: "postcode",
  label: "Where is it needed?",
  stage: "match",
  priority: 90,
  placeholder: "Enter Slough postcode",
  example: "e.g. SL1 1AA",
};

const collectionPostcodeField: ServiceFormField = {
  type: "postcode",
  name: "collectionPostcode",
  label: "Pickup postcode",
  stage: "match",
  priority: 30,
  placeholder: "Enter pickup postcode",
  example: "e.g. SL1 1AA",
};

const deliveryPostcodeField: ServiceFormField = {
  type: "text",
  name: "deliveryPostcode",
  label: "Where is it going?",
  stage: "price",
  priority: 2,
  placeholder: "Postcode or area",
  example: "e.g. SL3, Heathrow, Uxbridge",
};

const stairsOrLiftField: ServiceFormField = {
  type: "chips",
  name: "stairsOrLift",
  label: "Any stairs or lift?",
  stage: "match",
  priority: 40,
  options: [
    { label: "No stairs", value: "no-stairs" },
    { label: "Stairs", value: "stairs" },
    { label: "Lift", value: "lift" },
    { label: "Not sure", value: "not-sure" },
  ],
};

const localDistanceField: ServiceFormField = {
  type: "chips",
  name: "distanceBand",
  label: "If postcode unknown, rough distance?",
  stage: "match",
  priority: 50,
  options: [
    { label: "Within Slough", value: "within-slough" },
    { label: "Nearby town", value: "nearby-town" },
    { label: "Heathrow / West London", value: "heathrow-west-london" },
    { label: "Further away", value: "further-away" },
  ],
};

export const serviceFormConfigs: Record<ServiceKey, ServiceFormConfig> = {
  "man-and-van": {
    key: "man-and-van",
    label: "Moving / Man & Van",
    shortLabel: "Moving",
    icon: "truck",
    category: "moving",
    intro: "Local man & van services in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "loadSize",
        label: "What are you moving?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Single item", value: "single-item" },
          { label: "Few items", value: "few-items" },
          { label: "Room / small move", value: "room-small-move" },
          { label: "Flat / house move", value: "house-move" },
          { label: "Office / business", value: "office-business" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      deliveryPostcodeField,
      collectionPostcodeField,
      localDistanceField,
      stairsOrLiftField,
      urgencyField,
      quoteAmountField,
    ],
  },

  removals: {
    key: "removals",
    label: "Removals",
    icon: "moving-truck",
    category: "moving",
    intro: "Local removal pros in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "propertySize",
        label: "What are you moving?",
        options: [
          { label: "Studio / 1 bed", value: "studio-1-bed" },
          { label: "2–3 bed", value: "2-3-bed" },
          { label: "4+ bed", value: "4-bed-plus" },
          { label: "Whole house", value: "whole-house" },
          { label: "Few items", value: "few-items" },
          { label: "Other", value: "other" },
        ],
      },
      localDistanceField,
      collectionPostcodeField,
      deliveryPostcodeField,
      stairsOrLiftField,
      urgencyField,
      quoteAmountField,
    ],
  },

  cleaner: {
    key: "cleaner",
    label: "Cleaner",
    icon: "spray-can",
    category: "home",
    intro: "Local cleaners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "cleanType",
        label: "What type of clean?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Regular clean", value: "regular-clean" },
          { label: "Deep clean", value: "deep-clean" },
          { label: "End of tenancy", value: "end-of-tenancy" },
          { label: "Carpet cleaning", value: "carpet-cleaning" },
          { label: "Window cleaning", value: "window-cleaning" },
          { label: "Oven cleaning", value: "oven-cleaning" },
        ],
      },
      {
        type: "chips",
        name: "bedrooms",
        label: "Property size?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "cleanType",
          values: ["regular-clean", "deep-clean", "end-of-tenancy"],
        },
        options: [
          { label: "Studio", value: "studio" },
          { label: "1 bed", value: "1-bed" },
          { label: "2 bed", value: "2-bed" },
          { label: "3 bed", value: "3-bed" },
          { label: "4+ bed", value: "4-bed-plus" },
        ],
      },
      {
        type: "chips",
        name: "carpetRooms",
        label: "How many carpeted rooms?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "cleanType",
          values: ["carpet-cleaning"],
        },
        options: [
          { label: "1 room", value: "1-room" },
          { label: "2 rooms", value: "2-rooms" },
          { label: "3 rooms", value: "3-rooms" },
          { label: "4+ rooms", value: "4-plus-rooms" },
          { label: "Stairs too", value: "stairs-too" },
        ],
      },
      {
        type: "chips",
        name: "windowPropertySize",
        label: "Property size?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "cleanType",
          values: ["window-cleaning"],
        },
        options: [
          { label: "Flat", value: "flat" },
          { label: "2–3 bed house", value: "2-3-bed-house" },
          { label: "4+ bed house", value: "4-plus-bed-house" },
          { label: "Shop / office", value: "shop-office" },
        ],
      },
      {
        type: "chips",
        name: "ovenType",
        label: "Oven type?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "cleanType",
          values: ["oven-cleaning"],
        },
        options: [
          { label: "Single oven", value: "single-oven" },
          { label: "Double oven", value: "double-oven" },
          { label: "Range cooker", value: "range-cooker" },
          { label: "Hob + extractor", value: "hob-extractor" },
        ],
      },
      {
        type: "chips",
        name: "cleanFrequency",
        label: "How often?",
        stage: "match",
        priority: 30,
        dependsOn: {
          field: "cleanType",
          values: ["regular-clean"],
        },
        options: [
          { label: "One-off", value: "one-off" },
          { label: "Weekly", value: "weekly" },
          { label: "Fortnightly", value: "fortnightly" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "end-of-tenancy-cleaning": {
    key: "end-of-tenancy-cleaning",
    label: "End of Tenancy Cleaning",
    shortLabel: "End of Tenancy",
    icon: "home-check",
    category: "home",
    intro: "End of tenancy cleaners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "bedrooms",
        label: "How many bedrooms?",
        options: [
          { label: "Studio", value: "studio" },
          { label: "1 bed", value: "1-bed" },
          { label: "2 bed", value: "2-bed" },
          { label: "3 bed", value: "3-bed" },
          { label: "4+ bed", value: "4-bed-plus" },
        ],
      },
      {
        type: "chips",
        name: "extras",
        label: "Any extras?",
        options: [
          { label: "Oven", value: "oven" },
          { label: "Carpet", value: "carpet" },
          { label: "Windows", value: "windows" },
          { label: "None", value: "none" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "carpet-cleaning": {
    key: "carpet-cleaning",
    label: "Carpet Cleaning",
    icon: "rug",
    category: "home",
    intro: "Local carpet cleaners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "rooms",
        label: "How many rooms?",
        options: [
          { label: "1 room", value: "1-room" },
          { label: "2 rooms", value: "2-rooms" },
          { label: "3 rooms", value: "3-rooms" },
          { label: "4+ rooms", value: "4-plus-rooms" },
        ],
      },
      {
        type: "chips",
        name: "stairs",
        label: "Carpeted stairs?",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "oven-cleaning": {
    key: "oven-cleaning",
    label: "Oven Cleaning",
    icon: "oven",
    category: "home",
    intro: "Local oven cleaners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "ovenType",
        label: "What needs cleaning?",
        options: [
          { label: "Single oven", value: "single-oven" },
          { label: "Double oven", value: "double-oven" },
          { label: "Range cooker", value: "range-cooker" },
          { label: "Hob + extractor", value: "hob-extractor" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  plumber: {
    key: "plumber",
    label: "Plumber",
    icon: "tap",
    category: "home",
    intro: "Local plumbers in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "jobType",
        label: "What's the issue?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Leak", value: "leak" },
          { label: "Toilet", value: "toilet" },
          { label: "Tap / sink", value: "tap-sink" },
          { label: "Blocked drain", value: "blocked-drain" },
          { label: "Boiler / no heating", value: "boiler-heating" },
          { label: "Urgent emergency", value: "emergency" },
        ],
      },
      {
        type: "chips",
        name: "urgency",
        label: "When do you need it?",
        stage: "price",
        priority: 2,
        options: [
          { label: "Now", value: "now" },
          { label: "Today", value: "today" },
          { label: "This week", value: "this-week" },
          { label: "Flexible", value: "flexible" },
        ],
      },
      {
        type: "chips",
        name: "severity",
        label: "How bad is it?",
        stage: "match",
        priority: 30,
        dependsOn: {
          field: "jobType",
          values: ["leak", "blocked-drain", "emergency"],
        },
        options: [
          { label: "Small issue", value: "small-issue" },
          { label: "Active leak/blockage", value: "active-issue" },
          { label: "Water off/unusable", value: "unusable" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  "emergency-plumber": {
    key: "emergency-plumber",
    label: "Emergency Plumber",
    icon: "water-alert",
    category: "home",
    intro: "Emergency plumbers in Slough",
    matchingMode: "local-provider",
    ctaLabel: "Check price",
    fields: [
      {
        type: "chips",
        name: "emergencyType",
        label: "What's the emergency?",
        options: [
          { label: "Burst pipe", value: "burst-pipe" },
          { label: "Major leak", value: "major-leak" },
          { label: "Blocked toilet", value: "blocked-toilet" },
          { label: "No water", value: "no-water" },
          { label: "No heating", value: "no-heating" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "urgency",
        label: "How soon?",
        options: [
          { label: "Now", value: "now" },
          { label: "Within 2 hours", value: "within-2-hours" },
          { label: "Today", value: "today" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  "boiler-repair": {
    key: "boiler-repair",
    label: "Boiler Repair",
    icon: "flame",
    category: "home",
    intro: "Boiler repair engineers in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "issue",
        label: "What's wrong?",
        options: [
          { label: "No heating", value: "no-heating" },
          { label: "No hot water", value: "no-hot-water" },
          { label: "Leak", value: "leak" },
          { label: "Error code", value: "error-code" },
          { label: "Service", value: "service" },
          { label: "Other", value: "other" },
        ],
      },
      urgencyField,
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  electrician: {
    key: "electrician",
    label: "Electrician",
    icon: "plug",
    category: "home",
    intro: "Local electricians in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "jobType",
        label: "What's the issue?",
        stage: "price",
        priority: 1,
        options: [
          { label: "No power / tripping", value: "no-power" },
          { label: "Lights", value: "lights" },
          { label: "Sockets", value: "sockets" },
          { label: "Fault finding", value: "fault-finding" },
          { label: "Safety cert / EICR", value: "eicr" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "scope",
        label: "How much is affected?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "jobType",
          values: ["no-power", "lights", "sockets", "fault-finding", "other"],
        },
        options: [
          { label: "One item/room", value: "one-item-room" },
          { label: "Multiple rooms", value: "multiple-rooms" },
          { label: "Whole property", value: "whole-property" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "chips",
        name: "propertySize",
        label: "Property size?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "jobType",
          values: ["eicr"],
        },
        options: [
          { label: "Flat", value: "flat" },
          { label: "1–2 bed", value: "1-2-bed" },
          { label: "3–4 bed", value: "3-4-bed" },
          { label: "5+ bed / commercial", value: "5-plus-commercial" },
        ],
      },
      urgencyField,
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  locksmith: {
    key: "locksmith",
    label: "Locksmith",
    icon: "key",
    category: "home",
    intro: "Local locksmiths in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "jobType",
        label: "What do you need?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Locked out", value: "locked-out" },
          { label: "Lost keys", value: "lost-keys" },
          { label: "New locks", value: "new-locks" },
          { label: "Lock repair", value: "lock-repair" },
          { label: "UPVC door problem", value: "upvc-door" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "urgency",
        label: "When do you need it?",
        stage: "price",
        priority: 2,
        options: [
          { label: "Now", value: "now" },
          { label: "Today", value: "today" },
          { label: "This week", value: "this-week" },
          { label: "Flexible", value: "flexible" },
        ],
      },
      {
        type: "chips",
        name: "doorType",
        label: "Door / lock type?",
        stage: "match",
        priority: 30,
        options: [
          { label: "Front door", value: "front-door" },
          { label: "UPVC", value: "upvc" },
          { label: "Bedroom/internal", value: "internal" },
          { label: "Garage", value: "garage" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  handyman: {
    key: "handyman",
    label: "Handyman",
    icon: "hammer",
    category: "home",
    intro: "Local handymen in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "jobType",
        label: "What do you need help with?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Flat pack", value: "flat-pack" },
          { label: "TV mounting", value: "tv-mounting" },
          { label: "Shelves", value: "shelves" },
          { label: "Curtains/blinds", value: "curtains-blinds" },
          { label: "Small repairs", value: "small-repairs" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "jobCount",
        label: "How much work?",
        stage: "price",
        priority: 2,
        options: [
          { label: "1 small job", value: "1-small-job" },
          { label: "2–3 jobs", value: "2-3-jobs" },
          { label: "Several jobs", value: "several-jobs" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "chips",
        name: "wallType",
        label: "Wall type?",
        stage: "match",
        priority: 30,
        dependsOn: {
          field: "jobType",
          values: ["tv-mounting", "shelves", "curtains-blinds"],
        },
        options: [
          { label: "Brick", value: "brick" },
          { label: "Plasterboard", value: "plasterboard" },
          { label: "Concrete", value: "concrete" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "painter-decorator": {
    key: "painter-decorator",
    label: "Painter & Decorator",
    shortLabel: "Painter",
    icon: "paint-roller",
    category: "home",
    intro: "Local painters in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "workType",
        label: "What needs painting?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Interior", value: "interior-painting" },
          { label: "Exterior", value: "exterior-painting" },
          { label: "Wallpaper", value: "wallpapering" },
          { label: "Touch-ups", value: "touch-ups" },
          { label: "Woodwork/doors", value: "woodwork-doors" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "roomCount",
        label: "How much?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "workType",
          values: ["interior-painting", "wallpapering", "touch-ups", "woodwork-doors", "other"],
        },
        options: [
          { label: "1 room", value: "1-room" },
          { label: "2–3 rooms", value: "2-3-rooms" },
          { label: "4+ rooms", value: "4-plus-rooms" },
          { label: "Whole property", value: "whole-property" },
        ],
      },
      {
        type: "chips",
        name: "exteriorSize",
        label: "Exterior size?",
        stage: "price",
        priority: 2,
        dependsOn: {
          field: "workType",
          values: ["exterior-painting"],
        },
        options: [
          { label: "Front only", value: "front-only" },
          { label: "Small house", value: "small-house" },
          { label: "3-bed house", value: "3-bed-house" },
          { label: "Large property", value: "large-property" },
        ],
      },
      {
        type: "chips",
        name: "surfaceCondition",
        label: "Surface condition?",
        stage: "match",
        priority: 30,
        options: [
          { label: "Good condition", value: "good" },
          { label: "Needs filling", value: "needs-filling" },
          { label: "Peeling/damp", value: "peeling-damp" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  gardener: {
    key: "gardener",
    label: "Gardener",
    icon: "leaf",
    category: "home",
    intro: "Local gardeners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "gardenWork",
        label: "What garden work?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Lawn mowing", value: "lawn-mowing" },
          { label: "Hedge trimming", value: "hedge-trimming" },
          { label: "Weeding", value: "weeding" },
          { label: "Garden tidy", value: "garden-tidy" },
          { label: "Small tree pruning", value: "tree-pruning" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "gardenCondition",
        label: "How overgrown?",
        stage: "price",
        priority: 2,
        options: [
          { label: "Light tidy", value: "light-tidy" },
          { label: "Medium", value: "medium" },
          { label: "Very overgrown", value: "very-overgrown" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "chips",
        name: "gardenSize",
        label: "Garden size?",
        stage: "match",
        priority: 30,
        options: [
          { label: "Small", value: "small", helper: "Up to 50m²" },
          { label: "Medium", value: "medium", helper: "50–150m²" },
          { label: "Large", value: "large", helper: "150m²+" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "chips",
        name: "greenWaste",
        label: "Take waste away?",
        stage: "match",
        priority: 40,
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "waste-removal": {
    key: "waste-removal",
    label: "Waste Removal",
    icon: "trash",
    category: "property",
    intro: "Waste removal providers in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "wasteType",
        label: "What needs removing?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Sofa/furniture", value: "furniture" },
          { label: "Garden waste", value: "garden-waste" },
          { label: "House clearance", value: "house-clearance" },
          { label: "Builders waste", value: "builders-waste" },
          { label: "Appliance", value: "appliance" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "loadSize",
        label: "How much is there?",
        stage: "price",
        priority: 2,
        options: [
          { label: "Few bags", value: "few-bags" },
          { label: "Small van", value: "small-van" },
          { label: "Half van", value: "half-van" },
          { label: "Full van", value: "full-van" },
        ],
      },
      {
        type: "chips",
        name: "access",
        label: "Where is the waste?",
        stage: "match",
        priority: 30,
        options: [
          { label: "Outside", value: "outside" },
          { label: "Ground floor", value: "ground-floor" },
          { label: "Upstairs", value: "upstairs" },
          { label: "Mixed", value: "mixed" },
        ],
      },
      {
        type: "chips",
        name: "heavyItems",
        label: "Any heavy items?",
        stage: "match",
        priority: 40,
        options: [
          { label: "No", value: "no" },
          { label: "Mattress/sofa", value: "mattress-sofa" },
          { label: "Appliance", value: "appliance" },
          { label: "Rubble/soil", value: "rubble-soil" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "mobile-tyres": {
    key: "mobile-tyres",
    label: "Mobile Tyres",
    icon: "tyre",
    category: "vehicle",
    intro: "Mobile tyre fitters near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "tyreIssue",
        label: "What do you need?",
        options: [
          { label: "Puncture", value: "puncture" },
          { label: "New tyre", value: "new-tyre" },
          { label: "Flat tyre", value: "flat-tyre" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "text",
        name: "tyreSizeOrCar",
        label: "Tyre size or car model",
        placeholder: "e.g. 205/55/R16 or Nissan Note",
        optional: true,
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "car-recovery": {
    key: "car-recovery",
    label: "Car Recovery",
    icon: "tow-truck",
    category: "vehicle",
    intro: "Vehicle recovery near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "vehicleIssue",
        label: "What happened?",
        options: [
          { label: "Broken down", value: "broken-down" },
          { label: "Won't start", value: "wont-start" },
          { label: "Accident", value: "accident" },
          { label: "Need transport", value: "transport" },
        ],
      },
      collectionPostcodeField,
      deliveryPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "mobile-mechanic": {
    key: "mobile-mechanic",
    label: "Mobile Mechanic",
    icon: "car-wrench",
    category: "vehicle",
    intro: "Mobile mechanics near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "mechanicJob",
        label: "What do you need?",
        options: [
          { label: "Diagnostics", value: "diagnostics" },
          { label: "Battery", value: "battery" },
          { label: "Brakes", value: "brakes" },
          { label: "Service", value: "service" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "text",
        name: "carDetails",
        label: "Car details",
        placeholder: "e.g. Nissan Note 2012",
        optional: true,
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "mobile-valeting": {
    key: "mobile-valeting",
    label: "Mobile Valeting",
    icon: "car-sparkle",
    category: "vehicle",
    intro: "Mobile car valeters near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "valetType",
        label: "What valet do you need?",
        options: [
          { label: "Exterior", value: "exterior" },
          { label: "Interior", value: "interior" },
          { label: "Full valet", value: "full-valet" },
          { label: "Deep clean", value: "deep-clean" },
        ],
      },
      {
        type: "chips",
        name: "vehicleSize",
        label: "Vehicle size?",
        options: [
          { label: "Small car", value: "small-car" },
          { label: "Medium car", value: "medium-car" },
          { label: "SUV/van", value: "suv-van" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "car-hire": {
    key: "car-hire",
    label: "Car Hire",
    icon: "car",
    category: "comparison",
    intro: "Compare car hire prices",
    matchingMode: "affiliate",
    ctaLabel: "Compare car hire",
    fields: [
      {
        type: "postcode",
        name: "pickupLocation",
        label: "Pickup location",
        placeholder: "Enter location or airport",
        example: "e.g. Heathrow or Slough",
      },
      {
        type: "chips",
        name: "carSize",
        label: "Car size?",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "SUV", value: "suv" },
          { label: "Van", value: "van" },
        ],
      },
    ],
  },

  "van-hire": {
    key: "van-hire",
    label: "Van Hire",
    icon: "van",
    category: "comparison",
    intro: "Compare van hire prices",
    matchingMode: "affiliate",
    ctaLabel: "Compare van hire",
    fields: [
      {
        type: "postcode",
        name: "pickupLocation",
        label: "Pickup location",
        placeholder: "Enter location",
        example: "e.g. Slough",
      },
      {
        type: "chips",
        name: "vanSize",
        label: "Van size?",
        options: [
          { label: "Small van", value: "small-van" },
          { label: "Medium van", value: "medium-van" },
          { label: "Luton", value: "luton" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
    ],
  },

  "airport-transfer": {
    key: "airport-transfer",
    label: "Airport Transfer",
    icon: "plane-car",
    category: "vehicle",
    intro: "Airport transfer prices near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "airport",
        label: "Which airport?",
        options: [
          { label: "Heathrow", value: "heathrow" },
          { label: "Gatwick", value: "gatwick" },
          { label: "Luton", value: "luton" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "tripDirection",
        label: "Trip direction?",
        options: [
          { label: "To airport", value: "to-airport" },
          { label: "From airport", value: "from-airport" },
          { label: "Return", value: "return" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      collectionPostcodeField,
      {
        type: "chips",
        name: "passengers",
        label: "Passengers?",
        options: [
          { label: "1–2", value: "1-2" },
          { label: "3–4", value: "3-4" },
          { label: "5+", value: "5-plus" },
        ],
      },
      urgencyField,
      quoteAmountField,
    ],
  },

  "same-day-courier": {
    key: "same-day-courier",
    label: "Same-day Courier",
    icon: "package",
    category: "business",
    intro: "Same-day couriers near Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "parcelSize",
        label: "Parcel size?",
        options: [
          { label: "Envelope", value: "envelope" },
          { label: "Small parcel", value: "small-parcel" },
          { label: "Large parcel", value: "large-parcel" },
          { label: "Multiple items", value: "multiple-items" },
        ],
      },
      collectionPostcodeField,
      deliveryPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  broadband: {
    key: "broadband",
    label: "Broadband",
    icon: "wifi",
    category: "comparison",
    intro: "Compare broadband deals",
    matchingMode: "comparison",
    ctaLabel: "Check broadband deals",
    fields: [
      sloughPostcodeField,
      {
        type: "chips",
        name: "usage",
        label: "What do you use it for?",
        options: [
          { label: "Basic", value: "basic" },
          { label: "Streaming", value: "streaming" },
          { label: "Gaming", value: "gaming" },
          { label: "Work from home", value: "work-from-home" },
        ],
      },
    ],
  },

  energy: {
    key: "energy",
    label: "Energy",
    icon: "bolt",
    category: "comparison",
    intro: "Check energy prices",
    matchingMode: "comparison",
    ctaLabel: "Check energy prices",
    fields: [
      sloughPostcodeField,
      {
        type: "chips",
        name: "propertyType",
        label: "Property type?",
        options: [
          { label: "Flat", value: "flat" },
          { label: "House", value: "house" },
          { label: "Shared", value: "shared" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
    ],
  },

  "car-insurance": {
    key: "car-insurance",
    label: "Car Insurance",
    icon: "car-shield",
    category: "comparison",
    intro: "Check car insurance prices",
    matchingMode: "comparison",
    ctaLabel: "Check insurance prices",
    fields: [
      {
        type: "chips",
        name: "coverType",
        label: "What cover do you need?",
        options: [
          { label: "Comprehensive", value: "comprehensive" },
          { label: "Third party", value: "third-party" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "text",
        name: "carRegOrModel",
        label: "Car reg or model",
        placeholder: "Enter reg or car model",
        optional: true,
      },
    ],
  },

  "home-insurance": {
    key: "home-insurance",
    label: "Home Insurance",
    icon: "home-shield",
    category: "comparison",
    intro: "Check home insurance prices",
    matchingMode: "comparison",
    fields: [
      {
        type: "chips",
        name: "coverType",
        label: "What cover do you need?",
        options: [
          { label: "Buildings", value: "buildings" },
          { label: "Contents", value: "contents" },
          { label: "Both", value: "both" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
    ],
  },

  "sim-deals": {
    key: "sim-deals",
    label: "SIM Deals",
    icon: "sim-card",
    category: "comparison",
    intro: "Compare SIM deals",
    matchingMode: "comparison",
    fields: [
      {
        type: "chips",
        name: "dataAmount",
        label: "How much data?",
        options: [
          { label: "5–20GB", value: "5-20gb" },
          { label: "50GB+", value: "50gb-plus" },
          { label: "Unlimited", value: "unlimited" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
    ],
  },

  "appliance-repair": {
    key: "appliance-repair",
    label: "Appliance Repair",
    icon: "washing-machine",
    category: "home",
    intro: "Appliance repair pros in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "appliance",
        label: "What appliance?",
        options: [
          { label: "Washing machine", value: "washing-machine" },
          { label: "Fridge/freezer", value: "fridge-freezer" },
          { label: "Oven/cooker", value: "oven-cooker" },
          { label: "Dishwasher", value: "dishwasher" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "pest-control": {
    key: "pest-control",
    label: "Pest Control",
    icon: "bug",
    category: "property",
    intro: "Pest control providers in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "pestType",
        label: "What pest?",
        options: [
          { label: "Mice/rats", value: "mice-rats" },
          { label: "Bed bugs", value: "bed-bugs" },
          { label: "Wasps", value: "wasps" },
          { label: "Ants", value: "ants" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "roofing-guttering": {
    key: "roofing-guttering",
    label: "Roofing / Guttering",
    icon: "roof",
    category: "property",
    intro: "Roofing and guttering help in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "jobType",
        label: "What do you need?",
        options: [
          { label: "Gutter cleaning", value: "gutter-cleaning" },
          { label: "Gutter repair", value: "gutter-repair" },
          { label: "Roof leak", value: "roof-leak" },
          { label: "Tile repair", value: "tile-repair" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "window-cleaning": {
    key: "window-cleaning",
    label: "Window Cleaning",
    icon: "window",
    category: "property",
    intro: "Window cleaners in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "propertySize",
        label: "Property size?",
        options: [
          { label: "Flat", value: "flat" },
          { label: "2–3 bed house", value: "2-3-bed-house" },
          { label: "4+ bed house", value: "4-plus-bed-house" },
          { label: "Shop/office", value: "shop-office" },
        ],
      },
      {
        type: "chips",
        name: "windowType",
        label: "Inside or outside?",
        options: [
          { label: "Outside only", value: "outside-only" },
          { label: "Inside + outside", value: "inside-outside" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      sloughPostcodeField,
      quoteAmountField,
    ],
  },

  "cctv-security": {
    key: "cctv-security",
    label: "CCTV / Security",
    icon: "cctv",
    category: "property",
    intro: "CCTV and security installers in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "securityJob",
        label: "What do you need?",
        options: [
          { label: "CCTV install", value: "cctv-install" },
          { label: "Alarm", value: "alarm" },
          { label: "Doorbell camera", value: "doorbell-camera" },
          { label: "Repair", value: "repair" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "blinds-curtains": {
    key: "blinds-curtains",
    label: "Blinds / Curtains",
    icon: "blinds",
    category: "home",
    intro: "Blind and curtain fitters in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "fittingType",
        label: "What needs fitting?",
        options: [
          { label: "Blinds", value: "blinds" },
          { label: "Curtain rail", value: "curtain-rail" },
          { label: "Both", value: "both" },
          { label: "Repair", value: "repair" },
        ],
      },
      {
        type: "chips",
        name: "windows",
        label: "How many windows?",
        options: [
          { label: "1", value: "1" },
          { label: "2–3", value: "2-3" },
          { label: "4+", value: "4-plus" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "flooring-carpet-fitting": {
    key: "flooring-carpet-fitting",
    label: "Flooring / Carpet Fitting",
    shortLabel: "Flooring",
    icon: "flooring",
    category: "home",
    intro: "Flooring and carpet fitters in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "floorType",
        label: "What flooring?",
        options: [
          { label: "Carpet", value: "carpet" },
          { label: "Laminate", value: "laminate" },
          { label: "Vinyl", value: "vinyl" },
          { label: "LVT", value: "lvt" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "rooms",
        label: "How many rooms?",
        options: [
          { label: "1 room", value: "1-room" },
          { label: "2–3 rooms", value: "2-3-rooms" },
          { label: "4+ rooms", value: "4-plus-rooms" },
          { label: "Whole property", value: "whole-property" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "bathroom-repairs": {
    key: "bathroom-repairs",
    label: "Bathroom Repairs",
    icon: "bath",
    category: "home",
    intro: "Bathroom repair help in Slough",
    matchingMode: "concierge",
    fields: [
      {
        type: "chips",
        name: "bathroomJob",
        label: "What do you need?",
        options: [
          { label: "Leak", value: "leak" },
          { label: "Tiling", value: "tiling" },
          { label: "Shower", value: "shower" },
          { label: "Toilet/sink", value: "toilet-sink" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "kitchen-repairs": {
    key: "kitchen-repairs",
    label: "Kitchen Repairs",
    icon: "kitchen",
    category: "home",
    intro: "Kitchen repair help in Slough",
    matchingMode: "concierge",
    fields: [
      {
        type: "chips",
        name: "kitchenJob",
        label: "What do you need?",
        options: [
          { label: "Cupboards", value: "cupboards" },
          { label: "Worktop", value: "worktop" },
          { label: "Sink/tap", value: "sink-tap" },
          { label: "Appliance fitting", value: "appliance-fitting" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "furniture-assembly": {
    key: "furniture-assembly",
    label: "Furniture Assembly",
    icon: "furniture",
    category: "home",
    intro: "Furniture assembly help in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "furnitureType",
        label: "What needs assembling?",
        options: [
          { label: "Wardrobe", value: "wardrobe" },
          { label: "Bed", value: "bed" },
          { label: "Desk/table", value: "desk-table" },
          { label: "Multiple items", value: "multiple-items" },
          { label: "Other", value: "other" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "house-clearance": {
    key: "house-clearance",
    label: "House Clearance",
    icon: "house-clearance",
    category: "property",
    intro: "House clearance help in Slough",
    matchingMode: "local-provider",
    fields: [
      {
        type: "chips",
        name: "clearanceSize",
        label: "How much needs clearing?",
        options: [
          { label: "Few items", value: "few-items" },
          { label: "One room", value: "one-room" },
          { label: "Several rooms", value: "several-rooms" },
          { label: "Whole house", value: "whole-house" },
        ],
      },
      sloughPostcodeField,
      urgencyField,
      quoteAmountField,
    ],
  },

  "storage-units": {
    key: "storage-units",
    label: "Storage Units",
    icon: "storage",
    category: "comparison",
    intro: "Compare storage options near Slough",
    matchingMode: "comparison",
    ctaLabel: "Check storage prices",
    fields: [
      sloughPostcodeField,
      {
        type: "chips",
        name: "storageSize",
        label: "Storage size?",
        options: [
          { label: "Small locker", value: "small-locker" },
          { label: "Half garage", value: "half-garage" },
          { label: "Garage size", value: "garage-size" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
    ],
  },
};

export const popularServiceKeys: ServiceKey[] = [
  "man-and-van",
  "cleaner",
  "plumber",
  "locksmith",
  "gardener",
  "handyman",
  "painter-decorator",
  "waste-removal",
];

export const quickolaAlsoChecksKeys: ServiceKey[] = [
  "car-hire",
  "broadband",
  "energy",
  "car-insurance",
];

export const getServiceFormConfig = (serviceKey: ServiceKey) => {
  return serviceFormConfigs[serviceKey];
};

const serviceDropdownOrder: ServiceKey[] = [
  "man-and-van",
  "cleaner",
  "plumber",
  "locksmith",
  "gardener",
  "handyman",
  "painter-decorator",
  "waste-removal",
  "electrician",
];

export const serviceOptions = serviceDropdownOrder.map((serviceKey) => {
  const service = serviceFormConfigs[serviceKey];

  return {
    label: service.shortLabel ?? service.label,
    value: service.key,
    icon: service.icon,
    category: service.category,
    matchingMode: service.matchingMode,
  };
});