export type SeoPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  areaType: "city" | "zone" | "area";
  location: string;
  parentLocation?: string;
  nearbyAreas?: string[];
  localNeighbourhoods?: string[];
  localPriceNote?: string;
  localSearchNote?: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  priceGuide: {
    label: string;
    from: string;
    typical: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
};

const cleaningPriceGuide = [
  {
    label: "Regular domestic cleaning",
    from: "£18/hr",
    typical: "Most London cleaners charge around £18–£25 per hour depending on area, notice and job size.",
  },
  {
    label: "Deep cleaning",
    from: "£90",
    typical: "Typical deep cleans often sit around £90–£220 depending on property size and condition.",
  },
  {
    label: "End of tenancy cleaning",
    from: "£120",
    typical: "End of tenancy cleans usually range from £120–£350+ depending on bedrooms, bathrooms and add-ons.",
  },
];

const eastLondonAreaDetails: Record<
  string,
  {
    nearbyAreas: string[];
    localNeighbourhoods: string[];
    localPriceNote: string;
    localSearchNote: string;
    intro: string;
  }
> = {
  Ilford: {
    nearbyAreas: ["Barking", "East Ham", "Romford", "Wanstead", "Forest Gate"],
    localNeighbourhoods: ["Gants Hill", "Seven Kings", "Goodmayes", "Cranbrook Road", "Valentines Park", "Newbury Park"],
    localPriceNote: "Ilford cleaning prices are usually more affordable than inner London, but end of tenancy jobs near busy rental areas like Gants Hill, Seven Kings and Goodmayes can cost more when parking, access or same-day availability is difficult.",
    localSearchNote: "Ilford searches often come from renters, landlords and families looking for regular domestic cleaning, deep cleaning after moving, or end of tenancy cleaning near Gants Hill, Seven Kings and Newbury Park.",
    intro: "Looking for a cleaner in Ilford? Quickola helps you check a fair cleaning price before you book, whether you are near Gants Hill, Seven Kings, Goodmayes, Cranbrook Road, Valentines Park or Newbury Park.",
  },
  Barking: {
    nearbyAreas: ["Ilford", "East Ham", "Dagenham", "Canning Town", "Plaistow"],
    localNeighbourhoods: ["Barking Town Centre", "Barking Riverside", "Upney", "Abbey Road", "Gascoigne", "Thames View"],
    localPriceNote: "Barking cleaning prices can vary a lot between smaller flats near the station and larger homes around Upney, Thames View and Barking Riverside. Same-day end of tenancy cleaning can push prices up.",
    localSearchNote: "Barking has strong demand for rental cleans, flat cleans and move-out cleaning, especially around Barking Town Centre, Barking Riverside and Abbey Road.",
    intro: "Need a cleaner in Barking? Quickola helps you compare fair prices for regular cleaning, deep cleaning and end of tenancy cleaning around Barking Town Centre, Upney, Barking Riverside and Thames View.",
  },
  "East Ham": {
    nearbyAreas: ["Ilford", "Barking", "Forest Gate", "Plaistow", "Canning Town"],
    localNeighbourhoods: ["High Street North", "East Ham Station", "Upton Park", "Central Park", "Manor Park", "Beckton Road"],
    localPriceNote: "East Ham cleaning prices are often competitive, but larger terraced homes, heavy deep cleans and short-notice move-out jobs can cost more than a simple regular clean.",
    localSearchNote: "East Ham cleaning searches often come from families, renters and landlords around High Street North, Upton Park, Manor Park and Central Park.",
    intro: "Searching for cleaner prices in East Ham? Quickola helps you understand the usual cost before booking a cleaner around High Street North, Upton Park, Manor Park, Central Park and Beckton Road.",
  },
  Stratford: {
    nearbyAreas: ["Bow", "Hackney", "Forest Gate", "Leyton", "Canning Town"],
    localNeighbourhoods: ["Stratford Centre", "Westfield Stratford", "Maryland", "Olympic Park", "Stratford High Street", "Carpenters Estate"],
    localPriceNote: "Stratford can be pricier than some outer East London areas because of high rental turnover, apartment blocks, parking restrictions and urgent move-out cleaning around Westfield, Maryland and Olympic Park.",
    localSearchNote: "Stratford cleaning demand is often linked to flats, new-build apartments, Airbnb-style turnovers and end of tenancy cleaning near Westfield, Maryland and Olympic Park.",
    intro: "Need a cleaner in Stratford? Quickola helps you check fair cleaning prices around Westfield Stratford, Maryland, Olympic Park, Stratford High Street and nearby apartment blocks before you book.",
  },
  Romford: {
    nearbyAreas: ["Ilford", "Dagenham", "Barking", "Wanstead", "Walthamstow"],
    localNeighbourhoods: ["Romford Town Centre", "Gidea Park", "Collier Row", "Harold Hill", "Chadwell Heath", "Rush Green"],
    localPriceNote: "Romford cleaning prices depend heavily on property size. Larger family homes around Gidea Park, Collier Row and Harold Hill usually cost more than small town-centre flats.",
    localSearchNote: "Romford searches often involve family-home cleaning, deep cleans, move-out cleaning and regular domestic cleaning around Gidea Park, Collier Row and Chadwell Heath.",
    intro: "Looking for cleaner prices in Romford? Quickola helps you compare fair costs for homes and flats around Romford Town Centre, Gidea Park, Collier Row, Harold Hill and Chadwell Heath.",
  },
  Dagenham: {
    nearbyAreas: ["Barking", "Romford", "Ilford", "East Ham", "Plaistow"],
    localNeighbourhoods: ["Dagenham Heathway", "Becontree", "Chadwell Heath", "Dagenham East", "Rush Green", "Marks Gate"],
    localPriceNote: "Dagenham cleaning is often good value compared with inner London, but bigger homes in Becontree, Chadwell Heath and Marks Gate can need longer cleaning slots.",
    localSearchNote: "Dagenham cleaning searches usually include regular domestic cleaning, deep cleaning and move-out jobs around Dagenham Heathway, Becontree and Chadwell Heath.",
    intro: "Need a cleaner in Dagenham? Quickola helps you check fair prices around Dagenham Heathway, Becontree, Chadwell Heath, Dagenham East and Marks Gate before asking for a match.",
  },
  "Forest Gate": {
    nearbyAreas: ["East Ham", "Stratford", "Leytonstone", "Ilford", "Wanstead"],
    localNeighbourhoods: ["Woodgrange Road", "Forest Gate Station", "Wanstead Flats", "Upton Park", "Maryland", "Manor Park"],
    localPriceNote: "Forest Gate prices can be slightly higher near transport links and period homes, especially for deep cleans, post-renovation cleaning or end of tenancy work.",
    localSearchNote: "Forest Gate demand often comes from renters, shared houses and families around Woodgrange Road, Wanstead Flats, Maryland and Manor Park.",
    intro: "Searching for a cleaner in Forest Gate? Quickola helps you check fair cleaning prices around Woodgrange Road, Wanstead Flats, Forest Gate Station, Maryland and Manor Park.",
  },
  Leyton: {
    nearbyAreas: ["Leytonstone", "Walthamstow", "Stratford", "Hackney", "Wanstead"],
    localNeighbourhoods: ["Leyton High Road", "Leyton Midland Road", "Leyton Orient", "Francis Road", "Bakers Arms", "Temple Mills"],
    localPriceNote: "Leyton cleaning prices can rise for larger Victorian homes, shared houses and short-notice end of tenancy cleaning around Francis Road, Bakers Arms and Leyton High Road.",
    localSearchNote: "Leyton searches often include domestic cleaners, end of tenancy cleaners and deep cleaning around Francis Road, Leyton Midland Road and Bakers Arms.",
    intro: "Looking for cleaner prices in Leyton? Quickola helps you check fair costs around Leyton High Road, Francis Road, Bakers Arms, Leyton Midland Road and Temple Mills.",
  },
  Leytonstone: {
    nearbyAreas: ["Leyton", "Wanstead", "Forest Gate", "Walthamstow", "Ilford"],
    localNeighbourhoods: ["Leytonstone High Road", "Bushwood", "Upper Leytonstone", "Hollow Ponds", "Cathall", "Wanstead Flats"],
    localPriceNote: "Leytonstone prices vary between flats, terraces and larger homes near Bushwood, Hollow Ponds and Upper Leytonstone. Bigger deep cleans usually need fixed quotes.",
    localSearchNote: "Leytonstone demand often comes from renters and families looking for domestic cleaning, move-out cleaning or one-off deep cleaning.",
    intro: "Need a cleaner in Leytonstone? Quickola helps you compare fair cleaning prices around Leytonstone High Road, Bushwood, Upper Leytonstone, Hollow Ponds and Wanstead Flats.",
  },
  Walthamstow: {
    nearbyAreas: ["Leyton", "Leytonstone", "Hackney", "Wanstead", "Romford"],
    localNeighbourhoods: ["Walthamstow Village", "Blackhorse Road", "Hoe Street", "Wood Street", "Higham Hill", "St James Street"],
    localPriceNote: "Walthamstow can be more expensive than some nearby areas because demand is high around Walthamstow Village, Blackhorse Road and Hoe Street, especially for reliable regular cleaners.",
    localSearchNote: "Walthamstow searches often include regular domestic cleaning, family-home deep cleaning and end of tenancy cleaning around the Village, Blackhorse Road and Wood Street.",
    intro: "Searching for cleaner prices in Walthamstow? Quickola helps you check fair costs around Walthamstow Village, Blackhorse Road, Hoe Street, Wood Street and St James Street.",
  },
  "Bethnal Green": {
    nearbyAreas: ["Whitechapel", "Mile End", "Hackney", "Bow", "Canary Wharf"],
    localNeighbourhoods: ["Bethnal Green Road", "Cambridge Heath", "Roman Road", "Weavers Fields", "Museum Gardens", "Columbia Road"],
    localPriceNote: "Bethnal Green cleaning can cost more than outer East London because of central location, flats, controlled parking and urgent rental turnover around Cambridge Heath and Bethnal Green Road.",
    localSearchNote: "Bethnal Green demand is often from flats, renters, landlords and short-notice move-out cleaning near Cambridge Heath, Roman Road and Columbia Road.",
    intro: "Need a cleaner in Bethnal Green? Quickola helps you check fair cleaning prices around Bethnal Green Road, Cambridge Heath, Roman Road, Weavers Fields and Columbia Road.",
  },
  Whitechapel: {
    nearbyAreas: ["Bethnal Green", "Mile End", "Bow", "Canary Wharf", "Poplar"],
    localNeighbourhoods: ["Whitechapel Road", "Aldgate East", "Royal London Hospital", "Stepney Green", "Commercial Road", "Shadwell"],
    localPriceNote: "Whitechapel cleaning prices are often affected by apartment access, parking, congestion and high rental turnover near Aldgate East, Commercial Road and the Royal London Hospital area.",
    localSearchNote: "Whitechapel searches often involve flat cleaning, end of tenancy cleaning and urgent deep cleaning near Aldgate East, Stepney Green and Commercial Road.",
    intro: "Looking for cleaner prices in Whitechapel? Quickola helps you compare fair costs around Whitechapel Road, Aldgate East, Stepney Green, Commercial Road and Shadwell.",
  },
  "Mile End": {
    nearbyAreas: ["Bow", "Whitechapel", "Bethnal Green", "Poplar", "Canary Wharf"],
    localNeighbourhoods: ["Mile End Road", "Stepney Green", "Tredegar Square", "Queen Mary University", "Bow Road", "Regent's Canal"],
    localPriceNote: "Mile End cleaning demand is often tied to student flats, rented homes and move-out cleans near Queen Mary University, Stepney Green and Bow Road.",
    localSearchNote: "Mile End searches commonly include student flat cleaning, end of tenancy cleaning, regular domestic cleaning and one-off deep cleans.",
    intro: "Need a cleaner in Mile End? Quickola helps you check fair cleaning prices around Mile End Road, Queen Mary University, Stepney Green, Tredegar Square and Bow Road.",
  },
  Hackney: {
    nearbyAreas: ["Bethnal Green", "Bow", "Leyton", "Walthamstow", "Stratford"],
    localNeighbourhoods: ["Hackney Central", "London Fields", "Dalston", "Homerton", "Victoria Park", "Mare Street"],
    localPriceNote: "Hackney cleaning prices can be higher than outer East London because demand is strong around London Fields, Dalston, Hackney Central and Victoria Park.",
    localSearchNote: "Hackney searches often include regular domestic cleaning, flat cleaning, Airbnb-style turnovers and deep cleaning around London Fields, Dalston and Homerton.",
    intro: "Searching for cleaner prices in Hackney? Quickola helps you compare fair cleaning costs around Hackney Central, London Fields, Dalston, Homerton, Victoria Park and Mare Street.",
  },
  Bow: {
    nearbyAreas: ["Mile End", "Stratford", "Bethnal Green", "Poplar", "Hackney"],
    localNeighbourhoods: ["Bow Road", "Roman Road", "Bow Church", "Fish Island", "Old Ford", "Mile End Park"],
    localPriceNote: "Bow cleaning prices vary between flats, terraces and newer developments around Fish Island, Roman Road and Bow Road. Parking and access can affect final quotes.",
    localSearchNote: "Bow searches often include end of tenancy cleaning, flat cleaning and one-off deep cleans near Roman Road, Fish Island and Bow Church.",
    intro: "Need a cleaner in Bow? Quickola helps you check fair cleaning prices around Bow Road, Roman Road, Bow Church, Fish Island, Old Ford and Mile End Park.",
  },
  "Canary Wharf": {
    nearbyAreas: ["Poplar", "Canning Town", "Whitechapel", "Mile End", "Bow"],
    localNeighbourhoods: ["South Quay", "Isle of Dogs", "West India Quay", "Millwall", "Blackwall", "Heron Quays"],
    localPriceNote: "Canary Wharf is usually more expensive than many East London areas because cleaners often deal with high-rise apartments, concierge access, parking limits and premium end of tenancy expectations.",
    localSearchNote: "Canary Wharf searches often involve apartment cleaning, move-out cleaning, deep cleaning and regular cleans around South Quay, Isle of Dogs and West India Quay.",
    intro: "Looking for cleaner prices in Canary Wharf? Quickola helps you check fair costs for apartments around South Quay, Isle of Dogs, West India Quay, Millwall and Blackwall.",
  },
  Poplar: {
    nearbyAreas: ["Canary Wharf", "Canning Town", "Bow", "Mile End", "Whitechapel"],
    localNeighbourhoods: ["Chrisp Street", "Poplar High Street", "All Saints", "Limehouse", "Blackwall", "Aberfeldy Village"],
    localPriceNote: "Poplar cleaning prices can vary between older flats, newer developments and homes close to Canary Wharf, Limehouse and Blackwall.",
    localSearchNote: "Poplar demand often includes flat cleaning, end of tenancy cleans and regular cleaning around Chrisp Street, All Saints and Blackwall.",
    intro: "Need a cleaner in Poplar? Quickola helps you compare fair cleaning prices around Chrisp Street, Poplar High Street, All Saints, Limehouse and Blackwall.",
  },
  "Canning Town": {
    nearbyAreas: ["Poplar", "Canary Wharf", "Plaistow", "East Ham", "Barking"],
    localNeighbourhoods: ["Royal Victoria", "Custom House", "Silvertown", "Barking Road", "Star Lane", "Hallsville Quarter"],
    localPriceNote: "Canning Town prices can rise around newer apartment developments and Royal Victoria, especially for move-out cleaning, balcony cleaning or urgent flat cleans.",
    localSearchNote: "Canning Town searches often come from renters in new builds, landlords and people moving near Royal Victoria, Custom House and Hallsville Quarter.",
    intro: "Searching for cleaner prices in Canning Town? Quickola helps you check fair costs around Royal Victoria, Custom House, Silvertown, Barking Road and Hallsville Quarter.",
  },
  Plaistow: {
    nearbyAreas: ["East Ham", "Canning Town", "Barking", "Forest Gate", "Stratford"],
    localNeighbourhoods: ["Plaistow Station", "Balaam Street", "Green Street", "Upton Park", "Prince Regent Lane", "Newham Way"],
    localPriceNote: "Plaistow cleaning prices are often competitive, but end of tenancy and deep cleaning around shared homes, terraces and rentals can need longer appointments.",
    localSearchNote: "Plaistow demand often includes regular domestic cleaning, deep cleaning and move-out cleaning around Balaam Street, Green Street and Upton Park.",
    intro: "Need a cleaner in Plaistow? Quickola helps you check fair cleaning prices around Plaistow Station, Balaam Street, Green Street, Upton Park and Prince Regent Lane.",
  },
  Wanstead: {
    nearbyAreas: ["Leytonstone", "Ilford", "Forest Gate", "Leyton", "Walthamstow"],
    localNeighbourhoods: ["Wanstead High Street", "Snaresbrook", "Wanstead Park", "Aldersbrook", "Redbridge", "Nightingale Lane"],
    localPriceNote: "Wanstead cleaning prices can be higher than some nearby areas because of larger homes, family properties and demand for reliable regular cleaners around Snaresbrook, Aldersbrook and Wanstead High Street.",
    localSearchNote: "Wanstead searches often involve regular domestic cleaning, family-home deep cleaning and end of tenancy cleaning around Snaresbrook, Aldersbrook and Wanstead Park.",
    intro: "Looking for cleaner prices in Wanstead? Quickola helps you compare fair cleaning costs around Wanstead High Street, Snaresbrook, Wanstead Park, Aldersbrook and Redbridge.",
  },
};

