import type { Metadata } from "next";
import PublicHeader from "../components/PublicHeader";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your STR operator account | Quickola",
  description:
    "Create a Quickola account, add STR properties and coordinate turnovers with the cleaners you already use.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f3f6f8]">
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto grid max-w-[1080px] gap-10 px-5 py-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:py-16"
      >
        <section className="pt-3">
          <p className="eyebrow">Get started</p>
          <h2 className="public-page-title mt-4">
            Start with one property and a clear turnover standard.
          </h2>
          <p className="public-body-lg public-muted mt-5">
            Create your account, define what guest-ready means for your
            property, then invite the cleaner or contractor you already use.
          </p>
          <ul className="mt-7 grid gap-3 text-sm font-semibold">
            <li>✓ Save property-specific turnover standards</li>
            <li>✓ Assign your own cleaner or contractor</li>
            <li>✓ Require checklists and completion evidence</li>
          </ul>
          <p className="public-note mt-7">
            Quickola does not supply cleaners or handle cleaning rates,
            invoices or payments.
          </p>
        </section>
        <SignUpForm />
      </main>
    </div>
  );
}
