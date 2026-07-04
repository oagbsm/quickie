import type { Metadata } from "next";
import CleaningSeoPage from "../../../components/CleaningSeoPage";

const pageData = {
  "title": "Cleaner in Farnham Royal | Fair Cleaning Prices",
  "description": "Looking for a cleaner in Farnham Royal? Check fair local cleaning prices for regular cleans, deep cleans, end-of-tenancy and more before booking.",
  "h1": "Cleaner in Farnham Royal",
  "intro": "Looking for a cleaner in Farnham Royal? Quickola helps local residents check fair cleaning prices before booking. We are currently focused on cleaning requests in Slough and nearby SL postcodes.",
  "localNote": "Farnham Royal cleaning requests may include larger homes, regular cleaning, deep cleans and move-out cleans. Property size, condition, access and extras can affect the final quote.",
  "priceTitle": "Farnham Royal cleaner guide price",
  "priceRange": "from £35+",
  "priceNotes": [
    "Regular cleans are usually priced by time and frequency.",
    "Deep cleans and end-of-tenancy cleans usually depend on property condition.",
    "Parking, access, urgency and extras can affect the final quote."
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
  "canonical": "/slough/farnham-royal/cleaner",
  "area": "Farnham Royal"
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