const zonePages: SeoPage[] = [
  {
    slug: "cleaning-east-london",
    title: "Cleaning in East London",
    metaTitle: "Cleaner Prices in East London | Quickola",
    metaDescription: "Check fair cleaner prices in East London before you book. Compare typical costs for domestic, deep and end of tenancy cleaning.",
    h1: "Cleaner prices in East London",
    intro: "See what cleaning should usually cost in East London before you book. Quickola helps you understand a fair price, then helps you get matched with a verified local cleaner.",
    areaType: "zone",
    location: "East London",
    nearbyAreas: ["Ilford", "Barking", "East Ham", "Stratford", "Romford", "Dagenham"],
    localNeighbourhoods: ["Newham", "Redbridge", "Barking and Dagenham", "Waltham Forest", "Tower Hamlets", "Hackney"],
    localPriceNote: "East London cleaning prices are usually cheaper than Central London, but areas with high rental turnover, new-build apartments and parking restrictions can cost more for deep and end of tenancy cleaning.",
    localSearchNote: "East London cleaning searches often come from renters, landlords, families and people moving around Ilford, Barking, East Ham, Stratford, Walthamstow and Canary Wharf.",
    primaryKeyword: "cleaner prices East London",
    secondaryKeywords: ["cleaning services East London", "end of tenancy cleaning East London", "deep cleaning East London"],
    priceGuide: cleaningPriceGuide,
    faqs: [
      {
        question: "How much does a cleaner cost in East London?",
        answer: "Most domestic cleaners in East London charge from around £18 per hour, but the final price depends on the job type, property size, urgency and availability.",
      },
      {
        question: "Can Quickola find me a cleaner in East London?",
        answer: "Yes. Quickola first shows you a fair price range, then helps match you with a suitable verified local cleaner where available.",
      },
    ],
  },
  {
    slug: "cleaning-north-london",
    title: "Cleaning in North London",
    metaTitle: "Cleaner Prices in North London | Quickola",
    metaDescription: "Check fair cleaner prices in North London before booking domestic, deep or end of tenancy cleaning.",
    h1: "Cleaner prices in North London",
    intro: "Check what cleaning should usually cost in North London before you book. Quickola gives you a fair price guide first, then helps you find a suitable local cleaner.",
    areaType: "zone",
    location: "North London",
    nearbyAreas: ["Islington", "Camden", "Enfield", "Tottenham", "Finchley", "Holloway"],
    localNeighbourhoods: ["Camden", "Islington", "Holloway", "Finsbury Park", "Tottenham", "Enfield"],
    localPriceNote: "North London cleaning prices vary widely between flats, family homes and larger properties. Areas closer to Camden, Islington and Finsbury Park can be more expensive than outer North London.",
    localSearchNote: "North London searches often include regular domestic cleaners, end of tenancy cleaning, post-renovation cleaning and one-off deep cleaning.",
    primaryKeyword: "cleaner prices North London",
    secondaryKeywords: ["cleaning services North London", "end of tenancy cleaning North London", "deep cleaning North London"],
    priceGuide: cleaningPriceGuide,
    faqs: [
      {
        question: "How much does cleaning cost in North London?",
        answer: "Domestic cleaning in North London commonly starts from around £18 per hour. Larger cleans, deep cleans and end of tenancy jobs cost more.",
      },
      {
        question: "Does Quickola rank cleaners by who pays?",
        answer: "No. Quickola is built around fair prices, availability and trusted local providers, not paid ranking.",
      },
    ],
  },
  {
    slug: "cleaning-south-london",
    title: "Cleaning in South London",
    metaTitle: "Cleaner Prices in South London | Quickola",
    metaDescription: "See fair cleaner prices in South London before booking regular, deep or end of tenancy cleaning.",
    h1: "Cleaner prices in South London",
    intro: "Use Quickola to understand fair cleaning prices in South London before you book. See typical ranges, then request a trusted local match.",
    areaType: "zone",
    location: "South London",
    nearbyAreas: ["Croydon", "Brixton", "Clapham", "Lewisham", "Wimbledon", "Peckham"],
    localNeighbourhoods: ["Brixton", "Clapham", "Croydon", "Lewisham", "Peckham", "Wimbledon"],
    localPriceNote: "South London prices depend heavily on property size and access. Flats around Brixton, Clapham and Peckham may price differently from larger homes around Wimbledon or Croydon.",
    localSearchNote: "South London searches often include move-out cleaning, domestic cleaners, deep cleaning and landlord-ready end of tenancy cleaning.",
    primaryKeyword: "cleaner prices South London",
    secondaryKeywords: ["cleaning services South London", "end of tenancy cleaning South London", "deep cleaning South London"],
    priceGuide: cleaningPriceGuide,
    faqs: [
      {
        question: "What is a fair cleaner price in South London?",
        answer: "A regular cleaner will often start from around £18 per hour, while deep cleans and end of tenancy cleaning are usually quoted as fixed prices.",
      },
      {
        question: "Can I check the price before booking?",
        answer: "Yes. Quickola is price-first, so you can check the likely fair range before asking for a cleaner match.",
      },
    ],
  },
  {
    slug: "cleaning-west-london",
    title: "Cleaning in West London",
    metaTitle: "Cleaner Prices in West London | Quickola",
    metaDescription: "Check fair cleaner prices in West London for domestic cleaning, deep cleaning and end of tenancy cleaning.",
    h1: "Cleaner prices in West London",
    intro: "See typical cleaner prices in West London before you book. Quickola helps you avoid guessing the cost and find a suitable local provider.",
    areaType: "zone",
    location: "West London",
    nearbyAreas: ["Ealing", "Hammersmith", "Chiswick", "Acton", "Hounslow", "Kensington"],
    localNeighbourhoods: ["Ealing", "Hammersmith", "Chiswick", "Acton", "Hounslow", "Kensington"],
    localPriceNote: "West London cleaning can be more expensive in areas with larger homes, premium apartments and strict access or parking rules, especially around Chiswick, Kensington and Hammersmith.",
    localSearchNote: "West London searches often include premium domestic cleaning, end of tenancy cleaning, family-home deep cleaning and regular weekly cleaners.",
    primaryKeyword: "cleaner prices West London",
    secondaryKeywords: ["cleaning services West London", "end of tenancy cleaning West London", "deep cleaning West London"],
    priceGuide: cleaningPriceGuide,
    faqs: [
      {
        question: "Are cleaners more expensive in West London?",
        answer: "Some West London areas can be more expensive, especially for larger homes, short notice jobs and premium end of tenancy cleaning.",
      },
      {
        question: "What does Quickola do?",
        answer: "Quickola shows a fair price guide first, then helps you get matched with a local cleaner where available.",
      },
    ],
  },
];

