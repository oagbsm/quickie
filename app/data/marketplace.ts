export type PricingModel = "cleaning_deterministic" | "range_not_configured";
export type QuestionType = "single_select" | "multi_select" | "counter" | "boolean" | "postcode" | "date" | "short_text" | "origin_destination";
export type PhotoRequirement = "none" | "optional" | "recommended" | "required";
export type PricingQuestion = { id: string; label: string; type: QuestionType; options?: string[]; required?: boolean; placeholder?: string; showWhen?: { question: string; values: string[] } };
export type MarketplaceJob = { slug: string; name: string; shortDescription: string; pricingModel: PricingModel; pricingQuestions: PricingQuestion[]; inferredAnswers?: Record<string, string | number>; photoRequirement: PhotoRequirement; serviceAreaRequirements?: string[]; seoTitle: string; seoDescription: string; active: boolean; featured?: boolean; popular?: boolean; requiresQualification?: boolean; qualificationType?: string };
export type MarketplaceService = { slug: string; name: string; shortName: string; description: string; image: string; detail: string; examples: string[]; pricingModel: PricingModel; pricingQuestions: PricingQuestion[]; popularJobExamples: string[]; photoUseful: boolean; originDestinationRequired?: boolean; timingMatters: boolean; seoTitle: string; seoDescription: string; jobs: MarketplaceJob[] };

const choice = (id: string, label: string, options: string[], showWhen?: PricingQuestion["showWhen"]): PricingQuestion => ({ id, label, type: "single_select", options, required: true, showWhen });
const counter = (id: string, label: string): PricingQuestion => ({ id, label, type: "counter", required: true });
const postcode: PricingQuestion = { id: "postcode", label: "Postcode", type: "postcode", required: true, placeholder: "e.g. SL1 3BD" };
const when: PricingQuestion = { id: "when", label: "When?", type: "single_select", options: ["ASAP", "Today", "Tomorrow", "Choose date", "Flexible"], required: true };
const withLocation = (questions: PricingQuestion[], timing: PricingQuestion = when) => [...questions, postcode, timing];
const inferAnswers = (slug: string, name: string, questions: PricingQuestion[]) => { const answers: Record<string, string> = {}; const lower = name.toLowerCase(); if (questions.some((question) => question.id === "cleanType")) { answers.cleanType = slug === "regular-home-cleaning" ? "Regular" : slug === "deep-cleaning" ? "Deep clean" : slug === "end-of-tenancy-cleaning" ? "End of tenancy" : slug === "move-in-move-out-cleaning" ? "Move-in / move-out" : slug === "short-stay-cleaning" ? "Short-stay" : slug === "specialist-cleaning" ? "Specialist" : "One-off"; } if (questions.some((question) => question.id === "item")) { const item = lower.includes("chest of drawers") || lower.includes("drawers") ? "Chest of drawers" : lower.includes("wardrobe") ? "Wardrobe" : lower.includes("bed assembly") ? "Bed" : lower.includes("desk assembly") || lower.includes("desk and table") ? "Desk" : lower.includes("table / chairs") ? "Table / chairs" : null; if (item) answers.item = item; } return answers; };
const job = (slug: string, name: string, shortDescription: string, pricingQuestions: PricingQuestion[], options: Partial<MarketplaceJob> = {}): MarketplaceJob => { const questions = withLocation(pricingQuestions); const inferredAnswers = inferAnswers(slug, name, questions); return { slug, name, shortDescription, pricingModel: "range_not_configured", pricingQuestions: questions.filter((question) => !(question.id in inferredAnswers)), inferredAnswers, photoRequirement: "optional", seoTitle: `${name} | Quickola`, seoDescription: `Post your ${name.toLowerCase()} job and compare local offers.`, active: true, ...options }; };
const listJobs = (items: string[], questions: PricingQuestion[], options: Partial<MarketplaceJob> = {}) => items.map((name) => job(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), name, `Local help with ${name.toLowerCase()}.`, questions, { ...options }));

