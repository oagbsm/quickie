type ServiceKey = string;

export type CostGuideRow = {
  label: string;
  price: string;
  average?: string;
  included?: string;
  note?: string;
};

export type CostGuideSection = {
  title: string;
  intro?: string;
  rows?: CostGuideRow[];
  bullets?: string[];
  warning?: string;
};

export type CostGuideFaq = {
  question: string;
  answer: string;
};

export type PriceConfig = {
  label: string;
  from: string;
  suffix?: string;
  note: string;
  resultRows?: {
    label: string;
    price: string;
  }[];
  headline?: string;
  subheadline?: string;
  costGuide?: {
    title: string;
    updatedLabel?: string;
    sourceLabel?: string;
    sections: CostGuideSection[];
    faqs?: CostGuideFaq[];
  };
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

const plumberCostGuide: PriceConfig["costGuide"] = {
  title: "Plumber cost guide in Slough",
  updatedLabel: "Prices updated: June 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough pricing checks.",
  sections: [
    {
      title: "Typical plumber costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on the exact fault, access, parts and urgency.",
      rows: [
        { label: "Hourly plumber rate", price: "£45 – £75 / hour", average: "Around £60", included: "Normal-hours labour for small plumbing jobs." },
        { label: "Plumber day rate", price: "£300 – £450 / day", average: "Around £375", included: "Larger plumbing jobs where a full day is needed." },
        { label: "Standard call-out", price: "£80 – £140", average: "Around £110", included: "Weekday daytime visit before parts or extra labour." },
        { label: "Emergency call-out", price: "£120 – £250", average: "Around £170", included: "Urgent, evening, weekend or out-of-hours attendance." },
        { label: "Emergency hourly rate", price: "£90 – £160 / hour", average: "Around £120", included: "Higher-rate urgent labour after the call-out." },
      ],
    },
    {
      title: "Common plumbing jobs and typical costs",
      intro: "These are typical local ranges for common jobs. Parts, VAT and access problems can change the final price.",
      rows: [
        { label: "Fix a leaking pipe", price: "£80 – £180", average: "Around £120", included: "Minor visible leak with standard access." },
        { label: "Unblock a toilet", price: "£90 – £220", average: "Around £140", included: "Standard toilet blockage, no major drainage work." },
        { label: "Unblock a sink", price: "£90 – £200", average: "Around £130", included: "Standard sink blockage." },
        { label: "Tap repair or replacement", price: "£70 – £160", average: "Around £110", included: "Basic repair or fitting, parts extra if needed." },
        { label: "Repair a burst pipe", price: "£100 – £260", average: "Around £170", included: "Visible pipe repair. Emergency timing may add more." },
        { label: "Install a radiator", price: "£150 – £300", average: "Around £220", included: "Standard radiator installation, radiator usually extra." },
        { label: "Replace a water tank", price: "£360 – £600", average: "Around £480", included: "Labour guide. Tank type and access affect price." },
        { label: "Boiler or heating fault", price: "£90 – £240", average: "Around £160", included: "Diagnostics or small repair. Gas Safe work may be needed." },
      ],
    },
    {
      title: "What should be included in a plumber quote?",
      bullets: [
        "Labour cost, including hourly rate, day rate or fixed job price.",
        "Any call-out fee before the plumber starts work.",
        "Parts and materials, including whether they are included or charged separately.",
        "VAT if the plumber or company is VAT-registered.",
        "Basic testing after the repair or installation.",
        "Any guarantee, warranty or follow-up terms.",
        "Whether clean-up or waste removal is included.",
      ],
    },
    {
      title: "Hidden costs to watch out for",
      bullets: [
        "Replacement parts that were not included in the first quote.",
        "Emergency or out-of-hours rate increases.",
        "Parking, congestion, travel or access charges.",
        "Extra time if the issue is behind walls, under floors or hard to reach.",
        "Multiple trades needed for larger jobs, such as tiling, electrics or decorating after plumbing work.",
      ],
    },
    {
      title: "What affects plumber prices?",
      bullets: [
        "Type of job: simple repairs usually cost less than installations or replacements.",
        "Urgency: today, evening, weekend and emergency jobs usually cost more.",
        "Parts and materials: branded or specialist parts can increase the price.",
        "Access: hidden pipes, tight spaces and difficult parking can add time.",
        "Time on site: longer jobs raise labour costs.",
        "Repair vs replacement: replacing systems or parts usually costs more than small repairs.",
        "Location: prices vary by area, demand and provider availability.",
      ],
    },
    {
      title: "When to DIY vs hire a plumber",
      intro: "Small DIY jobs can be fine if you are confident, but mistakes can become expensive quickly.",
      bullets: [
        "DIY may be suitable for simple jobs like tightening a loose fitting, replacing a washer or using a plunger.",
        "Hire a plumber for leaks, toilets, pipework, radiators, heating issues, hidden faults or anything that could cause water damage.",
        "Use a qualified professional for safety, compliance, testing and a clearer guarantee on the work.",
      ],
      warning: "If in doubt, get it checked. Water damage can cost far more than the original plumbing repair.",
    },
    {
      title: "Red flags before booking a plumber",
      bullets: [
        "No clear call-out fee before they attend.",
        "No reviews, company details or proof of previous work.",
        "Pressure to pay cash with no receipt.",
        "Refusing to explain what is included in the quote.",
        "Price changing heavily after arrival without a clear reason.",
        "No confirmation of parts, VAT or emergency rates.",
      ],
    },
    {
      title: "Quickola plumbing checklist",
      bullets: [
        "Check the fair local price before you say yes.",
        "Ask whether the call-out fee is included.",
        "Ask whether parts and VAT are included.",
        "Ask if the price changes for evening, weekend or emergency work.",
        "Check reviews or proof of previous plumbing jobs.",
        "Get the agreed price or price range in writing where possible.",
      ],
    },
  ],
  faqs: [
    { question: "How much does a plumber charge per hour in Slough?", answer: "A typical local plumber may charge around £45–£75 per hour in normal hours. Emergency or out-of-hours work can cost more." },
    { question: "Do plumbers charge a call-out fee?", answer: "Many plumbers charge a call-out fee, especially for urgent jobs. Always confirm the call-out fee and what it includes before booking." },
    { question: "How much should an emergency plumber cost?", answer: "Emergency plumber call-outs commonly sit around £120–£250 before any larger parts or extra repair work. Timing, urgency and access can increase the final price." },
    { question: "Is a day rate cheaper than hourly plumbing?", answer: "For bigger jobs, a day rate can work out better than hourly pricing. For small repairs, a fixed job price or hourly rate may be more suitable." },
    { question: "Can Quickola find me a plumber?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local provider if you want help booking." },
  ],
};

const gardenerCostGuide: PriceConfig["costGuide"] = {
  title: "Gardener cost guide in Slough",
  updatedLabel: "Prices updated: March 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough gardening price checks.",
  sections: [
    {
      title: "Typical gardener costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on garden size, access, waste, season and the type of work needed.",
      rows: [
        { label: "Gardener hourly rate", price: "£25 – £45 / hour", average: "Around £35", included: "General garden maintenance, mowing, pruning, weeding or tidy-ups." },
        { label: "Gardener day rate", price: "£150 – £220 / day", average: "Around £180", included: "Larger garden tidy-ups or a full day of maintenance work." },
        { label: "Landscape gardener day rate", price: "£180 – £300 / day", average: "Around £240", included: "More skilled garden projects, design or heavier outdoor work." },
        { label: "Small garden tidy", price: "£60 – £120", average: "Around £90", included: "Light mowing, weeding, pruning or general tidy-up." },
        { label: "Overgrown garden clearance", price: "£150 – £450+", average: "Around £250", included: "Heavy cutting back, bagging waste, clearing weeds and larger tidy-ups." },
      ],
    },
    {
      title: "Common gardening jobs and typical costs",
      intro: "These are common gardener jobs around Slough. Waste removal, access problems and heavy overgrowth can increase the final price.",
      rows: [
        { label: "Grass cutting", price: "£30 – £70", average: "Around £45", included: "Small to medium lawn cut and basic edging." },
        { label: "Weeding", price: "£30 – £90", average: "Around £55", included: "Beds, borders or paved areas depending on weed level." },
        { label: "Hedge trimming", price: "£70 – £180", average: "Around £120", included: "Standard hedge trim. Height, width and waste can add more." },
        { label: "Garden maintenance visit", price: "£50 – £120", average: "Around £80", included: "Regular maintenance visit for mowing, pruning and tidy-up." },
        { label: "Garden waste removal", price: "£40 – £160+", average: "Around £90", included: "Green waste disposal after gardening work." },
        { label: "Planting or seasonal work", price: "£60 – £180", average: "Around £110", included: "Planting, pruning, deadheading or seasonal preparation." },
        { label: "Small landscaping job", price: "£250 – £2,500+", average: "Varies", included: "Design, turfing, patio, fencing, decking or larger garden changes." },
      ],
    },
    {
      title: "What affects gardener prices?",
      bullets: [
        "Garden size: bigger gardens usually take longer and cost more.",
        "Type of work: simple mowing costs less than heavy clearance, hedge cutting or landscaping.",
        "Garden condition: overgrown gardens take more time, tools and waste removal.",
        "Access: narrow entrances, stairs, no parking or difficult rear access can increase labour time.",
        "Waste removal: green waste disposal may be charged separately.",
        "Season: spring and summer demand can push prices higher.",
        "Number of gardeners: larger jobs may need two people, which changes the total price.",
      ],
    },
    {
      title: "Gardener vs landscape gardener",
      intro: "A gardener usually handles maintenance. A landscape gardener usually handles larger design or build projects.",
      bullets: [
        "Choose a gardener for mowing, pruning, weeding, planting, hedge trimming and regular maintenance.",
        "Choose a landscape gardener for patios, decking, fencing, turfing, garden redesigns or larger structural work.",
        "If the job involves heavy building, drainage, electrics or major changes, extra trades may be needed.",
      ],
    },
    {
      title: "What should be included in a gardener quote?",
      bullets: [
        "Hourly, day-rate or fixed job price.",
        "What tasks are included, such as mowing, weeding, hedge trimming or pruning.",
        "Whether green waste removal is included or charged separately.",
        "How many gardeners will attend.",
        "How long the job is expected to take.",
        "Whether tools and equipment are included.",
        "Any VAT, parking or disposal charges.",
      ],
    },
    {
      title: "When to DIY vs hire a gardener",
      intro: "DIY can make sense for light maintenance if you have the tools and time, but larger or overgrown jobs can quickly become difficult.",
      bullets: [
        "DIY may be suitable for basic mowing, light weeding, watering or small planting jobs.",
        "Hire a gardener for heavy pruning, hedge cutting, overgrown gardens, garden clearance or regular maintenance.",
        "Hire a specialist for landscaping, patios, decking, fencing, turfing or moving trees and heavy materials.",
      ],
      warning: "If the job needs ladders, sharp tools, heavy waste or specialist equipment, it is usually safer to hire someone experienced.",
    },
    {
      title: "Red flags before booking a gardener",
      bullets: [
        "No clear hourly rate, day rate or fixed price before starting.",
        "No explanation of whether waste removal is included.",
        "Very low quote for a heavily overgrown garden without seeing photos.",
        "No reviews, proof of work or clear contact details.",
        "Price changes after arrival without a clear reason.",
        "No agreement on what will actually be completed during the visit.",
      ],
    },
    {
      title: "Quickola gardening checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Send garden photos before agreeing a price.",
        "Ask whether green waste removal is included.",
        "Ask if the gardener charges hourly, daily or per job.",
        "Confirm access, parking and whether tools are included.",
        "For regular work, agree the visit length and frequency in advance.",
      ],
    },
  ],
  faqs: [
    { question: "How much does a gardener charge per hour in Slough?", answer: "A typical local gardener may charge around £25–£45 per hour for standard maintenance. Bigger or more specialist jobs can cost more." },
    { question: "How much does a gardener charge per day?", answer: "A gardener day rate commonly sits around £150–£220 for normal maintenance work. Landscape gardening or heavier outdoor projects may cost more." },
    { question: "How much does grass cutting cost?", answer: "Small to medium grass cutting jobs may sit around £30–£70, depending on lawn size, edging, access and whether waste is taken away." },
    { question: "Is garden waste removal included?", answer: "Not always. Some gardeners include green waste removal, while others charge extra for bags, disposal or larger clearances. Confirm this before booking." },
    { question: "Can Quickola find me a gardener?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local gardener if you want help booking." },
  ],
};

