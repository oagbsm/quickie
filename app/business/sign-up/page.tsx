import type { Metadata } from "next";
import PublicHeader from "../components/PublicHeader";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your business account | Quickola",
  description:
    "Create a Quickola business account, add properties and manage cleaning requests.",
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
            Start managing your cleaning today.
          </h2>
          <p className="public-body-lg public-muted mt-5">
            Create your account, add your first property and enter the
            dashboard. No sales call or administrator invitation is required.
          </p>
          <ul className="mt-7 grid gap-3 text-sm font-semibold">
            <li>✓ Add and organise properties</li>
            <li>✓ Request cleans in supported postcodes</li>
            <li>✓ Track every booking from one place</li>
          </ul>
          <p className="public-note mt-7">
            Quickola confirms availability, timing and final pricing before a
            cleaning appointment is confirmed.
          </p>
        </section>
        <SignUpForm />
      </main>
    </div>
  );
}
