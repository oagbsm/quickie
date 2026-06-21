

export type LocationKey = "slough";

export type SeoAreaConfig = {
  key: string;
  label: string;
  displayName: string;
  postcodeDistricts: string[];
  aliases: string[];
  nearby: string[];
};

export type SeoLocationConfig = {
  key: LocationKey;
  label: string;
  displayName: string;
  areas: Record<string, SeoAreaConfig>;
};

export const seoLocations: Record<LocationKey, SeoLocationConfig> = {
  slough: {
    key: "slough",
    label: "Slough",
    displayName: "Slough and nearby SL areas",
    areas: {
      sl1: {
        key: "sl1",
        label: "SL1",
        displayName: "SL1 Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["sl1", "sl1 slough", "slough sl1"],
        nearby: [
          "Baylis",
          "Central Slough",
          "Chalvey",
          "Cippenham",
          "Farnham Road",
          "Salt Hill",
          "Upton",
          "Burnham",
        ],
      },
      sl2: {
        key: "sl2",
        label: "SL2",
        displayName: "SL2 Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["sl2", "sl2 slough", "slough sl2"],
        nearby: [
          "Wexham",
          "Britwell",
          "Farnham Royal",
          "Farnham Common",
          "Stoke Poges",
          "Lynch Hill",
          "Manor Park",
          "Stoke Green",
        ],
      },
      sl3: {
        key: "sl3",
        label: "SL3",
        displayName: "SL3 Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["sl3", "sl3 slough", "slough sl3"],
        nearby: [
          "Langley",
          "Colnbrook",
          "Poyle",
          "Brands Hill",
          "Horton",
          "Datchet",
          "Iver",
          "George Green",
        ],
      },
      sl4: {
        key: "sl4",
        label: "SL4",
        displayName: "SL4 Windsor",
        postcodeDistricts: ["SL4"],
        aliases: ["sl4", "sl4 windsor", "windsor sl4"],
        nearby: [
          "Windsor",
          "Eton",
          "Dedworth",
          "Old Windsor",
          "Clewer",
          "Fifield",
          "Water Oakley",
        ],
      },
      sl5: {
        key: "sl5",
        label: "SL5",
        displayName: "SL5 Ascot",
        postcodeDistricts: ["SL5"],
        aliases: ["sl5", "sl5 ascot", "ascot sl5"],
        nearby: [
          "Ascot",
          "Sunningdale",
          "Sunninghill",
          "North Ascot",
          "South Ascot",
          "Cheapside",
          "Woodside",
        ],
      },
      sl6: {
        key: "sl6",
        label: "SL6",
        displayName: "SL6 Maidenhead",
        postcodeDistricts: ["SL6"],
        aliases: ["sl6", "sl6 maidenhead", "maidenhead sl6"],
        nearby: [
          "Maidenhead",
          "Taplow",
          "Bray",
          "Cookham",
          "Furze Platt",
          "Cox Green",
          "Pinkneys Green",
          "Holyport",
        ],
      },
      sl7: {
        key: "sl7",
        label: "SL7",
        displayName: "SL7 Marlow",
        postcodeDistricts: ["SL7"],
        aliases: ["sl7", "sl7 marlow", "marlow sl7"],
        nearby: [
          "Marlow",
          "Bisham",
          "Marlow Bottom",
          "Little Marlow",
          "Medmenham",
          "Bovingdon Green",
        ],
      },
      sl8: {
        key: "sl8",
        label: "SL8",
        displayName: "SL8 Bourne End",
        postcodeDistricts: ["SL8"],
        aliases: ["sl8", "sl8 bourne end", "bourne end sl8"],
        nearby: [
          "Bourne End",
          "Wooburn Green",
          "Wooburn",
          "Flackwell Heath",
          "Hedsor",
          "Well End",
        ],
      },
      sl9: {
        key: "sl9",
        label: "SL9",
        displayName: "SL9 Gerrards Cross",
        postcodeDistricts: ["SL9"],
        aliases: ["sl9", "sl9 gerrards cross", "gerrards cross sl9"],
        nearby: [
          "Gerrards Cross",
          "Chalfont St Peter",
          "Denham",
          "Tatling End",
          "Horn Hill",
          "Fulmer",
        ],
      },
      baylis: {
        key: "baylis",
        label: "Baylis",
        displayName: "Baylis, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["baylis", "baylis slough", "baylis sl1"],
        nearby: ["Central Slough", "Farnham Road", "Salt Hill", "Chalvey", "Upton"],
      },
      "central-slough": {
        key: "central-slough",
        label: "Central Slough",
        displayName: "Central Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["central slough", "slough town centre", "town centre slough", "sl1"],
        nearby: ["Baylis", "Chalvey", "Upton", "Salt Hill", "Farnham Road"],
      },
      chalvey: {
        key: "chalvey",
        label: "Chalvey",
        displayName: "Chalvey, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["chalvey", "chalvey slough", "chalvey sl1"],
        nearby: ["Central Slough", "Cippenham", "Baylis", "Salt Hill", "Upton"],
      },
      cippenham: {
        key: "cippenham",
        label: "Cippenham",
        displayName: "Cippenham, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["cippenham", "cippenham slough", "cippenham sl1"],
        nearby: ["Burnham", "Chalvey", "Baylis", "Farnham Road", "Central Slough"],
      },
      "farnham-road": {
        key: "farnham-road",
        label: "Farnham Road",
        displayName: "Farnham Road, Slough",
        postcodeDistricts: ["SL1", "SL2"],
        aliases: ["farnham road", "farnham road slough", "farnham road sl1", "farnham road sl2"],
        nearby: ["Baylis", "Central Slough", "Britwell", "Wexham", "Salt Hill"],
      },
      "salt-hill": {
        key: "salt-hill",
        label: "Salt Hill",
        displayName: "Salt Hill, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["salt hill", "salt hill slough", "salt hill sl1"],
        nearby: ["Baylis", "Farnham Road", "Central Slough", "Chalvey", "Upton"],
      },
      upton: {
        key: "upton",
        label: "Upton",
        displayName: "Upton, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["upton", "upton slough", "upton sl1"],
        nearby: ["Central Slough", "Baylis", "Chalvey", "Langley", "Salt Hill"],
      },
      burnham: {
        key: "burnham",
        label: "Burnham",
        displayName: "Burnham, Slough",
        postcodeDistricts: ["SL1"],
        aliases: ["burnham", "burnham slough", "burnham sl1"],
        nearby: ["Cippenham", "Taplow", "Farnham Road", "Salt Hill", "Chalvey"],
      },
      wexham: {
        key: "wexham",
        label: "Wexham",
        displayName: "Wexham, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["wexham", "wexham slough", "wexham sl2"],
        nearby: ["Stoke Poges", "Farnham Royal", "Britwell", "Lynch Hill", "Stoke Green"],
      },
      britwell: {
        key: "britwell",
        label: "Britwell",
        displayName: "Britwell, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["britwell", "britwell slough", "britwell sl2"],
        nearby: ["Farnham Royal", "Farnham Common", "Wexham", "Lynch Hill", "Burnham"],
      },
      "farnham-royal": {
        key: "farnham-royal",
        label: "Farnham Royal",
        displayName: "Farnham Royal, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["farnham royal", "farnham royal slough", "farnham royal sl2"],
        nearby: ["Stoke Poges", "Farnham Common", "Britwell", "Wexham", "Lynch Hill"],
      },
      "farnham-common": {
        key: "farnham-common",
        label: "Farnham Common",
        displayName: "Farnham Common, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["farnham common", "farnham common slough", "farnham common sl2"],
        nearby: ["Farnham Royal", "Stoke Poges", "Britwell", "Burnham Beeches", "Wexham"],
      },
      "stoke-poges": {
        key: "stoke-poges",
        label: "Stoke Poges",
        displayName: "Stoke Poges, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["stoke poges", "stoke poges slough", "stoke poges sl2"],
        nearby: ["Farnham Common", "Farnham Royal", "Wexham", "Stoke Green", "Fulmer"],
      },
      "lynch-hill": {
        key: "lynch-hill",
        label: "Lynch Hill",
        displayName: "Lynch Hill, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["lynch hill", "lynch hill slough", "lynch hill sl2"],
        nearby: ["Britwell", "Wexham", "Farnham Royal", "Manor Park", "Farnham Road"],
      },
      "manor-park": {
        key: "manor-park",
        label: "Manor Park",
        displayName: "Manor Park, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["manor park", "manor park slough", "manor park sl2"],
        nearby: ["Lynch Hill", "Wexham", "Britwell", "Farnham Road", "Central Slough"],
      },
      "stoke-green": {
        key: "stoke-green",
        label: "Stoke Green",
        displayName: "Stoke Green, Slough",
        postcodeDistricts: ["SL2"],
        aliases: ["stoke green", "stoke green slough", "stoke green sl2"],
        nearby: ["Wexham", "Stoke Poges", "Farnham Royal", "George Green", "Fulmer"],
      },
      langley: {
        key: "langley",
        label: "Langley",
        displayName: "Langley, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["langley", "langley slough", "langley sl3"],
        nearby: ["Colnbrook", "Poyle", "Iver", "Datchet", "Brands Hill"],
      },
      colnbrook: {
        key: "colnbrook",
        label: "Colnbrook",
        displayName: "Colnbrook, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["colnbrook", "colnbrook slough", "colnbrook sl3"],
        nearby: ["Poyle", "Brands Hill", "Langley", "Horton", "Heathrow"],
      },
      poyle: {
        key: "poyle",
        label: "Poyle",
        displayName: "Poyle, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["poyle", "poyle slough", "poyle sl3"],
        nearby: ["Colnbrook", "Brands Hill", "Heathrow", "Langley", "Horton"],
      },
      "brands-hill": {
        key: "brands-hill",
        label: "Brands Hill",
        displayName: "Brands Hill, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["brands hill", "brands hill slough", "brands hill sl3"],
        nearby: ["Colnbrook", "Poyle", "Langley", "Horton", "Iver"],
      },
      horton: {
        key: "horton",
        label: "Horton",
        displayName: "Horton, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["horton", "horton slough", "horton sl3"],
        nearby: ["Datchet", "Colnbrook", "Poyle", "Langley", "Wraysbury"],
      },
      datchet: {
        key: "datchet",
        label: "Datchet",
        displayName: "Datchet, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["datchet", "datchet slough", "datchet sl3"],
        nearby: ["Horton", "Langley", "Colnbrook", "Old Windsor", "Windsor"],
      },
      iver: {
        key: "iver",
        label: "Iver",
        displayName: "Iver, Slough",
        postcodeDistricts: ["SL0", "SL3"],
        aliases: ["iver", "iver slough", "iver sl0", "iver sl3"],
        nearby: ["Langley", "George Green", "Iver Heath", "Brands Hill", "Uxbridge"],
      },
      "george-green": {
        key: "george-green",
        label: "George Green",
        displayName: "George Green, Slough",
        postcodeDistricts: ["SL3"],
        aliases: ["george green", "george green slough", "george green sl3"],
        nearby: ["Langley", "Iver", "Wexham", "Stoke Green", "Brands Hill"],
      },
    },
  },
};

export const locationKeys = Object.keys(seoLocations) as LocationKey[];

export const seoAreaParams = locationKeys.flatMap((location) =>
  Object.keys(seoLocations[location].areas).map((area) => ({
    location,
    area,
  }))
);

export function getSeoLocation(locationKey: string) {
  return seoLocations[locationKey as LocationKey];
}

export function getSeoArea(locationKey: string, areaKey: string) {
  return getSeoLocation(locationKey)?.areas[areaKey];
}

export function getAreaNeighbourhoodText(area: SeoAreaConfig) {
  const lastPlace = area.nearby[area.nearby.length - 1];
  const otherPlaces = area.nearby.slice(0, -1);

  if (!lastPlace) return "";
  if (!otherPlaces.length) return lastPlace;

  return `${otherPlaces.join(", ")} and ${lastPlace}`;
}