const cleanerCostGuide: PriceConfig["costGuide"] = {
  title: "House cleaning cost guide in Slough",
  updatedLabel: "Prices updated: April 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough cleaning price checks.",
  sections: [
    {
      title: "Typical cleaner costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on property size, clean type, condition, supplies and booking frequency.",
      rows: [
        { label: "Independent cleaner", price: "£20 – £30 / hour", average: "Around £25", included: "Regular domestic cleaning, usually paid hourly." },
        { label: "Cleaning agency", price: "£25 – £35 / hour", average: "Around £30", included: "Agency cleaner with wider availability and admin support." },
        { label: "Weekly cleaner", price: "£60 – £90", average: "Around £75", included: "Typical 3-hour weekly clean." },
        { label: "One-off deep clean", price: "£100 – £300", average: "Around £180", included: "More detailed clean for kitchens, bathrooms, skirting and build-up. Final price confirmed after a quick assessment." },
        { label: "End of tenancy clean", price: "£140 – £500+", average: "Around £300", included: "Move-out clean, often more detailed and property-size dependent." },
      ],
    },
    {
      title: "Common cleaning jobs and typical costs",
      intro: "These are common cleaning jobs around Slough. Specialist tasks such as carpets, windows or post-building work may be priced separately.",
      rows: [
        { label: "Regular house clean", price: "£45 – £90", average: "Around £75", included: "Usually 2–3 hours depending on rooms and condition." },
        { label: "Deep clean", price: "£100 – £300", average: "Around £180", included: "A more detailed one-off clean for a property that needs more work. Final price confirmed after a quick assessment." },
        { label: "Post-building clean", price: "£30 – £40 / hour", average: "Around £35", included: "Dust, debris and after-renovation clean-up." },
        { label: "Carpet cleaning small room", price: "£50 – £80", average: "Around £65", included: "Usually charged separately from general house cleaning." },
        { label: "Window cleaning", price: "£20 – £70", average: "Around £45", included: "Depends on window count, access and inside/outside cleaning." },
        { label: "Upholstery or sofa clean", price: "£50 – £90+", average: "Around £60", included: "Specialist cleaning, often priced separately." },
      ],
    },
    {
      title: "What affects house cleaning prices?",
      bullets: [
        "Type of clean: regular cleaning is usually cheaper than deep, end-of-tenancy or post-building cleaning.",
        "Property size: larger homes need more time and usually cost more.",
        "Property condition: clutter, heavy build-up, pet hair or stains can add time.",
        "Frequency: weekly cleaning can work out better value than occasional catch-up cleans.",
        "Independent vs agency: independent cleaners can be cheaper, while agencies may offer more availability.",
        "Supplies and equipment: some cleaners bring products, while others expect you to provide them.",
        "Specialist tasks: carpets, windows, ovens, upholstery and stains may be charged separately.",
      ],
    },
    {
      title: "What should be included in a cleaning quote?",
      bullets: [
        "Whether the price is hourly or fixed.",
        "Which rooms are included.",
        "How many hours are included.",
        "Whether products and equipment are included.",
        "Whether specialist tasks are included or extra.",
        "Any minimum booking, call-out or travel fee.",
        "What is excluded from the clean.",
      ],
    },
    {
      title: "Extra costs to watch out for",
      bullets: [
        "Minimum booking times or call-out fees.",
        "Pet hair or heavy dirt that makes the job take longer.",
        "Stain removal or specialist products.",
        "Carpet, upholstery or window cleaning charged separately.",
        "Supplying products, equipment or parking costs.",
      ],
    },
    {
      title: "How long does house cleaning take?",
      bullets: [
        "A regular weekly clean is often around 2–3 hours.",
        "A larger home may need 4+ hours depending on what is included.",
        "End-of-tenancy and post-building cleans usually take longer.",
        "A cleaner may suggest a deep clean first before starting regular visits.",
      ],
    },
    {
      title: "When to DIY vs hire a cleaner",
      intro: "DIY is cheapest financially, but it is not always realistic if you are short on time or the job needs specialist work.",
      bullets: [
        "DIY may be fine for light weekly cleaning if you have time and supplies.",
        "Hire a cleaner if you are struggling to keep on top of regular cleaning.",
        "Hire a cleaner for moving out, post-building work, deep cleaning, carpet cleaning or specialist stains.",
      ],
      warning: "Specialist cleans often need better equipment, products and time than a normal weekly clean.",
    },
    {
      title: "Red flags before booking a cleaner",
      bullets: [
        "No clear hourly rate, fixed price or minimum booking time.",
        "No explanation of what rooms or tasks are included.",
        "No agreement on whether products and equipment are included.",
        "Very low quote for a large or dirty property without asking questions.",
        "No reviews, proof of work or clear contact details.",
        "Price changes after arrival without a clear reason.",
      ],
    },
    {
      title: "Quickola cleaning checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Decide whether you need regular cleaning, a deep clean or a move-out clean.",
        "Ask whether products and equipment are included.",
        "Mention pets, stains, clutter or specialist cleaning needs upfront.",
        "Ask whether there is a minimum booking time.",
        "Confirm exactly what is and is not included before the cleaner arrives.",
      ],
    },
  ],
  faqs: [
    { question: "How much do cleaners charge per hour in Slough?", answer: "A typical cleaner may charge around £20–£30 per hour independently, while agency cleaning can sit around £25–£35 per hour depending on availability and service level." },
    { question: "How much does a weekly cleaner cost?", answer: "A weekly cleaner commonly costs around £60–£90 for a 2–3 hour visit, with many households paying around £75 for a typical weekly clean." },
    { question: "Is an independent cleaner cheaper than an agency?", answer: "Often yes. Independent cleaners can be cheaper per hour, while agencies may offer more cover, admin support and availability." },
    { question: "How much does an end of tenancy clean cost?", answer: "An end of tenancy clean can range from around £140–£500+ depending on property size, condition, bathrooms, appliances and extras." },
    { question: "Do cleaners bring their own products?", answer: "Some cleaners bring products and equipment, while others use what you provide. Confirm this before booking." },
    { question: "Can Quickola find me a cleaner?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local cleaner if you want help booking." },
  ],
};

