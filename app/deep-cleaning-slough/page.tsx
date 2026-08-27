import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Deep Cleaning in Slough | Book Online",
  "description": "Need a deep clean in Slough? Get an instant time-based price and book directly with Quickola. Property size, condition, access and extras can affect the final quote.",
  "h1": "Deep cleaning in Slough",
  "intro": "Deep cleaning is usually more detailed than a regular clean. Quickola helps you book deep cleaning in Slough directly with Quickola.",
  "localNote": "Deep cleaning requests in Slough may include kitchens, bathrooms, skirting boards, limescale, dust build-up, internal surfaces and areas that are not cleaned every week. The condition of the property matters a lot.",
  "priceTitle": "Deep cleaning guide price",
  "priceRange": "from £80+",
  "priceNotes": [
    "Deep cleans usually take longer than regular cleans.",
    "Heavy limescale, grease, dust or pet hair can increase the quote.",
    "Extras such as oven, fridge or inside cupboards should be confirmed first."
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
  "canonical": "/deep-cleaning-slough",
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
