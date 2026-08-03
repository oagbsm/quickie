import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/homepagecomponents/Header";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "How Quickola STR turnover coordination works",
  description:
    "Learn how STR operators add properties, connect calendars, invite their cleaners and track every turnover to property ready.",
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
    "Connect your booking calendar",
    "Let each booking create the right turnover workflow around checkout and guest arrival.",
  ],
  [
    "03",
    "Add and assign your cleaner",
    "Invite your existing cleaner, assign the work and keep the responsibility with your team.",
  ],
  [
    "04",
    "Track the clean to property ready",
    "Follow the checklist, evidence and issues from checkout through a ready property.",
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
              Bring your existing cleaners into one workflow. Quickola creates
              the turnover steps from your bookings and keeps progress visible
              through property ready.
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
                What happens after setup?
              </h2>
              <p className="public-body public-muted mt-2 max-w-[650px]">
                Add your properties, connect a calendar and invite your cleaners.
                From there, Quickola keeps each turnover organised from checkout
                to property ready.
              </p>
            </div>
            <Link
              href="/business/sign-up"
              className="public-button public-button-primary shrink-0"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