const painterDecoratorCostGuide: PriceConfig["costGuide"] = {
  title: "Painter and decorator cost guide in Slough",
  updatedLabel: "Prices updated: June 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough painting and decorating price checks.",
  sections: [
    {
      title: "Typical painter and decorator costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on room size, wall condition, prep work, paint choice and whether the job is internal or external.",
      rows: [
        { label: "Painter day rate", price: "£250 – £400 / day", average: "Around £325", included: "Labour for a professional painter and decorator." },
        { label: "Small room", price: "£300 – £450", average: "Around £350", included: "A smaller room with standard prep and trade paint." },
        { label: "Medium room", price: "£400 – £650", average: "Around £450", included: "Typical bedroom or living room with standard paint." },
        { label: "Large room", price: "£700 – £1,200+", average: "Around £1,000", included: "Large room, more wall area or extra prep work." },
        { label: "Hallway, stairs and landing", price: "£1,200 – £1,900", average: "Around £1,600", included: "Higher access, more cutting-in and detailed areas." },
      ],
    },
    {
      title: "Common painting and decorating jobs",
      intro: "These are common painting and decorating jobs around Slough. Premium paint, wallpaper, repairs and difficult access can increase the final quote.",
      rows: [
        { label: "Painting walls", price: "£10 – £20 / m²", average: "Around £15", included: "Internal wall painting, usually with standard trade paint." },
        { label: "Painting ceilings", price: "£10 – £20 / m²", average: "Around £15", included: "Ceiling painting, prep dependent." },
        { label: "Painting woodwork", price: "£10 – £20 / m²", average: "Around £15", included: "Skirting boards, frames or trim depending on scope." },
        { label: "Painting a door", price: "£80 – £110", average: "Around £90", included: "Both sides of a standard internal door." },
        { label: "Wallpapering labour", price: "£12 – £18 / m²", average: "Around £15", included: "Labour only. Wallpaper usually costs extra." },
        { label: "Wallpapering a room", price: "£350 – £550", average: "Around £450", included: "Labour guide for a typical room, wallpaper extra." },
        { label: "Exterior painting 3-bed semi", price: "£1,100 – £1,600", average: "Around £1,300", included: "External paintwork, access and condition dependent." },
        { label: "Exterior painting 4-bed detached", price: "£1,750 – £2,700", average: "Around £2,000", included: "Larger external painting project." },
      ],
    },
    {
      title: "What affects painting and decorating prices?",
      bullets: [
        "Room size: larger rooms have more wall area, more paint and more labour.",
        "Surface condition: cracks, holes, flaking paint or old wallpaper can add prep time.",
        "Number of rooms: multiple rooms cost more overall but can be better value if done together.",
        "Paint type: premium brands and specialist finishes usually cost more than standard trade paint.",
        "Access: high ceilings, staircases, awkward corners and exterior work can increase labour time.",
        "Woodwork and details: doors, skirting, frames, radiators and spindles add extra work.",
        "Location and availability: local demand and painter availability can affect the final quote.",
      ],
    },
    {
      title: "What should be included in a decorator quote?",
      bullets: [
        "Labour cost, including day rate or fixed project price.",
        "Whether paint and materials are included or charged separately.",
        "What preparation is included, such as filling, sanding and masking.",
        "Which rooms, walls, ceilings, doors and woodwork are included.",
        "Whether furniture moving and floor protection are included.",
        "Any VAT, parking, access or disposal charges.",
        "Clean-up and how the room will be left after completion.",
      ],
    },
    {
      title: "Hidden costs to watch out for",
      bullets: [
        "Premium paint brands costing more than standard trade paint.",
        "Wallpaper removal or wall repairs before painting.",
        "Plastering or skimming if walls are in poor condition.",
        "Extra coats if covering dark colours or stains.",
        "High ceilings, staircases, scaffolding or exterior access equipment.",
        "Painting doors, radiators, skirting and woodwork separately from walls.",
      ],
    },
    {
      title: "When to DIY vs hire a painter",
      intro: "DIY can be cheaper, but a professional finish often saves time and avoids messy mistakes.",
      bullets: [
        "DIY may be suitable for a small simple room if walls are already in good condition.",
        "Hire a painter for feature rooms, multiple rooms, hallways, staircases, exterior work or poor wall condition.",
        "Hire a professional if you want faster work, better preparation, clean lines and a longer-lasting finish.",
      ],
      warning: "Poor preparation is one of the biggest reasons DIY paint jobs look bad or fail early.",
    },
    {
      title: "Red flags before booking a painter",
      bullets: [
        "No clear breakdown of labour, paint and preparation.",
        "Very low quote without seeing room size or wall condition.",
        "No explanation of how many coats are included.",
        "No reviews, photos or proof of previous work.",
        "No agreement on whether paint, protection and clean-up are included.",
        "Price changes after arrival without a clear reason.",
      ],
    },
    {
      title: "Quickola painting checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Send photos of the room, walls, ceiling and woodwork.",
        "Ask whether paint and materials are included.",
        "Ask how many coats are included.",
        "Confirm whether prep work, filling and sanding are included.",
        "Ask whether furniture protection and clean-up are included.",
      ],
    },
  ],
  faqs: [
    { question: "How much does a painter charge per day in Slough?", answer: "A typical painter and decorator day rate may sit around £250–£400 per day, with many jobs averaging around £325 depending on experience, availability and job complexity." },
    { question: "How much does it cost to paint a room?", answer: "A small room may cost around £300–£450, while a medium room can sit around £400–£650. Large rooms or poor wall condition can cost more." },
    { question: "Is paint included in the quote?", answer: "Sometimes. Some painters include standard trade paint, while premium paint brands or specialist finishes may cost extra. Confirm this before booking." },
    { question: "Do painters charge by room, day or project?", answer: "It depends on the job. Small work may be quoted per room, larger jobs may use day rates or a fixed project price." },
    { question: "Can Quickola find me a painter?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local painter or decorator if you want help booking." },
  ],
};

