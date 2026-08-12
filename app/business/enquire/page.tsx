import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/app/business/components/PublicHeader";
import Footer from "@/app/components/Footer";
import BusinessEnquiryForm from "./BusinessEnquiryForm";
export const metadata: Metadata = {
  title: "Request business access | Quickola",
  description:
    "Discuss managed cleaning for properties, offices and commercial premises in the Slough area.",
  alternates: { canonical: "/business/enquire" },
};
export default function Page() {
  return (
    <main className="public-shell min-h-screen bg-[#f4f7f5]">
      <PublicHeader />
      <section id="main-content" className="px-5 py-12 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-8">
            <p className="eyebrow">Business access · Slough</p>
            <h1 className="public-page-title mt-4">
              Tell us what you need cleaned.
            </h1>
            <p className="public-body-lg public-muted mt-5">
              Share a few details about your properties or premises. We’ll
              review coverage and requirements, then contact you about the next
              step.
            </p>
            <ul className="mt-7 grid gap-4 text-[.9375rem] font-semibold">
              <li>✓ Managed by Quickola</li>
              <li>✓ Property and booking visibility</li>
              <li>✓ UK-based support</li>
            </ul>
            <p className="mt-8 text-sm text-[#657089]">
              Already have an account?{" "}
              <Link
                href="/auth/portal/sign-in"
                className="font-black text-[#079448]"
              >
                Business login
              </Link>
            </p>
          </div>
          <BusinessEnquiryForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
