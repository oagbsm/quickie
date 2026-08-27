import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Airbnb Cleaning Slough | Short-Let Turnover Cleaning",
  "description": "Need Airbnb or short-let cleaning in Slough? Check fair guide prices for guest turnover cleans, reset cleaning and local availability.",
  "h1": "Airbnb and short-let cleaning in Slough",
  "intro": "Airbnb and short-let cleaning is usually about fast, reliable guest turnover. Quickola helps hosts book professional cleaning in Slough before booking.",
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
  "canonical": "/airbnb-cleaning-slough",
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