const eastLondonAreas = [
  "Ilford",
  "Barking",
  "East Ham",
  "Stratford",
  "Romford",
  "Dagenham",
  "Forest Gate",
  "Leyton",
  "Leytonstone",
  "Walthamstow",
  "Bethnal Green",
  "Whitechapel",
  "Mile End",
  "Hackney",
  "Bow",
  "Canary Wharf",
  "Poplar",
  "Canning Town",
  "Plaistow",
  "Wanstead",
];

function toSlug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const areaPages: SeoPage[] = eastLondonAreas.map((area) => ({
  slug: `cleaning-${toSlug(area)}`,
  title: `Cleaning in ${area}`,
  metaTitle: `Cleaner Prices in ${area} | Quickola`,
  metaDescription: `Check fair cleaner prices in ${area} before you book. See typical costs for domestic, deep and end of tenancy cleaning.`,
  h1: `Cleaner prices in ${area}`,
  intro: eastLondonAreaDetails[area]?.intro ?? `Looking for a cleaner in ${area}? Quickola helps you check what the job should usually cost before you book, then helps you get matched with a verified local cleaner where available.`,
  areaType: "area",
  location: area,
  parentLocation: "East London",
  nearbyAreas: eastLondonAreaDetails[area]?.nearbyAreas ?? [],
  localNeighbourhoods: eastLondonAreaDetails[area]?.localNeighbourhoods ?? [],
  localPriceNote: eastLondonAreaDetails[area]?.localPriceNote,
  localSearchNote: eastLondonAreaDetails[area]?.localSearchNote,
  primaryKeyword: `cleaner prices ${area}`,
  secondaryKeywords: [`cleaning services ${area}`, `end of tenancy cleaning ${area}`, `deep cleaning ${area}`],
  priceGuide: cleaningPriceGuide,
  faqs: [
    {
      question: `How much does a cleaner cost in ${area}?`,
      answer: `Most regular cleaners in ${area} start from around £18 per hour. Deep cleaning and end of tenancy cleaning are usually fixed-price jobs based on property size and condition.`,
    },
    {
      question: `Can Quickola help me find a cleaner in ${area}?`,
      answer: `Yes. Quickola shows a fair price guide first, then helps match you with a suitable local cleaner where available.`,
    },
  ],
}));