const locksmithCostGuide: PriceConfig["costGuide"] = {
  title: "Locksmith cost guide in Slough",
  updatedLabel: "Prices updated: May 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough locksmith price checks.",
  sections: [
    {
      title: "Typical locksmith costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on lock type, parts, time of day, urgency and whether the locksmith can gain entry without damage.",
      rows: [
        { label: "Standard locksmith hourly rate", price: "£60 – £80 / hour", average: "Around £65", included: "Daytime labour during normal working hours." },
        { label: "Emergency call-out fee", price: "£50 – £150", average: "Around £100", included: "Urgent attendance, usually before labour and parts." },
        { label: "Emergency hourly rate", price: "£80 – £200 / hour", average: "Around £140", included: "Evening, overnight, weekend or urgent locksmith work." },
        { label: "Regain entry", price: "£90 – £140", average: "Around £110", included: "Getting back into the property where possible without replacing the lock." },
        { label: "Emergency boarding up", price: "£180 – £250", average: "Around £200", included: "Temporary security after forced entry, burglary or damage." },
      ],
    },
    {
      title: "Common locksmith jobs and typical costs",
      intro: "These are common locksmith jobs around Slough. Specialist locks, extra keys, broken mechanisms and out-of-hours work can increase the final quote.",
      rows: [
        { label: "Change a Yale lock", price: "£90 – £120", average: "Around £100", included: "Labour and standard lock replacement during normal hours." },
        { label: "Standard uPVC lock replacement", price: "£100 – £150", average: "Around £125", included: "Standard uPVC door lock replacement." },
        { label: "Anti-snap uPVC lock replacement", price: "£125 – £175", average: "Around £150", included: "Security upgrade for uPVC doors." },
        { label: "Replace mortice lock", price: "£115 – £165", average: "Around £140", included: "Mortice lock replacement for timber-style doors." },
        { label: "Replace nightlatch", price: "£85 – £110", average: "Around £90", included: "Nightlatch replacement, lock type dependent." },
        { label: "Rim cylinder replacement", price: "£70 – £90", average: "Around £75", included: "Cylinder replacement where the rest of the lock is usable." },
        { label: "Broken key extraction", price: "£80 – £110", average: "Around £90", included: "Removing a snapped key without replacing the cylinder where possible." },
        { label: "Change all locks", price: "£400 – £600+", average: "Around £500", included: "Multiple exterior doors and window locks, depending on property." },
      ],
    },
    {
      title: "Out-of-hours locksmith rates",
      intro: "Locksmith prices can rise quickly outside normal hours. Always confirm the call-out fee and hourly rate before agreeing.",
      rows: [
        { label: "Daytime 8am–6pm", price: "£60 – £80 / hour", average: "Around £65", included: "Normal working hours." },
        { label: "Early morning / evening", price: "£70 – £90 / hour", average: "Around £75", included: "Around 6am–8am or 6pm–8pm." },
        { label: "Late evening", price: "£80 – £120 / hour", average: "Around £85", included: "Around 8pm to midnight." },
        { label: "Overnight", price: "£100 – £200 / hour", average: "Around £120", included: "Midnight to early morning emergency work." },
      ],
    },
    {
      title: "What affects locksmith prices?",
      bullets: [
        "Type of lock: high-security, anti-snap or specialist locks usually cost more.",
        "Time of day: evening, overnight, weekend and emergency call-outs cost more.",
        "Parts needed: cylinders, handles, mechanisms and extra keys can increase the final price.",
        "Whether damage is needed: non-destructive entry is usually cheaper than drilling or replacing locks.",
        "Number of locks: changing multiple locks naturally increases labour and material costs.",
        "Security standard: insurance-approved locks may cost more but can be important for compliance.",
        "Location and availability: prices can be higher when fewer locksmiths are available quickly.",
      ],
    },
    {
      title: "What should be included in a locksmith quote?",
      bullets: [
        "Call-out fee and whether it is separate from labour.",
        "Hourly rate or fixed job price.",
        "Lock type, parts and whether replacement parts are included.",
        "VAT if applicable.",
        "Whether emergency or out-of-hours rates apply.",
        "Whether the quote is fixed or estimated.",
        "What is excluded, such as extra keys, upgrades or boarding up.",
      ],
    },
    {
      title: "Extra locksmith costs to watch out for",
      bullets: [
        "Emergency call-out fees before any work starts.",
        "Replacement cylinders, mechanisms, handles or security upgrades.",
        "Extra labour time if the lock is damaged or hard to access.",
        "Boarding up after forced entry or burglary damage.",
        "VAT, extra key copies and additional security hardware.",
        "Charges rising sharply for overnight or weekend call-outs.",
      ],
    },
    {
      title: "When to DIY vs hire a locksmith",
      intro: "Some simple lock changes are DIY-friendly, but external doors and insurance-approved locks are easy to get wrong.",
      bullets: [
        "DIY may be suitable for simple internal locks if you are confident and have the correct size.",
        "Hire a locksmith if you are locked out, the key is snapped, the lock is stiff, or the door is external.",
        "Hire a locksmith after moving home, losing keys, burglary, forced entry or when upgrading home security.",
        "Use a professional if your insurance requires a certain lock standard.",
      ],
      warning: "A badly fitted lock can reduce security and may affect insurance compliance.",
    },
    {
      title: "Red flags before booking a locksmith",
      bullets: [
        "Only quoting a cheap call-out fee without mentioning labour or parts.",
        "No clear emergency or out-of-hours rate before attendance.",
        "Pressure to drill or replace the lock without explaining non-destructive options.",
        "No reviews, company details or proof of locksmith experience.",
        "Refusing to explain what lock type or security standard is being fitted.",
        "Price changing heavily after arrival without a clear reason.",
      ],
    },
    {
      title: "Quickola locksmith checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Confirm the call-out fee before the locksmith attends.",
        "Ask whether labour, parts and VAT are included.",
        "Ask whether emergency or out-of-hours rates apply.",
        "Ask what type of lock is being fitted and whether it meets your needs.",
        "Get the agreed price or price range in writing where possible.",
      ],
    },
  ],
  faqs: [
    { question: "How much does a locksmith charge per hour in Slough?", answer: "A typical daytime locksmith rate may sit around £60–£80 per hour. Evening, overnight and emergency work can cost more." },
    { question: "How much does an emergency locksmith cost?", answer: "Emergency locksmith call-outs often include a call-out fee of around £50–£150, plus labour and any replacement parts needed." },
    { question: "How much does it cost to change a front door lock?", answer: "Changing a Yale-style lock may cost around £90–£120, while uPVC lock replacement can sit around £100–£175 depending on the lock type and security level." },
    { question: "Can a locksmith open a locked door without damage?", answer: "Often yes, depending on the lock and situation. A good locksmith should explain whether non-destructive entry is possible before drilling or replacing the lock." },
    { question: "Can Quickola find me a locksmith?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local locksmith if you want help booking." },
  ],
};

