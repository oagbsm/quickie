import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "End of Tenancy Cleaning Slough | Professional Cleaning",
  "description": "Book professional end-of-tenancy cleaning in Slough before booking. Quickola provides flats, houses and move-out cleans.",
  "h1": "End-of-tenancy cleaning in Slough",
  "intro": "End-of-tenancy cleaning usually needs more detail than a normal clean because landlords or agents may check the property after the tenant leaves. Quickola lets you calculate the required time and book directly online.",
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
