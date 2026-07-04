import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Cleaners in Slough | Check Fair Cleaning Prices",
  "description": "Need a cleaner in Slough? Check fair prices for regular cleaning, deep cleaning, end-of-tenancy, Airbnb and after-builders cleaning before booking.",
  "h1": "Cleaners in Slough",
  "intro": "Need a cleaner in Slough? Quickola helps you check a fair local cleaning price before booking. We are starting with cleaning requests across Slough and nearby SL postcodes.",
  "localNote": "Slough cleaning requests can include regular domestic cleans, deep cleans, rental move-outs, short-let turnovers and after-builders cleans. The final price can depend on property size, condition, access, parking, extras and availability.",
  "priceTitle": "Typical Slough cleaning guide prices",
  "priceRange": "from £35+",
  "priceNotes": [
    "Regular cleans are usually priced by time and frequency.",
    "Deep cleans and end-of-tenancy cleans usually cost more because they take longer.",
    "Short-notice and heavily soiled properties may increase the final quote."
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
  "canonical": "/cleaners-slough",
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