const manAndVanCostGuide: PriceConfig["costGuide"] = {
  title: "Man and van cost guide in Slough",
  updatedLabel: "Prices updated: May 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough man and van price checks.",
  sections: [
    {
      title: "Typical man and van costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on van size, number of movers, access, distance, loading time and whether disposal is included.",
      rows: [
        { label: "1 man with a van", price: "£45 – £95 / hour", average: "Around £65", included: "Small local jobs, furniture collections, student moves or light loading." },
        { label: "2 movers with 1 van", price: "£60 – £110 / hour", average: "Around £80", included: "Flat moves, heavier furniture, stairs or faster loading." },
        { label: "3 movers with 1 van", price: "£75 – £125 / hour", average: "Around £95", included: "Larger volume, difficult access or faster completion." },
        { label: "Single item collection", price: "£45 – £90", average: "Around £70", included: "Local collection or delivery of one bulky item." },
        { label: "Small flat move", price: "£150 – £350+", average: "Around £250", included: "Local small move depending on loading time and access." },
      ],
    },
    {
      title: "Common man and van jobs",
      intro: "Man and van is best for smaller, flexible local jobs where a full removals company may be too much.",
      rows: [
        { label: "Furniture collection", price: "£45 – £120", average: "Around £80", included: "Local collection and delivery, access dependent." },
        { label: "Student move", price: "£90 – £220", average: "Around £150", included: "Small room move or student flat move." },
        { label: "Storage unit move", price: "£90 – £250", average: "Around £170", included: "Moving items into or out of storage." },
        { label: "Small local move", price: "£180 – £450+", average: "Around £300", included: "Small flat or partial house move." },
        { label: "Longer-distance job", price: "£250 – £700+", average: "Varies", included: "Distance, fuel, time and return journey can affect price." },
      ],
    },
    {
      title: "Man and van vs removals company",
      bullets: [
        "Use man and van for furniture collections, small flat moves, student moves, storage runs and partial moves.",
        "Use a removals company for larger house moves, packing services, long-distance moves or specialist items.",
        "Man and van is usually more flexible and cheaper, but may include less insurance, packing and planning support.",
      ],
    },
    {
      title: "What affects man and van prices?",
      bullets: [
        "Number of movers: extra movers cost more per hour but can reduce total time.",
        "Van size: larger vans and multiple trips increase cost.",
        "Distance: longer journeys add fuel, mileage and travel time.",
        "Access and stairs: upper floors, no lift, narrow halls or long walks from van to door add time.",
        "Parking: restricted or distant parking can slow the job down.",
        "Bulky or fragile items: heavy furniture, appliances or delicate items may need extra care.",
        "Timing: evening, weekend or short-notice bookings may cost more.",
      ],
    },
    {
      title: "What should be included in a man and van quote?",
      bullets: [
        "Number of movers included.",
        "Van size and whether multiple trips are included.",
        "Hourly rate or fixed price.",
        "Fuel, mileage, parking or congestion charges.",
        "Loading and unloading help.",
        "Insurance cover, especially goods-in-transit insurance.",
        "Disposal fees if waste is being removed.",
      ],
    },
    {
      title: "Extra costs to watch out for",
      bullets: [
        "Waiting time if access or keys are delayed.",
        "Furniture dismantling and reassembly.",
        "Extra movers or extra trips.",
        "Mileage, fuel, parking or congestion charges.",
        "Stair carries or difficult access.",
        "Waste disposal charges if rubbish is included.",
      ],
    },
    {
      title: "Waste removal warning",
      intro: "If a man and van is removing rubbish, check waste paperwork before you agree.",
      bullets: [
        "Ask whether they are registered as an upper-tier waste carrier.",
        "Ask whether disposal fees are included.",
        "Avoid anyone offering suspiciously cheap rubbish removal with no licence details.",
      ],
      warning: "If your waste is fly-tipped, you may still be questioned as the homeowner, so use a properly registered waste carrier.",
    },
    {
      title: "Quickola man and van checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Send photos or a list of items before agreeing a price.",
        "Confirm number of movers and van size.",
        "Ask whether fuel, mileage and parking are included.",
        "Ask whether insurance is included.",
        "Confirm disposal fees if waste is being removed.",
      ],
    },
  ],
  faqs: [
    { question: "How much does a man with a van cost in Slough?", answer: "A small local man and van job may cost around £45–£95 per hour for one mover and a van. Two movers usually cost more but can finish faster." },
    { question: "Is man and van cheaper than removals?", answer: "Usually yes for smaller local jobs. For larger house moves, a removals company may be better because they can offer a bigger team, packing and more planning." },
    { question: "Do man and van services charge per mile?", answer: "Some do, especially for longer-distance jobs. Others include mileage in the hourly or fixed quote. Confirm this before booking." },
    { question: "Can Quickola find me a man and van?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local provider if you want help booking." },
  ],
};

