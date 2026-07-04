export type ServiceKey =
  | "man-and-van"
  | "removals"
  | "cleaner"
  | "home-tasks"
  | "plumber"
  | "electrician"
  | "locksmith"
  | "painter-decorator"
  | "gardener"
  | "waste-removal";


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
  category: "home" | "moving" | "property";
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

const pickupPostcodeField: ServiceFormField = {
  type: "postcode",
  name: "pickupPostcode",
  label: "Pickup postcode",
  stage: "price",
  priority: 2,
  placeholder: "Enter pickup postcode",
  example: "e.g. SL1 1AA",
};

const dropoffPostcodeField: ServiceFormField = {
  type: "postcode",
  name: "dropoffPostcode",
  label: "Drop-off postcode",
  stage: "price",
  priority: 3,
  placeholder: "Enter drop-off postcode",
  example: "e.g. SL3 8AA",
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
      pickupPostcodeField,
      dropoffPostcodeField,
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
      pickupPostcodeField,
      dropoffPostcodeField,
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

  "home-tasks": {
    key: "home-tasks",
    label: "Home Tasks",
    icon: "handyman",
    category: "home",
    intro: "Small home jobs in Slough",
    matchingMode: "local-provider",
    ctaLabel: "Check home tasks price",
    fields: [
      {
        type: "chips",
        name: "taskType",
        label: "What small job do you need?",
        stage: "price",
        priority: 1,
        options: [
          { label: "Flat-pack assembly", value: "flat-pack" },
          { label: "Shelves / curtain pole", value: "shelves-curtains" },
          { label: "TV mounting", value: "tv-mounting" },
          { label: "Ring doorbell / camera", value: "ring-doorbell-camera" },
          { label: "Cupboard fix", value: "cupboard-fix" },
          { label: "Small repair", value: "small-repair" },
          { label: "Other task", value: "other" },
        ],
      },
      {
        type: "chips",
        name: "taskSize",
        label: "How big is the job?",
        stage: "price",
        priority: 2,
        options: [
          { label: "Quick fix", value: "quick-fix" },
          { label: "1 small item", value: "one-small-item" },
          { label: "Few items", value: "few-items" },
          { label: "Half day", value: "half-day" },
          { label: "Not sure", value: "not-sure" },
        ],
      },
      {
        type: "text",
        name: "taskDescription",
        label: "Describe the task",
        stage: "match",
        priority: 30,
        optional: true,
        placeholder: "e.g. Assemble IKEA wardrobe, put up 2 shelves, fix cupboard hinge",
        example: "Optional — photos can be added after submission",
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













};

export const popularServiceKeys: ServiceKey[] = [
  "plumber",
  "electrician",
  "locksmith",
  "cleaner",
  "man-and-van",
  "painter-decorator",
];


export const getServiceFormConfig = (serviceKey: ServiceKey) => {
  return serviceFormConfigs[serviceKey];
};

export const serviceDropdownOrder: ServiceKey[] = [
  "plumber",
  "electrician",
  "locksmith",
  "cleaner",
  "home-tasks",
  "man-and-van",
  "removals",
  "painter-decorator",
  "gardener",
  "waste-removal",
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