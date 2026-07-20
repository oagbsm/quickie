import type { Metadata } from "next";
import CleaningSeoPage from "../components/CleaningSeoPage";

const pageData = {
  "title": "After Builders Cleaning Slough | Professional Cleaning",
  "description": "Book professional after-builders cleaning in Slough. Dust, condition, property size and access can affect the final cleaning quote.",
  "h1": "After builders cleaning in Slough",
  "intro": "After-builders cleaning can involve dust, plaster residue, surface wiping, floors, bathrooms, kitchens and window ledges after building or decorating work. Quickola helps you check a fair local guide price before booking.",
  "localNote": "After-builders cleans in Slough can vary a lot. Light dust after decorating is different from heavy post-construction cleaning, paint marks, rubble or specialist cleaning needs.",
  "priceTitle": "After builders cleaning guide price",
  "priceRange": "from £100+",
  "priceNotes": [
    "Heavy dust or residue can increase the final quote.",
    "Specialist stain, paint or rubble removal may not be included.",
    "Photos are useful before confirming the job."
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
  "canonical": "/after-builders-cleaning-slough",
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