const removalsCostGuide: PriceConfig["costGuide"] = {
  title: "House removals cost guide in Slough",
  updatedLabel: "Prices updated: April 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough removals price checks.",
  sections: [
    {
      title: "Typical house removal costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on property size, distance, access, parking, packing and number of movers.",
      rows: [
        { label: "Two-person team and van", price: "£50 – £80 / hour", average: "Around £65", included: "Small local moves or hourly removal jobs." },
        { label: "Standard local move", price: "£500 – £700", average: "Around £600", included: "Typical local move with two movers and van." },
        { label: "Small local move", price: "£400 – £500", average: "Around £450", included: "Smaller local move within roughly 50 miles." },
        { label: "Packing service", price: "£250 – £600", average: "Around £400", included: "Packing support, materials may be extra." },
        { label: "Long-distance UK move", price: "£800 – £1,500+", average: "Around £1,025", included: "Longer-distance move, mileage and access dependent." },
      ],
    },
    {
      title: "House moving costs by property size",
      intro: "These guide prices include typical removals plus packing. Without packing, the move may cost less.",
      rows: [
        { label: "1-bedroom home", price: "£450 – £750", average: "Around £750 with packing", included: "Small move, usually less volume." },
        { label: "2-bedroom home", price: "£600 – £925", average: "Around £925 with packing", included: "Medium move, packing optional." },
        { label: "3-bedroom home", price: "£900 – £1,300", average: "Around £1,300 with packing", included: "Larger family move." },
        { label: "4-bedroom home", price: "£1,200 – £1,800+", average: "Around £1,800 with packing", included: "Large move, may need more movers or vehicles." },
      ],
    },
    {
      title: "What affects house removal prices?",
      bullets: [
        "Size of move: more rooms and belongings mean more time, labour and vehicle space.",
        "Number of movers and vehicles: larger moves may need a bigger team or more than one van.",
        "Distance: longer moves add fuel, mileage and travel time.",
        "Access and parking: flats, stairs, no lift, long walks or poor parking can increase labour time.",
        "Packing and unpacking: packing support usually costs extra.",
        "Timing: summer, weekends and end-of-month moves can be busier and more expensive.",
        "Storage: temporary storage adds cost if move-in and move-out dates do not line up.",
      ],
    },
    {
      title: "What should be included in a removals quote?",
      bullets: [
        "Labour and number of movers.",
        "Vehicle size and whether multiple vehicles are needed.",
        "Estimated duration or fixed move price.",
        "Whether packing is included.",
        "Whether dismantling and reassembly are included.",
        "Insurance cover and what it protects.",
        "Mileage, distance, waiting or storage charges.",
      ],
    },
    {
      title: "Extra removal costs to watch out for",
      bullets: [
        "Packing materials such as boxes, tape and bubble wrap.",
        "Furniture dismantling and reassembly.",
        "Insurance upgrades for valuable or fragile items.",
        "Waiting charges if keys are delayed.",
        "Cancellation or date-change fees.",
        "Storage fees if there is a gap between moving dates.",
      ],
    },
    {
      title: "How long does a house move take?",
      bullets: [
        "Small local moves may be charged hourly and take a few hours.",
        "Larger homes are usually quoted as a full-day or fixed-price move.",
        "Long-distance moves may need more planning and travel time.",
        "Packing, access issues and waiting for keys can all increase the total time.",
      ],
    },
    {
      title: "DIY move vs removals company",
      intro: "Moving yourself can look cheaper, but removals can save time, stress and physical strain.",
      bullets: [
        "DIY may suit very small moves with light items and good access.",
        "Use removals if you have heavy furniture, limited time, no suitable vehicle or a larger home.",
        "A removals company should bring equipment such as blankets, straps, dollies and protection where needed.",
      ],
      warning: "The cheapest quote is not always best if insurance, waiting charges, packing or access issues are excluded.",
    },
    {
      title: "Quickola removals checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "List property size, stairs, parking and distance clearly.",
        "Ask whether packing, boxes and materials are included.",
        "Ask what insurance is included.",
        "Confirm waiting charges and cancellation terms.",
        "Get a written quote before moving day.",
      ],
    },
  ],
  faqs: [
    { question: "How much do removal companies charge in Slough?", answer: "A standard local move can sit around £500–£700, while a two-person team and van may cost around £50–£80 per hour for smaller jobs." },
    { question: "How much does it cost to move a 3-bedroom house?", answer: "A 3-bedroom move may cost around £900 for removals alone, or around £1,300 if packing is included." },
    { question: "How much does packing cost?", answer: "Packing services commonly cost around £250–£600 depending on property size, with many standard moves averaging around £400." },
    { question: "Can Quickola find me a removals company?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local removals provider if you want help booking." },
  ],
};

const wasteRemovalCostGuide: PriceConfig["costGuide"] = {
  title: "Rubbish removal cost guide in Slough",
  updatedLabel: "Prices updated: May 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough rubbish removal price checks.",
  sections: [
    {
      title: "Typical rubbish removal costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on waste type, volume, weight, access, labour time and disposal fees.",
      rows: [
        { label: "Small rubbish removal", price: "£75 – £150", average: "Around £110", included: "Small load or a few bulky items." },
        { label: "Typical rubbish removal project", price: "£150 – £595", average: "Around £335", included: "Household, garden or mixed waste clearance." },
        { label: "Rubbish removal labour", price: "£50 – £75 / hour", average: "Around £60", included: "Loading and clearing time." },
        { label: "Waste by volume", price: "£60 – £90 / cubic yard", average: "Around £75", included: "Common volume-based pricing." },
        { label: "Fridge removal", price: "£60 – £90", average: "Around £75", included: "Special item disposal fee." },
        { label: "Skip hire", price: "£175 – £360", average: "Around £270", included: "Skip rental, self-loaded by customer." },
      ],
    },
    {
      title: "Common rubbish removal jobs",
      intro: "Different waste types can have very different disposal costs. Heavy, bulky or specialist waste usually costs more.",
      rows: [
        { label: "Household clear-out", price: "£100 – £350", average: "Around £220", included: "Bags, boxes and mixed household items." },
        { label: "Bulky item removal", price: "£75 – £180", average: "Around £120", included: "Sofa, mattress, wardrobe or similar bulky item." },
        { label: "Garden waste removal", price: "£80 – £250", average: "Around £150", included: "Green waste, branches or garden clearance waste." },
        { label: "Builders waste / rubble", price: "£150 – £500+", average: "Varies", included: "Heavy waste, rubble, plasterboard, tiles or renovation waste." },
        { label: "Large van load", price: "£300 – £595+", average: "Around £450", included: "Large clearance, skip-size load or heavy volume." },
      ],
    },
    {
      title: "What affects rubbish removal prices?",
      bullets: [
        "Volume: more cubic yards of waste usually costs more.",
        "Weight: rubble, soil, tiles and plasterboard cost more to move and dispose of.",
        "Waste type: appliances, electricals, mattresses and hazardous waste can cost extra.",
        "Access: stairs, distance from van, no parking or awkward loading adds time.",
        "Labour time: loading, sorting and carrying can increase the final price.",
        "Disposal fees: legal waste disposal charges vary by material type.",
        "Urgency: same-day or emergency clearance may cost more.",
      ],
    },
    {
      title: "What should be included in a rubbish removal quote?",
      bullets: [
        "Loading labour and collection.",
        "Waste disposal fees.",
        "Approximate volume or weight included.",
        "Waste type being collected.",
        "Any extra charges for fridges, mattresses, rubble or electricals.",
        "VAT if applicable.",
        "Waste carrier licence details where relevant.",
      ],
    },
    {
      title: "Skip hire vs rubbish removal",
      bullets: [
        "Skip hire can be cheaper for large amounts of waste if you can load it yourself.",
        "Rubbish removal is usually easier when you want someone to load and remove the waste for you.",
        "For heavy rubble or big renovation waste, a skip or grab lorry may be more cost-effective.",
      ],
    },
    {
      title: "Licence and fly-tipping warning",
      bullets: [
        "Ask if the provider is registered as an upper-tier waste carrier.",
        "Avoid suspiciously cheap waste removal with no licence details.",
        "Ask where the waste will be taken if you are unsure.",
      ],
      warning: "If your rubbish is fly-tipped illegally, you may still be investigated, so use a legitimate waste carrier.",
    },
    {
      title: "Quickola rubbish removal checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Send photos of the waste before agreeing a price.",
        "Mention fridges, mattresses, rubble, electricals or hazardous items upfront.",
        "Ask whether disposal fees are included.",
        "Ask for waste carrier licence details.",
        "Confirm access, stairs and parking before collection.",
      ],
    },
  ],
  faqs: [
    { question: "How much does rubbish removal cost in Slough?", answer: "Small rubbish removal jobs may start around £75–£150, while larger clearances can range from £150–£595+ depending on volume, waste type and access." },
    { question: "Is rubbish removal charged by hour or volume?", answer: "Both methods are common. Some companies charge by the hour, while others charge by cubic yard or van load." },
    { question: "Do I need to check a waste carrier licence?", answer: "Yes. If a provider removes rubbish, ask for their waste carrier registration so you know the waste should be disposed of legally." },
    { question: "Can Quickola find me waste removal?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local waste removal provider if you want help booking." },
  ],
};

