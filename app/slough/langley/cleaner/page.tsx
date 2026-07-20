import type { Metadata } from "next";
import CleaningSeoPage from "../../../components/CleaningSeoPage";

const pageData = {
  "title": "Cleaner in Langley | Professional Cleaning",
  "description": "Looking for a cleaner in Langley? Check fair local cleaning prices for regular cleans, deep cleans, end-of-tenancy and more before booking.",
  "h1": "Cleaner in Langley",
  "intro": "Looking for a cleaner in Langley? Quickola helps local residents book directly with Quickola. We are currently focused on cleaning requests in Slough and nearby SL postcodes.",
  "localNote": "Langley cleaning requests may include flats near the station, family homes, rental move-outs and short-let turnovers. Regular cleans are usually priced by time, while deep and end-of-tenancy cleans depend more on condition.",
  "priceTitle": "Langley cleaner guide price",
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
      "answer": "No. Quickola calculates your visit price from property size, condition and selected extras."
    },
    {
      "question": "Is Quickola available across Slough?",
      "answer": "Quickola provides online cleaning booking across supported Slough and nearby SL postcodes."
    },
    {
      "question": "Who manages my cleaning booking?",
      "answer": "Your booking is with Quickola, which manages the customer experience and service quality."
    },
    {
      "question": "What should I confirm before booking a cleaner?",
      "answer": "Confirm the final price, what is included, arrival time, cancellation terms, whether extras such as oven or fridge cleaning cost more."
    }
  ],
  "canonical": "/slough/langley/cleaner",
  "area": "Langley"
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
