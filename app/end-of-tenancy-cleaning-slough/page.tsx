import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "End of Tenancy Cleaning Slough | Fair Price Guide",
  "description": "Check fair local prices for end-of-tenancy cleaning in Slough before booking. Compare guide ranges for flats, houses and move-out cleans.",
  "h1": "End-of-tenancy cleaning in Slough",
  "intro": "End-of-tenancy cleaning usually needs more detail than a normal clean because landlords or agents may check the property after the tenant leaves. Quickola helps you check a fair local price range before booking.",
  "localNote": "End-of-tenancy cleaning in Slough can vary depending on property size, whether the property is furnished, oven cleaning, cupboards, fridge cleaning, parking, access and how soon the clean is needed.",
  "priceTitle": "End-of-tenancy cleaning guide price",
  "priceRange": "from £120+",
  "priceNotes": [
    "Move-out cleans often cost more than regular cleaning.",
    "Oven, fridge and inside cupboard cleaning may be charged as extras.",
    "Furnished or heavily used properties can take longer."
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
  "canonical": "/end-of-tenancy-cleaning-slough",
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
