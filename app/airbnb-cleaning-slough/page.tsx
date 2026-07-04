import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Airbnb Cleaning Slough | Short-Let Turnover Cleaning",
  "description": "Need Airbnb or short-let cleaning in Slough? Check fair guide prices for guest turnover cleans, reset cleaning and local availability.",
  "h1": "Airbnb and short-let cleaning in Slough",
  "intro": "Airbnb and short-let cleaning is usually about fast, reliable guest turnover. Quickola helps hosts check fair local cleaning prices in Slough before booking.",
  "localNote": "Short-let turnover cleaning may include cleaning, bed changes, bathroom reset, kitchen reset, rubbish removal and reporting obvious issues. Timing and reliability are often more important than the cheapest price.",
  "priceTitle": "Airbnb turnover cleaning guide price",
  "priceRange": "from £45+",
  "priceNotes": [
    "Guest turnover cleans may need fixed time windows.",
    "Laundry, linen and restocking may cost extra.",
    "Same-day guest changeovers can affect availability and price."
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
  "canonical": "/airbnb-cleaning-slough",
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
