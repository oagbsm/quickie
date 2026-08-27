import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Cleaners in Slough | Professional Cleaning",
  "description": "Book domestic, deep, end-of-tenancy, Airbnb and after-builders cleaning in Slough with transparent time-based pricing.",
  "h1": "Cleaners in Slough",
  "intro": "Need a cleaner in Slough? Quickola helps you book professional cleaning directly. We are starting with cleaning requests across Slough and nearby SL postcodes.",
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
      "answer": "No. Quickola calculates your visit price from recommended cleaning time, property condition, access and selected extras."
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
  "canonical": "/cleaners-slough",
  "area": "Slough"
} as const;

export const metadata: Metadata = {
  title: pageData.title,
  description: pageData.description,
  robots: { index: false, follow: true },
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