export const seoPages: SeoPage[] = [
  {
    slug: "cleaning-london",
    title: "Cleaning in London",
    metaTitle: "Cleaner Prices in London | Quickola",
    metaDescription: "Check fair cleaner prices in London before you book. Compare typical costs for domestic cleaning, deep cleaning and end of tenancy cleaning.",
    h1: "Cleaner prices in London",
    intro: "Know what cleaning should usually cost in London before you book. Quickola shows fair price ranges first, then helps you get matched with a trusted local cleaner.",
    areaType: "city",
    location: "London",
    nearbyAreas: ["East London", "North London", "South London", "West London"],
    localNeighbourhoods: ["East London", "North London", "South London", "West London", "Central London", "Greater London"],
    localPriceNote: "London cleaning prices vary massively by area. Central and premium areas are usually more expensive, while outer London can be better value, especially for regular domestic cleaning.",
    localSearchNote: "London cleaning searches usually split into regular domestic cleaning, end of tenancy cleaning, deep cleaning, move-in cleaning and urgent same-day cleaning.",
    primaryKeyword: "cleaner prices London",
    secondaryKeywords: ["cleaning services London", "end of tenancy cleaning London", "deep cleaning London", "domestic cleaners London"],
    priceGuide: cleaningPriceGuide,
    faqs: [
      {
        question: "How much does a cleaner cost in London?",
        answer: "Regular domestic cleaning in London often starts from around £18 per hour. Deep cleaning and end of tenancy cleaning usually cost more because they take longer and require more detailed work.",
      },
      {
        question: "What is the cheapest way to book a cleaner in London?",
        answer: "The safest way is not always the cheapest quote. Check the fair price range first, then choose a cleaner based on trust, availability, reviews and clear pricing.",
      },
      {
        question: "Does Quickola show paid rankings?",
        answer: "No. Quickola is built to help people understand fair prices and find suitable local providers, not to sell top positions to businesses.",
      },
    ],
  },
  ...zonePages,
  ...areaPages,
];

export const seoPagesBySlug = seoPages.reduce<Record<string, SeoPage>>((acc, page) => {
  acc[page.slug] = page;
  return acc;
}, {});

export function getSeoPageBySlug(slug: string) {
  return seoPagesBySlug[slug];
}

export function getAllSeoSlugs() {
  return seoPages.map((page) => page.slug);
}