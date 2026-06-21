// app/data/seoAreas.ts

export type SloughAreaKey = "sl1" | "sl2" | "sl3" | "sl4" | "sl5" | "sl6" | "sl7";

export const sloughAreas: Record<
  SloughAreaKey,
  {
    key: SloughAreaKey;
    label: string;
    displayName: string;
    seoName: string;
    nearby: string[];
  }
> = {
  sl1: {
    key: "sl1",
    label: "SL1",
    displayName: "SL1 Slough",
    seoName: "SL1 Slough",
    nearby: [
      "Baylis",
      "Central Slough",
      "Chalvey",
      "Cippenham",
      "Farnham Road",
      "Burnham",
      "Britwell",
      "Salt Hill",
    ],
  },

  sl2: {
    key: "sl2",
    label: "SL2",
    displayName: "SL2 Slough",
    seoName: "SL2 Slough",
    nearby: [
      "Farnham Common",
      "Farnham Royal",
      "Stoke Poges",
      "Wexham",
      "Britwell",
      "Lynch Hill",
      "Manor Park",
    ],
  },

  sl3: {
    key: "sl3",
    label: "SL3",
    displayName: "SL3 Slough",
    seoName: "SL3 Slough",
    nearby: [
      "Langley",
      "Colnbrook",
      "Poyle",
      "Brands Hill",
      "Horton",
      "Datchet",
      "Iver",
    ],
  },

  sl4: {
    key: "sl4",
    label: "SL4",
    displayName: "SL4 Windsor",
    seoName: "SL4 Windsor",
    nearby: [
      "Windsor",
      "Eton",
      "Dedworth",
      "Old Windsor",
      "Clewer",
      "Fifield",
    ],
  },

  sl5: {
    key: "sl5",
    label: "SL5",
    displayName: "SL5 Ascot",
    seoName: "SL5 Ascot",
    nearby: [
      "Ascot",
      "Sunningdale",
      "Sunninghill",
      "North Ascot",
      "South Ascot",
      "Cheapside",
    ],
  },

  sl6: {
    key: "sl6",
    label: "SL6",
    displayName: "SL6 Maidenhead",
    seoName: "SL6 Maidenhead",
    nearby: [
      "Maidenhead",
      "Taplow",
      "Bray",
      "Cookham",
      "Furze Platt",
      "Cox Green",
      "Pinkneys Green",
    ],
  },

  sl7: {
    key: "sl7",
    label: "SL7",
    displayName: "SL7 Marlow",
    seoName: "SL7 Marlow",
    nearby: [
      "Marlow",
      "Bisham",
      "Marlow Bottom",
      "Little Marlow",
      "Medmenham",
    ],
  },
};

export const sloughAreaKeys = Object.keys(sloughAreas) as SloughAreaKey[];