import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/homepagecomponents/Header";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "How Quickola managed cleaning works",
  description:
    "Learn how businesses add properties, request cleans, receive managed cleaner assignment and track completion in Slough.",
  alternates: { canonical: "/how-it-works" },
};
const steps = [
  [
    "01",
    "Add your properties",
    "Save addresses, property details and access instructions.",
  ],
  [
    "02",
    "Request a clean",
    "Choose the property, service, date and frequency.",
  ],
  [
    "03",
    "Quickola arranges the service",
    "We review the request, then assign and manage the cleaner for the booking.",
  ],
  [
    "04",
    "Follow the progress",
    "Track the booking from receipt through confirmation and completion.",
  ],
];

export default function Page() {
  return (
    <div className="public-shell">
      <Header />
      <main id="main-content">
        <section className="public-hero">
          <div className="public-container">
            <p className="eyebrow !text-[#67dc79]">How it works</p>
            <h1 className="public-page-title mt-5 max-w-[780px]">
              One clear process from property details to a completed clean.
            </h1>
            <p className="public-body-lg mt-6 max-w-[650px] text-white/75">
              You organise the property and request. Quickola reviews the
              requirements, coordinates the cleaner and keeps the booking status
              visible.
            </p>
          </div>
        </section>
        <section className="public-section">
          <ol className="public-container">
            {steps.map(([number, title, copy]) => (
              <li
                key={number}
                className="grid gap-4 border-t border-[#cdd8d2] py-8 sm:grid-cols-[5rem_1fr] lg:grid-cols-[5rem_.8fr_1.2fr] lg:items-start"
              >
                <span className="text-sm font-extrabold tracking-[.12em] text-[#08783f]">
                  {number}
                </span>
                <h2 className="public-card-title">{title}</h2>
                <p className="public-body public-muted max-w-[560px]">{copy}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="bg-[#eaf4ed] py-12">
          <div className="public-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[clamp(1.65rem,3vw,2.1rem)] font-extrabold tracking-[-.03em]">
                What happens after an enquiry?
              </h2>
              <p className="public-body public-muted mt-2 max-w-[650px]">
                We review your locations, requirements and preferred schedule,
                then contact you about service coverage and the next step.
              </p>
            </div>
            <Link
              href="/business/enquire"
              className="public-button public-button-primary shrink-0"
            >
              Request business access
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
