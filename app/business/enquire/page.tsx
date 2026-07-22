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
    <main className="min-h-screen bg-[#f3f6f8] text-[#071638]">
      <PublicHeader />
      <section className="px-5 py-12 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-8">
            <p className="text-sm font-black uppercase tracking-[.14em] text-[#079448]">
              Controlled access · Slough
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-.04em]">
              Request access to managed business cleaning.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#657089]">
              Tell us about your portfolio, premises or turnover operation. We
              will review service coverage and the practical requirements before
              inviting suitable organisations to a business account. Public
              self-registration is not open.
            </p>
            <ul className="mt-7 grid gap-4 text-sm font-bold">
              <li>✓ Service-area and operational review</li>
              <li>✓ Central property and booking visibility</li>
              <li>✓ No cleaner marketplace or contractor hand-off</li>
            </ul>
            <p className="mt-8 text-sm text-[#657089]">
              Already have an account?{" "}
              <Link
                href="/business/sign-in"
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
