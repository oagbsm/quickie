import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Regular Cleaner in Slough | Weekly & Fortnightly Cleaning",
  "description": "Check fair local prices for regular domestic cleaning in Slough. Weekly, fortnightly and one-off cleaner requests across nearby SL postcodes.",
  "h1": "Regular cleaner in Slough",
  "intro": "Quickola helps you check a fair local price for regular domestic cleaning in Slough before booking. Regular cleaning is usually best for weekly, fortnightly or one-off maintenance cleans.",
  "localNote": "Regular cleaning in Slough is often used by busy households, shared homes, families and people who want help keeping the property maintained. Frequency, rooms, bathrooms and whether products are supplied can affect the price.",
  "priceTitle": "Regular cleaning guide price",
  "priceRange": "from £35+",
  "priceNotes": [
    "Weekly or fortnightly cleans may be cheaper per visit than one-off cleans.",
    "More bedrooms, bathrooms and heavy build-up can increase time needed.",
    "Customer-supplied products may affect the final arrangement."
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
  "canonical": "/regular-cleaner-slough",
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