const generalSizeQuestions = [choice("size", "Size", ["Small", "Medium", "Large", "Not sure"]), choice("wasteRemoval", "Waste removal", ["Yes", "No"])];
const assemblyQuestions = [choice("item", "Item", ["Bed", "Wardrobe", "Desk", "Chest of drawers", "Table / chairs", "Other"]), counter("quantity", "Quantity"), choice("brand", "Brand", ["IKEA", "Other", "Not sure"])];
const movingQuestions: PricingQuestion[] = [choice("items", "What is moving?", ["Sofa", "Bed", "Wardrobe", "Table", "Chairs", "Boxes", "TV", "Appliances", "Other"]), counter("quantity", "Quantity"), choice("pickupAccess", "Pickup access", ["Ground floor", "Stairs", "Lift"]), choice("deliveryAccess", "Delivery access", ["Ground floor", "Stairs", "Lift"]), { id: "fromPostcode", label: "From postcode", type: "postcode", required: true }, { id: "toPostcode", label: "To postcode", type: "postcode", required: true }];
const paintingQuestions = [choice("condition", "Condition", ["Good", "Needs prep", "Damaged / unsure"]), choice("paintSupplied", "Paint supplied by", ["Customer", "Professional", "Not sure"]), counter("rooms", "Approximate rooms")];

