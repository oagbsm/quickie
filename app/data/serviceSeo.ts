import type { ServiceKey } from "./serviceFormConfigs";

export type ServiceSeoCopy = {
  singular: string;
  plural: string;
  searchName: string;
  problemLine: string;
  commonJobs: string[];
};

export const serviceSeoCopy: Record<ServiceKey, ServiceSeoCopy> = {
  "man-and-van": {
    singular: "man and van provider",
    plural: "man and van providers",
    searchName: "Man and van",
    problemLine: "moving a single item, a few items, or a small local move",
    commonJobs: [
      "Single item moves",
      "Furniture collection",
      "Student moves",
      "Small flat moves",
      "Local pickup and drop-off",
    ],
  },
  removals: {
    singular: "removal company",
    plural: "removal providers",
    searchName: "Removals",
    problemLine: "moving home, moving flats, or arranging a bigger local move",
    commonJobs: [
      "Studio and 1-bed moves",
      "2–3 bed removals",
      "Whole house moves",
      "Office moves",
      "Packing and loading help",
    ],
  },
  cleaner: {
    singular: "cleaner",
    plural: "cleaners",
    searchName: "Cleaner",
    problemLine: "booking a regular clean, deep clean, or end-of-tenancy clean",
    commonJobs: [
      "Regular house cleaning",
      "One-off cleaning",
      "Deep cleaning",
      "End-of-tenancy cleaning",
      "Move-in and move-out cleaning",
    ],
  },
  "home-tasks": {
    singular: "handyman",
    plural: "home task providers",
    searchName: "Handyman and home tasks",
    problemLine: "getting small home jobs done without overpaying",
    commonJobs: [
      "Flat-pack assembly",
      "TV mounting",
      "Shelves and curtain poles",
      "Small repairs",
      "Doorbell and camera fitting",
    ],
  },
  plumber: {
    singular: "plumber",
    plural: "plumbers",
    searchName: "Plumber",
    problemLine: "fixing leaks, blocked drains, toilet problems, or urgent plumbing issues",
    commonJobs: [
      "Leaks",
      "Blocked sinks and drains",
      "Toilet repairs",
      "Tap and sink repairs",
      "Emergency plumbing jobs",
    ],
  },
  electrician: {
    singular: "electrician",
    plural: "electricians",
    searchName: "Electrician",
    problemLine: "sorting electrical faults, sockets, lights, or safety checks",
    commonJobs: [
      "No power or tripping",
      "Light repairs",
      "Socket repairs",
      "Fault finding",
      "EICR safety certificates",
    ],
  },
  locksmith: {
    singular: "locksmith",
    plural: "locksmiths",
    searchName: "Locksmith",
    problemLine: "getting help with locked doors, lost keys, or lock repairs",
    commonJobs: [
      "Locked out",
      "Lost keys",
      "Lock changes",
      "UPVC door issues",
      "Emergency locksmith jobs",
    ],
  },
  "painter-decorator": {
    singular: "painter and decorator",
    plural: "painters and decorators",
    searchName: "Painter and decorator",
    problemLine: "painting rooms, decorating, wallpapering, or touching up a property",
    commonJobs: [
      "Interior painting",
      "Exterior painting",
      "Wallpapering",
      "Woodwork and doors",
      "Touch-ups and repairs",
    ],
  },
  gardener: {
    singular: "gardener",
    plural: "gardeners",
    searchName: "Gardener",
    problemLine: "tidying gardens, mowing lawns, trimming hedges, or clearing overgrowth",
    commonJobs: [
      "Lawn mowing",
      "Hedge trimming",
      "Weeding",
      "Garden tidy-ups",
      "Green waste help",
    ],
  },
  "waste-removal": {
    singular: "waste removal provider",
    plural: "waste removal providers",
    searchName: "Waste removal",
    problemLine: "removing furniture, garden waste, appliances, or house clearance waste",
    commonJobs: [
      "Sofa and furniture removal",
      "Garden waste removal",
      "House clearance",
      "Appliance removal",
      "Builders waste removal",
    ],
  },
};