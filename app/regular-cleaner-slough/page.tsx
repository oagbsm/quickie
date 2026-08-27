import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Regular Cleaner in Slough | Weekly & Fortnightly Cleaning",
  "description": "Book professional regular domestic cleaning in Slough. Weekly, fortnightly and one-off cleaner requests across nearby SL postcodes.",
  "h1": "Regular cleaner in Slough",
  "intro": "Book regular domestic cleaning in Slough directly with Quickola. Choose weekly, fortnightly or one-off cleaning and see your time-based price online.",
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
  "canonical": "/regular-cleaner-slough",
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