const electricianCostGuide: PriceConfig["costGuide"] = {
  title: "Electrician cost guide in Slough",
  updatedLabel: "Prices updated: May 2026",
  sourceLabel: "Quickola fair-price guide based on UK cost-guide benchmarks and local Slough electrician price checks.",
  sections: [
    {
      title: "Typical electrician costs in Slough",
      intro: "Use these as fair local guide prices before you book. Final prices depend on job type, urgency, materials, access, certification and whether making-good is included.",
      rows: [
        { label: "Electrician hourly rate", price: "£45 – £60 / hour", average: "Around £50", included: "Normal-hours labour for smaller electrical jobs." },
        { label: "Electrician day rate", price: "£350 – £450 / day", average: "Around £400", included: "Full-day electrical work or grouped jobs." },
        { label: "Emergency electrician rate", price: "£80 – £100 / hour", average: "Around £90", included: "Urgent, evening, weekend or out-of-hours work." },
        { label: "Minimum call-out", price: "£80 – £120+", average: "Varies", included: "Small jobs may include travel and first-hour minimums." },
      ],
    },
    {
      title: "Common electrician jobs and typical costs",
      intro: "These are common electrical jobs around Slough. Certification, materials and making-good after wall chasing can change the final quote.",
      rows: [
        { label: "Socket installation", price: "£55 – £75", average: "Around £65", included: "Standard socket installation, access dependent." },
        { label: "Replace light fitting", price: "£55 – £75", average: "Around £65", included: "Standard light fitting replacement." },
        { label: "Electrical safety certificate", price: "£125 – £300+", average: "Around £212", included: "EICR guide depending on property size." },
        { label: "Electric shower installation", price: "£250 – £400", average: "Around £325", included: "Install-only guide, shower unit usually extra." },
        { label: "Fuse box replacement", price: "£450 – £800", average: "Around £625", included: "Consumer unit replacement with testing/certification." },
        { label: "House rewiring", price: "£3,900 – £10,000+", average: "Around £6,950", included: "Full property rewire, making-good often extra." },
      ],
    },
    {
      title: "When you may need an emergency electrician",
      bullets: [
        "Power has gone off unexpectedly.",
        "Sockets are sparking or smell hot.",
        "You smell burning near electrics.",
        "Fuse box keeps tripping repeatedly.",
        "Water has affected electrics.",
        "An electrical fault is creating a safety risk.",
      ],
      warning: "If there is a burning smell, sparks or water near electrics, treat it as urgent and do not guess.",
    },
    {
      title: "What affects electrician prices?",
      bullets: [
        "Type of job: sockets and light fittings cost less than rewiring or fuse box replacement.",
        "Time required: fault finding and complex wiring can take longer than expected.",
        "Property age: older homes may have outdated wiring or difficult access.",
        "Materials and fittings: consumer units, cables, sockets and parts affect the final price.",
        "Certification: some jobs require testing and paperwork.",
        "Making good: plastering and repainting after chasing walls is often not included.",
        "Urgency: emergency and out-of-hours work costs more.",
      ],
    },
    {
      title: "What should be included in an electrician quote?",
      bullets: [
        "Hourly rate, day rate or fixed project price.",
        "Any call-out fee or minimum charge.",
        "Estimated time on site.",
        "Materials, fittings and replacement parts.",
        "Certification if required.",
        "VAT if applicable.",
        "Whether making-good is included or excluded.",
      ],
    },
    {
      title: "Can you do electrical work yourself?",
      intro: "Some very small tasks may be suitable for confident DIYers, but most electrical work should be handled by a qualified electrician.",
      bullets: [
        "Hire an electrician for wiring, consumer units, showers, circuits, fault finding and safety checks.",
        "Poor electrical work can create fire risk, electric shock risk, failed safety checks and insurance problems.",
        "Use a qualified electrician for work that needs testing, certification or compliance.",
      ],
      warning: "Electrical work is one area where guessing can be dangerous and expensive.",
    },
    {
      title: "Quickola electrician checklist",
      bullets: [
        "Check the fair local price before saying yes.",
        "Explain the job clearly before asking for quotes.",
        "Ask whether pricing is hourly, daily or fixed.",
        "Ask whether materials and certification are included.",
        "Ask whether making-good is included.",
        "Check whether emergency rates apply.",
      ],
    },
  ],
  faqs: [
    { question: "How much does an electrician charge per hour in Slough?", answer: "A typical electrician may charge around £45–£60 per hour during normal hours. Emergency jobs usually cost more." },
    { question: "What is an electrician day rate?", answer: "A full electrician day rate commonly sits around £350–£450, with many jobs averaging around £400." },
    { question: "How much does an emergency electrician cost?", answer: "Emergency electrician rates often sit around £80–£100 per hour, and a call-out fee or minimum charge may also apply." },
    { question: "Can Quickola find me an electrician?", answer: "Yes. Quickola helps you check the fair local price first, then can connect you with one available local electrician if you want help booking." },
  ],
};