// Keep one clear customer intention per button. Historical slugs are mapped below
// so existing jobs and provider records continue to resolve to a current option.
const cleaningJobs: MarketplaceJob[] = [
  job("regular-home-cleaning", "Regular home cleaning", "Recurring home cleaning.", [choice("cleanType", "Clean type", ["Regular"]), counter("bedrooms", "Bedrooms"), counter("bathrooms", "Bathrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional", popular: true }),
  job("one-off-cleaning", "One-off cleaning", "A one-off home clean.", [choice("cleanType", "Clean type", ["One-off"]), counter("bedrooms", "Bedrooms"), counter("bathrooms", "Bathrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional", popular: true }),
  job("deep-cleaning", "Deep cleaning", "A detailed clean for a home that needs extra attention.", [choice("cleanType", "Clean type", ["Deep clean"]), counter("bedrooms", "Bedrooms"), counter("bathrooms", "Bathrooms"), choice("propertyType", "Property type", ["Flat", "House"]), choice("extras", "Optional extras", ["Oven", "Fridge", "Inside windows", "Carpet", "None"])], { pricingModel: "cleaning_deterministic", photoRequirement: "optional", popular: true }),
  job("end-of-tenancy-cleaning", "End of tenancy cleaning", "A clean before handover.", [choice("cleanType", "Clean type", ["End of tenancy"]), counter("bedrooms", "Bedrooms"), counter("bathrooms", "Bathrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional", popular: true }),
  job("move-in-move-out-cleaning", "Move-in or move-out cleaning", "A clean before moving in or handing a home over.", [choice("cleanType", "Clean type", ["Move-in / move-out"]), counter("bedrooms", "Bedrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional" }),
  job("short-stay-cleaning", "Short-stay cleaning", "Cleaning between guests at a short-stay property.", [choice("cleanType", "Clean type", ["Short-stay"]), counter("bedrooms", "Bedrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional" }),
  job("specialist-cleaning", "Specialist cleaning", "Oven, carpet or window cleaning.", [choice("specialistType", "What needs cleaning?", ["Oven", "Carpet", "Windows"]), choice("cleanType", "Clean type", ["Specialist"]), counter("bedrooms", "Bedrooms")], { pricingModel: "cleaning_deterministic", photoRequirement: "optional" }),
];
const gardeningJobs: MarketplaceJob[] = [
  job("lawn-mowing", "Lawn mowing", "Lawns cut and tidied.", [choice("gardenSize", "Garden size", ["Small", "Medium", "Large", "Not sure"]), choice("grassCondition", "Grass condition", ["Normal", "Overgrown", "Very overgrown", "Not sure"]), choice("wasteRemoval", "Waste removal", ["Yes", "No"])], { photoRequirement: "recommended", popular: true }),
  job("hedge-trimming", "Hedge trimming", "Hedges trimmed to size.", [choice("hedgeAmount", "Hedge amount", ["Small", "Medium", "Large", "Not sure"]), choice("hedgeHeight", "Height", ["Under 2m", "2–4m", "4m+", "Not sure"]), choice("wasteRemoval", "Waste removal", ["Yes", "No"])], { photoRequirement: "recommended", popular: true }),
  job("garden-tidy-up", "Garden tidy-up", "Weeding, pruning and general garden tidying.", generalSizeQuestions, { photoRequirement: "recommended" }),
  job("garden-clearance", "Garden clearance", "Clearing overgrown areas, shrubs and unwanted garden material.", generalSizeQuestions, { photoRequirement: "recommended" }),
  job("pressure-washing", "Pressure washing", "Cleaning patios, driveways and outdoor surfaces.", generalSizeQuestions, { photoRequirement: "recommended" }),
  job("gutter-cleaning", "Gutter cleaning", "Clearing and cleaning gutters.", generalSizeQuestions, { photoRequirement: "recommended" }),
  job("other-gardening", "Other gardening", "Another gardening or outdoor job.", generalSizeQuestions, { photoRequirement: "recommended" }),
];
const handymanJobs: MarketplaceJob[] = [
  job("minor-home-repairs", "Minor home repairs", "Small practical repairs around the home.", [choice("jobType", "What needs doing?", ["Repair", "Fitting", "Installation", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended", popular: true }),
  job("wall-hanging-and-shelving", "Wall hanging and shelving", "Hanging shelves, pictures or mirrors.", [choice("jobType", "What needs doing?", ["Shelves", "Pictures", "Mirrors", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
  job("curtain-and-blind-fitting", "Curtain and blind fitting", "Fitting curtains, blinds and their fixings.", [choice("jobType", "What needs doing?", ["Curtains", "Blinds", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
  job("door-repair", "Door repair", "Repairing doors, handles and hinges.", [choice("jobType", "What needs doing?", ["Repair", "Adjustment", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
  job("cabinet-and-furniture-repair", "Cabinet and furniture repair", "Repairing cabinets or built furniture.", [choice("jobType", "What needs doing?", ["Repair", "Adjustment", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
  job("minor-carpentry", "Minor carpentry", "Small woodwork jobs around the home.", [choice("jobType", "What needs doing?", ["Repair", "Fitting", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
  job("other-handyman", "Other handyman work", "Another practical home repair or fitting job.", [choice("jobType", "What needs doing?", ["Repair", "Fitting", "Installation", "Other"]), counter("quantity", "How many?")], { photoRequirement: "recommended" }),
];
const assemblyJobs = [
  job("furniture-assembly", "Furniture assembly", "Assembling furniture or flat-pack items.", assemblyQuestions, { photoRequirement: "optional", popular: true }),
  job("bed-assembly", "Bed assembly", "Assembling a bed frame.", assemblyQuestions, { photoRequirement: "optional" }),
  job("wardrobe-and-drawers-assembly", "Wardrobe and chest of drawers assembly", "Assembling wardrobes or chests of drawers.", assemblyQuestions, { photoRequirement: "optional", popular: true }),
  job("desk-and-table-assembly", "Desk and table assembly", "Assembling desks, tables or chairs.", assemblyQuestions, { photoRequirement: "optional" }),
  job("office-furniture-assembly", "Office furniture assembly", "Assembling office furniture.", assemblyQuestions, { photoRequirement: "optional" }),
  job("outdoor-and-equipment-assembly", "Outdoor and equipment assembly", "Assembling outdoor furniture or exercise equipment.", assemblyQuestions, { photoRequirement: "optional" }),
  job("other-furniture-assembly", "Other furniture assembly", "Another furniture or equipment assembly job.", assemblyQuestions, { photoRequirement: "optional" }),
];
const plumbingQuestions = [choice("urgency", "How urgent?", ["ASAP", "Soon", "Flexible"]),];
const applianceInstallationQuestions: PricingQuestion[] = [choice("appliance", "Appliance", ["Washing machine", "Dishwasher"]), ...plumbingQuestions];
const plumbingJobs: MarketplaceJob[] = [
  job("leak-fixing", "Leak fixing", "Finding and fixing a leak.", plumbingQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("tap-replacement", "Tap repair or replacement", "Repairing or replacing a tap.", [choice("tapType", "Tap type", ["Kitchen", "Bathroom basin", "Bath", "Outdoor", "Not sure"]), choice("tapSupplied", "Tap supplied", ["Yes", "No", "Not sure"]), choice("existingTapRemoval", "Remove existing tap", ["Yes", "No"])], { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("drain-unblocking", "Drain unblocking", "Unblocking a sink, drain or waste pipe.", plumbingQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("toilet-repair", "Toilet repair or replacement", "Repairing or replacing a toilet.", plumbingQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("sink-replacement", "Sink replacement", "Replacing a sink or basin.", plumbingQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("appliance-installation", "Washing machine or dishwasher installation", "Installing a washing machine or dishwasher.", applianceInstallationQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
  job("other-plumbing", "Other plumbing", "Another plumbing job.", plumbingQuestions, { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Plumbing qualification may be required" }),
];
const electricalJobs = listJobs(["Light fitting installation", "Switch and socket replacement", "Ceiling fan installation", "Electrical repair", "Other electrical"], [choice("propertyType", "Property type", ["Flat", "House", "Other"])], { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Qualified electrical professional may be required" });
const movingJobs = ["Single item move", "House move", "Office move", "Collection and delivery", "Moving help", "Appliance moving", "Other moving"].map((name) => job(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), name, `Get help with ${name.toLowerCase()}.`, movingQuestions, { photoRequirement: "recommended", popular: name === "Single item move" }));
const wasteQuestions = [choice("wasteType", "Waste type", ["Furniture", "Household", "Garden", "Appliance", "Mixed"]), choice("amount", "Amount", ["Few items", "Quarter load", "Half load", "Three-quarter load", "Full load", "Not sure"]), choice("access", "Access", ["Easy", "Stairs", "Difficult"])];
const wasteJobs = listJobs(["Household rubbish removal", "Furniture and bulky item disposal", "Garden waste removal", "Appliance disposal", "Garage and shed clearance", "Mixed waste removal", "Other waste removal"], wasteQuestions, { photoRequirement: "recommended", popular: true });
const paintingJobs: MarketplaceJob[] = [
  job("interior-room-painting", "Interior room painting", "Painting one or more rooms inside a home.", paintingQuestions, { photoRequirement: "recommended" }),
  job("feature-wall-painting", "Feature wall painting", "Painting a feature or accent wall.", paintingQuestions, { photoRequirement: "recommended" }),
  job("ceiling-painting", "Ceiling painting", "Painting or refreshing ceilings.", paintingQuestions, { photoRequirement: "recommended" }),
  job("doors-and-woodwork-painting", "Doors and woodwork painting", "Painting doors, skirting boards and other woodwork.", paintingQuestions, { photoRequirement: "recommended" }),
  job("exterior-painting", "Exterior painting", "Painting outside walls, doors or other exterior surfaces.", paintingQuestions, { photoRequirement: "recommended" }),
  job("wallpapering-and-decorating", "Wallpapering and decorating", "Wallpapering or other decorating work.", paintingQuestions, { photoRequirement: "recommended" }),
  job("other-painting-and-decorating", "Other painting and decorating", "Another painting or decorating job.", paintingQuestions, { photoRequirement: "recommended" }),
];
const mountingQuestions = [choice("wallType", "Wall type", ["Brick", "Plasterboard", "Concrete", "Not sure"]), choice("bracket", "Bracket", ["I have one", "Professional to supply", "Not sure"])];
const tvJobs = [
  job("tv-mounting", "TV mounting and installation", "Mounting a TV securely on a wall.", [choice("tvSize", "TV size", ["Under 43\"", "43–55\"", "56–70\"", "70+\"", "Not sure"]), ...mountingQuestions, choice("hideCables", "Hide cables", ["Yes", "No"])], { photoRequirement: "recommended", popular: true }),
  job("hide-tv-cables", "TV cable hiding", "Hiding cables for a cleaner finish.", mountingQuestions, { photoRequirement: "recommended" }),
  job("soundbar-installation", "Soundbar installation", "Mounting or setting up a soundbar.", mountingQuestions, { photoRequirement: "recommended" }),
  job("home-theatre-setup", "Home cinema setup", "Setting up a home cinema system.", mountingQuestions, { photoRequirement: "recommended" }),
  job("picture-mirror-and-shelf-mounting", "Picture, mirror and shelf mounting", "Mounting pictures, mirrors or shelves.", mountingQuestions, { photoRequirement: "recommended" }),
  job("other-mounting", "Other mounting", "Another TV or mounting job.", mountingQuestions, { photoRequirement: "recommended" }),
];
const smartHomeJobs = listJobs(["Video doorbell installation", "Smart lock installation", "Smart thermostat installation", "Security camera installation", "Wi-Fi and router setup", "Smart hub and device setup", "Other smart home work"], [choice("device", "What device?", ["Doorbell", "Lock", "Thermostat", "Camera", "Router", "Hub", "Other"]), choice("deviceSupplied", "Device supplied", ["Yes", "No", "Not sure"])], { photoRequirement: "recommended", requiresQualification: true, qualificationType: "Specialist qualification may be required" });
const windowJobs = [
  job("blind-installation", "Blind installation", "Installing blinds.", [choice("windowType", "Blind type", ["Roller", "Venetian", "Vertical", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
  job("curtain-installation", "Curtain installation", "Installing curtains.", [choice("windowType", "Curtain type", ["Curtains", "Eyelet curtains", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
  job("curtain-rails-and-poles", "Curtain rails and poles", "Installing curtain rails or poles.", [choice("windowType", "What needs fitting?", ["Rail", "Pole", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
  job("window-treatment-repair", "Blind and curtain repair", "Repairing blinds, curtains or their fittings.", [choice("windowType", "What needs repairing?", ["Blinds", "Curtains", "Fittings", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
  job("window-shades", "Window shades", "Installing other window shades or coverings.", [choice("windowType", "What needs fitting?", ["Shade", "Covering", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
  job("other-window-treatments", "Other window treatments", "Another curtain, blind or window-covering job.", [choice("windowType", "What needs doing?", ["Blinds", "Curtains", "Fittings", "Repair", "Other"]), counter("quantity", "Quantity")], { photoRequirement: "recommended" }),
];

const serviceSeo: Record<string, { title: string; provider: string; locationTitle: string; description: string }> = {
  cleaning: { title: "Need a Cleaner? Compare Local Prices | Quickola", provider: "cleaners", locationTitle: "Need a Cleaner", description: "Tell us what needs cleaning once. Compare prices from available local cleaners and choose who works for you without ringing around." },
  gardening: { title: "Get Your Garden Sorted | Compare Local Prices", provider: "gardeners", locationTitle: "Need a Gardener", description: "Tell us what needs doing in your garden once. Compare prices from available local gardeners and choose who works for you." },
  handyman: { title: "Need a Handyman? Compare Local Prices | Quickola", provider: "handymen", locationTitle: "Need a Handyman", description: "Tell us what needs fixing or fitting once. Compare prices from available local handymen and choose who works for you without ringing around." },
  plumbing: { title: "Need a Plumber? Compare Local Prices | Quickola", provider: "plumbers", locationTitle: "Need a Plumber", description: "Tell us what plumbing job needs sorting once. Compare prices from available local plumbers and choose who works for you." },
  electrical: { title: "Need an Electrician? Compare Local Prices | Quickola", provider: "electricians", locationTitle: "Need an Electrician", description: "Tell us what electrical job needs doing once. Compare prices from available local electricians and choose who works for you." },
  "furniture-assembly": { title: "Need Furniture Assembled? Compare Local Prices | Quickola", provider: "furniture assemblers", locationTitle: "Need Furniture Assembled", description: "Tell us what needs assembling once. Compare prices from available local furniture assemblers and choose who works for you." },
  removals: { title: "Need Help Moving? Compare Local Prices | Quickola", provider: "moving providers", locationTitle: "Need Help Moving", description: "Tell us what needs moving once. Compare prices from available local moving providers and choose who works for you without ringing around." },
  "waste-removal": { title: "Need Rubbish Cleared? Compare Local Prices | Quickola", provider: "waste removal providers", locationTitle: "Need Rubbish Cleared", description: "Tell us what needs removing once. Compare prices from available local waste removal providers and choose who works for you without ringing around." },
  painting: { title: "Need a Painter & Decorator? Compare Local Prices | Quickola", provider: "painters and decorators", locationTitle: "Need a Painter", description: "Tell us what needs painting or decorating once. Compare prices from available local painters and decorators and choose who works for you." },
  "tv-mounting": { title: "Need a TV Mounted? Compare Local Prices | Quickola", provider: "mounting providers", locationTitle: "Need a TV Mounted", description: "Tell us what needs mounting once. Compare prices from available local mounting providers and choose who works for you." },
  "smart-home": { title: "Need Smart Home Help? Compare Local Prices | Quickola", provider: "smart home providers", locationTitle: "Need Smart Home Help", description: "Tell us what needs setting up once. Compare prices from available local smart home providers and choose who works for you." },
  "window-cleaning": { title: "Need Window, Curtain or Blind Help? Compare Local Prices | Quickola", provider: "window treatment providers", locationTitle: "Need Window, Curtain or Blind Help", description: "Tell us what needs cleaning, fitting or repairing once. Compare prices from available local providers and choose who works for you." },
};

const makeCategory = (slug: string, name: string, shortName: string, description: string, image: string, jobs: MarketplaceJob[], detail: string): MarketplaceService => ({ slug, name, shortName, description, image, detail, examples: jobs.filter((item) => item.popular).slice(0, 4).map((item) => item.name), pricingModel: jobs.some((item) => item.pricingModel === "cleaning_deterministic") ? "cleaning_deterministic" : "range_not_configured", pricingQuestions: jobs[0]?.pricingQuestions || [], popularJobExamples: jobs.filter((item) => item.popular).map((item) => item.name), photoUseful: jobs.some((item) => item.photoRequirement !== "none"), timingMatters: true, seoTitle: serviceSeo[slug]?.title || `${name} | Quickola`, seoDescription: serviceSeo[slug]?.description || `Tell us what needs doing once. Compare prices from available local providers and choose who works for you.`, jobs });

export const marketplaceServices: MarketplaceService[] = [
  makeCategory("cleaning", "Cleaning", "Cleaning", "Home cleaning and specialist cleaning jobs", "/quickola-home-improvement-svgs/cleaner.svg", cleaningJobs, "Choose a specific cleaning job and share the details local people need to send an offer."),
  makeCategory("gardening", "Gardening & Outdoor", "Gardening", "Lawns, hedges and outdoor jobs", "/quickola-home-improvement-svgs/gardener.svg", gardeningJobs, "Choose the outdoor job that needs doing and answer the relevant questions."),
  makeCategory("handyman", "Handyman & Repairs", "Handyman", "Repairs, fitting and practical home jobs", "/quickola-home-improvement-svgs/handyman.svg", handymanJobs, "Choose a specific repair or fitting job."),
  makeCategory("furniture-assembly", "Furniture Assembly", "Assembly", "Furniture and equipment assembly", "/quickola-home-improvement-svgs/furniture-assembly.svg", assemblyJobs, "Choose the item to assemble."),
  makeCategory("plumbing", "Plumbing", "Plumbing", "Everyday plumbing jobs from local professionals", "/quickola-home-improvement-svgs/plumber.svg", plumbingJobs, "Some plumbing jobs may require a qualified professional."),
  makeCategory("electrical", "Electrical", "Electrical", "Electrical installation and repair jobs", "/quickola-home-improvement-svgs/electrician.svg", electricalJobs, "Electrical work may require a qualified professional."),
  makeCategory("removals", "Moving & Removals", "Moving", "Moves, collections and moving help", "/quickola-home-improvement-svgs/house-clearance.svg", movingJobs, "Moving jobs are separate from waste removal."),
  makeCategory("waste-removal", "Waste Removal", "Waste", "Household, garden and furniture waste removal", "/quickola-home-improvement-svgs/waste-removal.svg", wasteJobs, "Choose the waste type, amount and access."),
  makeCategory("painting", "Painting & Decorating", "Painting", "Painting, preparation and decorating jobs", "/quickola-home-improvement-svgs/painter-decorator.svg", paintingJobs, "Choose what needs painting and its condition."),
  makeCategory("tv-mounting", "TV & Mounting", "TV & Mounting", "TV, picture, mirror and shelf mounting", "/quickola-home-improvement-svgs/handyman.svg", tvJobs, "Choose the mounting job and wall details."),
  makeCategory("smart-home", "Smart Home", "Smart Home", "Connected home device setup and installation", "/quickola-home-improvement-svgs/cctv-security.svg", smartHomeJobs, "Choose the device and whether it is already supplied."),
  makeCategory("window-cleaning", "Windows, Curtains & Blinds", "Windows & Blinds", "Window, curtain and blind installation or repair", "/quickola-home-improvement-svgs/window-cleaning.svg", windowJobs, "Choose the window treatment job."),
];

export const marketplaceLocations = [{ slug: "slough", name: "Slough", description: "Local services across Slough and nearby areas." }, { slug: "windsor", name: "Windsor", description: "Home services for Windsor and surrounding areas." }, { slug: "maidenhead", name: "Maidenhead", description: "Local home services across Maidenhead and the SL6 area." }, { slug: "london", name: "London", description: "A future expansion area for Quickola services." }];
export const ACTIVE_PUBLIC_SEO_LOCATIONS = ["maidenhead"] as const;
export const ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS = ["SL6"] as const;
export function isActivePublicSeoLocation(slug: string) { return ACTIVE_PUBLIC_SEO_LOCATIONS.includes(slug as (typeof ACTIVE_PUBLIC_SEO_LOCATIONS)[number]); }

export function getLocationServiceSeo(service: MarketplaceService, location: { name: string }) {
  const seo = serviceSeo[service.slug];
  const provider = seo?.provider || "local providers";
  const need = (seo?.locationTitle || `Need ${service.name}`).replace(/^Need /, "").toLowerCase();
  return {
    title: `${seo?.locationTitle || `Need ${service.name}`} in ${location.name}? Compare Local Prices`,
    description: `Need ${need} in ${location.name}? Tell us what needs doing once, compare prices from available local ${provider}, and choose without ringing around.`,
  };
}
const legacyCategoryAliases: Record<string, string> = { "carpet-cleaning": "cleaning", "pressure-washing": "gardening", "furniture-assembly": "furniture-assembly" };
const legacyJobAliases: Record<string, Record<string, string>> = {
  cleaning: { "move-in-cleaning": "move-in-move-out-cleaning", "move-out-cleaning": "move-in-move-out-cleaning", "airbnb-short-stay-cleaning": "short-stay-cleaning", "oven-cleaning": "specialist-cleaning", "carpet-cleaning": "specialist-cleaning", "window-cleaning": "specialist-cleaning" },
  gardening: { weeding: "garden-tidy-up", pruning: "garden-tidy-up", "general-gardening": "garden-tidy-up", "shrub-removal": "garden-clearance" },
  handyman: { "general-handyman": "other-handyman", "hanging-shelves": "wall-hanging-and-shelving", "hanging-pictures-mirrors": "wall-hanging-and-shelving", "curtain-blind-fitting": "curtain-and-blind-fitting", "cabinet-repair": "cabinet-and-furniture-repair", "furniture-repair": "cabinet-and-furniture-repair", "wall-repair": "minor-home-repairs", "sealing-caulking": "minor-home-repairs" },
  "furniture-assembly": { "ikea-assembly": "furniture-assembly", "wardrobe-assembly": "wardrobe-and-drawers-assembly", "chest-of-drawers-assembly": "wardrobe-and-drawers-assembly", "desk-assembly": "desk-and-table-assembly", "table-chairs-assembly": "desk-and-table-assembly", "outdoor-furniture-assembly": "outdoor-and-equipment-assembly", "exercise-equipment-assembly": "outdoor-and-equipment-assembly" },
  plumbing: { "tap-repair": "tap-replacement", "toilet-replacement": "toilet-repair", "washing-machine-installation": "appliance-installation", "dishwasher-installation": "appliance-installation", "general-plumbing": "other-plumbing" },
  electrical: { "light-switch-replacement": "switch-and-socket-replacement", "socket-outlet-replacement": "switch-and-socket-replacement", "general-electrical": "other-electrical", "smart-thermostat-installation": "other-electrical", "video-doorbell-installation": "other-electrical", "smart-device-installation": "other-electrical" },
  removals: { "man-and-van": "moving-help", "furniture-moving": "moving-help", "flat-move": "house-move", "furniture-collection": "collection-and-delivery" },
  "waste-removal": { "furniture-disposal": "furniture-and-bulky-item-disposal", "rubbish-clearance": "household-rubbish-removal", "garage-clearance": "garage-and-shed-clearance", "shed-clearance": "garage-and-shed-clearance" },
  painting: { "room-painting": "interior-room-painting", "bedroom-painting": "interior-room-painting", "wall-painting": "interior-room-painting", "interior-painting": "interior-room-painting", "door-painting": "doors-and-woodwork-painting", "skirting-woodwork-painting": "doors-and-woodwork-painting", "general-decorating": "wallpapering-and-decorating" },
  "tv-mounting": { "tv-installation": "tv-mounting", "picture-mounting": "picture-mirror-and-shelf-mounting", "mirror-mounting": "picture-mirror-and-shelf-mounting", "shelf-mounting": "picture-mirror-and-shelf-mounting", "home-theatre-setup": "home-theatre-setup" },
  "smart-home": {},
  "window-cleaning": { "curtain-rail-installation": "curtain-rails-and-poles", "curtain-pole-installation": "curtain-rails-and-poles", "window-treatment-installation": "other-window-treatments", "window-blind-repair": "window-treatment-repair", "curtain-blind-repair": "window-treatment-repair" },
};
export function normalizeJobSlug(categorySlug: string, jobSlug: string) { const category = legacyCategoryAliases[categorySlug] || categorySlug; return legacyJobAliases[category]?.[jobSlug] || jobSlug; }
export function getService(slug: string) { return marketplaceServices.find((service) => service.slug === (legacyCategoryAliases[slug] || slug)); }
export function getJob(categorySlug: string, jobSlug: string) { const category = legacyCategoryAliases[categorySlug] || categorySlug; return getService(category)?.jobs.find((item) => item.slug === normalizeJobSlug(category, jobSlug)); }
export function findJob(slug: string) { for (const service of marketplaceServices) { const found = service.jobs.find((item) => item.slug === normalizeJobSlug(service.slug, slug)); if (found) return { service, job: found }; } return undefined; }
export function getLocation(slug: string) { return marketplaceLocations.find((location) => location.slug === slug); }
