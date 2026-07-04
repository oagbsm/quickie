import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "After Builders Cleaning Slough | Fair Price Guide",
  "description": "Check fair local prices for after-builders cleaning in Slough. Dust, condition, property size and access can affect the final cleaning quote.",
  "h1": "After builders cleaning in Slough",
  "intro": "After-builders cleaning can involve dust, plaster residue, surface wiping, floors, bathrooms, kitchens and window ledges after building or decorating work. Quickola helps you check a fair local guide price before booking.",
  "localNote": "After-builders cleans in Slough can vary a lot. Light dust after decorating is different from heavy post-construction cleaning, paint marks, rubble or specialist cleaning needs.",
  "priceTitle": "After builders cleaning guide price",
  "priceRange": "from £100+",
  "priceNotes": [
    "Heavy dust or residue can increase the final quote.",
    "Specialist stain, paint or rubble removal may not be included.",
    "Photos are useful before confirming the job."
  ],
  "cleaningTypes": [
    "Regular Domestic Cleaning",
    "Deep Cleaning",
    "End of Tenancy Cleaning",
    "Airbnb / Short-let Cleaning",
    "After Builders Cleaning"
  ],
  "faqs": [
    {
      "question": "Are Quickola cleaning prices final quotes?",
      "answer": "No. Quickola prices are guide ranges. Final prices depend on property size, condition, access, extras, urgency and availability."
    },
    {
      "question": "Is Quickola available across Slough?",
      "answer": "Quickola is starting with cleaning requests across Slough and nearby SL postcodes. Availability may be limited during the early launch."
    },
    {
      "question": "Does Quickola sell paid ranking?",
      "answer": "No. Quickola is not built around selling top placement. Requests are intended to be handled based on fit, availability, price clarity and customer feedback."
    },
    {
      "question": "What should I confirm before booking a cleaner?",
      "answer": "Confirm the final price, what is included, arrival time, cancellation terms, whether products are included and whether extras such as oven or fridge cleaning cost more."
    }
  ],
  "canonical": "/after-builders-cleaning-slough",
  "area": "Slough"
} as const;

export const metadata: Metadata = {
  title: pageData.title,
  description: pageData.description,
  alternates: {
    canonical: pageData.canonical,
  },
  openGraph: {
    title: pageData.title,
    description: pageData.description,
    url: pageData.canonical,
    siteName: "Quickola",
    type: "website",
  },
};

export default function Page() {
  return <CleaningSeoPage {...pageData} />;
}