const basePriceConfigs: Record<string, PriceConfig> = {
  "man-and-van": {
    label: "Man & Van",
    from: "£70 – £190",
    note: "Final price depends on distance, access, loading time, van size and helpers.",
    resultRows: [
      { label: "1 mover + van", price: "£45 – £95 / hour" },
      { label: "2 movers + van", price: "£60 – £110 / hour" },
      { label: "Small local move", price: "£150 – £350+" },
    ],
    headline: "Avoid overpaying for man and van",
    subheadline: "Based on man and van prices around Slough. Check the fair local price before you book.",
    costGuide: manAndVanCostGuide,
  },
  removals: {
    label: "Removals",
    from: "£500 – £700",
    note: "Final price depends on property size, distance, access, packing and number of movers.",
    resultRows: [
      { label: "Small local move", price: "£400 – £500" },
      { label: "Standard local move", price: "£500 – £700" },
      { label: "3-bed move with packing", price: "£1,100 – £1,500+" },
    ],
    headline: "Avoid overpaying for removals",
    subheadline: "Based on removals prices around Slough. Check the fair local price before you book.",
    costGuide: removalsCostGuide,
  },
  cleaner: {
    label: "Cleaner",
    from: "£45 – £90",
    note: "Final price depends on property size, clean type, condition and extras.",
    resultRows: [
      { label: "Regular clean", price: "£45 – £90" },
      { label: "Deep clean", price: "£100 – £300" },
      { label: "Weekly cleaner", price: "£60 – £90" },
    ],
    headline: "Avoid overpaying for a cleaner",
    subheadline: "Based on cleaner prices around Slough. Check the fair local price before you book.",
    costGuide: cleanerCostGuide,
  },
  "end-of-tenancy-cleaning": {
    label: "End of Tenancy Cleaning",
    from: "£140 – £500+",
    note: "Final price depends on property size, condition, bathrooms, appliances, carpet, windows and extras.",
    resultRows: [
      { label: "1-bed flat", price: "£140 – £220" },
      { label: "2-bed flat", price: "£180 – £300" },
      { label: "3-bed home", price: "£240 – £420+" },
    ],
    headline: "Avoid overpaying for end of tenancy cleaning",
    subheadline: "Based on end of tenancy cleaning prices around Slough. Check the fair local price before you book.",
    costGuide: cleanerCostGuide,
  },
  plumber: {
    label: "Plumber",
    from: "£80 – £160",
    note: "Final price depends on issue type, urgency, access, parts and repair details.",
    resultRows: [
      { label: "Small repair", price: "£70 – £160" },
      { label: "Parts needed", price: "£90 – £240" },
      { label: "Emergency callout", price: "£120 – £260" },
    ],
    headline: "Avoid overpaying for a plumber",
    subheadline: "Based on plumber prices around Slough. Check the fair local price before you book.",
    costGuide: plumberCostGuide,
  },
  electrician: {
    label: "Electrician",
    from: "£80 – £150",
    note: "Final price depends on issue type, property size, access, parts, certification and urgency.",
    resultRows: [
      { label: "Hourly rate", price: "£45 – £60 / hour" },
      { label: "Small job callout", price: "£80 – £120+" },
      { label: "Emergency rate", price: "£80 – £100 / hour" },
    ],
    headline: "Avoid overpaying for an electrician",
    subheadline: "Based on electrician prices around Slough. Check the fair local price before you book.",
    costGuide: electricianCostGuide,
  },
  locksmith: {
    label: "Locksmith",
    from: "£85 – £180",
    note: "Final price depends on lock type, urgency, time of day and replacement parts.",
    resultRows: [
      { label: "Standard lockout", price: "£90 – £140" },
      { label: "Lock change", price: "£90 – £175" },
      { label: "Emergency callout", price: "£120 – £250+" },
    ],
    headline: "Avoid overpaying for a locksmith",
    subheadline: "Based on locksmith prices around Slough. Check the fair local price before you book.",
    costGuide: locksmithCostGuide,
  },
  "painter-decorator": {
    label: "Painter",
    from: "£300 – £650",
    note: "Final price depends on room count, prep work, surface condition, paint choice and materials.",
    resultRows: [
      { label: "Small room", price: "£300 – £450" },
      { label: "Medium room", price: "£400 – £650" },
      { label: "Painter day rate", price: "£250 – £400 / day" },
    ],
    headline: "Avoid overpaying for a painter",
    subheadline: "Based on painter and decorator prices around Slough. Check the fair local price before you book.",
    costGuide: painterDecoratorCostGuide,
  },
  gardener: {
    label: "Gardener",
    from: "£50 – £120",
    note: "Final price depends on garden size, condition, waste removal and job type.",
    resultRows: [
      { label: "Small tidy-up", price: "£60 – £120" },
      { label: "Regular maintenance", price: "£25 – £45 / hour" },
      { label: "Overgrown garden", price: "£150 – £450+" },
    ],
    headline: "Avoid overpaying for a gardener",
    subheadline: "Based on gardener prices around Slough. Check the fair local price before you book.",
    costGuide: gardenerCostGuide,
  },
  "waste-removal": {
    label: "Waste Removal",
    from: "£80 – £250",
    note: "Final price depends on load size, waste type, access, weight and disposal fees.",
    resultRows: [
      { label: "Small load", price: "£75 – £150" },
      { label: "Typical clearance", price: "£150 – £595" },
      { label: "By volume", price: "£60 – £90 / yd³" },
    ],
    headline: "Avoid overpaying for rubbish removal",
    subheadline: "Based on rubbish removal prices around Slough. Check the fair local price before you book.",
    costGuide: wasteRemovalCostGuide,
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

  const range = bedroomCleaningRanges[cleanType]?.[bedrooms] ?? bedroomCleaningRanges["regular-clean"][bedrooms] ?? bedroomCleaningRanges["regular-clean"]["1-bed"];
  const label = cleanType === "deep-clean" ? "Deep Clean" : cleanType === "end-of-tenancy" ? "End of Tenancy Cleaning" : "Cleaner";
  const isDeepClean = cleanType === "deep-clean";
  const isEndOfTenancy = cleanType === "end-of-tenancy";

  return {
    ...rangeToConfig(label, range),
    resultRows: isEndOfTenancy
      ? [
          { label: "1-bed flat", price: "£140 – £220" },
          { label: "2-bed flat", price: "£180 – £300" },
          { label: "3-bed home", price: "£240 – £420+" },
        ]
      : [
          { label: "Regular clean", price: "£45 – £90" },
          { label: "Deep clean", price: "£100 – £300" },
          { label: "Weekly cleaner", price: "£60 – £90" },
        ],
    headline: isEndOfTenancy
      ? "Avoid overpaying for end of tenancy cleaning"
      : isDeepClean
        ? "Avoid overpaying for deep cleaning"
        : "Avoid overpaying for a cleaner",
    subheadline: isEndOfTenancy
      ? "Based on end of tenancy cleaning prices around Slough. Check the fair local price before you book."
      : isDeepClean
        ? "Based on deep cleaning prices around Slough. Final price is confirmed after a quick assessment."
        : "Based on cleaner prices around Slough. Check the fair local price before you book.",
    costGuide: cleanerCostGuide,
  };
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
    note: "Final price depends on distance, access, loading time, van size and helpers.",
    resultRows: [
      { label: "1 mover + van", price: "£45 – £95 / hour" },
      { label: "2 movers + van", price: "£60 – £110 / hour" },
      { label: "Small local move", price: "£150 – £350+" },
    ],
    headline: "Avoid overpaying for man and van",
    subheadline: "Based on man and van prices around Slough. Check the fair local price before you book.",
    costGuide: manAndVanCostGuide,
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
    resultRows: [
      { label: "Small repair", price: "£70 – £160" },
      { label: "Parts needed", price: "£90 – £240" },
      { label: "Emergency callout", price: "£120 – £260" },
    ],
    headline: "Avoid overpaying for a plumber",
    subheadline: "Based on plumber prices around Slough. Check the fair local price before you book.",
    costGuide: plumberCostGuide,
  };
};

export const getPriceConfigForResults = (params: PriceSearchParams): PriceConfig => {
  const serviceKey = normalisePriceServiceSlug(getOne(params, "service"));

  if (serviceKey === "cleaner") return getCleanerPriceConfig(params);
  if (serviceKey === "end-of-tenancy-cleaning") {
    return getCleanerPriceConfig({
      ...params,
      cleanType: "end-of-tenancy",
    });
  }
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