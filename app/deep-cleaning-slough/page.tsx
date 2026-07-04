import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "Deep Cleaning in Slough | Check Fair Local Prices",
  "description": "Need a deep clean in Slough? Check fair local guide prices before booking. Property size, condition, access and extras can affect the final quote.",
  "h1": "Deep cleaning in Slough",
  "intro": "Deep cleaning is usually more detailed than a regular clean. Quickola helps you check a fair local guide price for deep cleaning in Slough before booking.",
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
  "canonical": "/deep-cleaning-slough",
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
