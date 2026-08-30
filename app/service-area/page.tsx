import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/homepagecomponents/Header";
import Footer from "@/app/components/Footer";
export const metadata: Metadata = {
  title: "Quickola service area | Slough",
  description:
    "Quickola is currently focused on connecting customers and independent service providers in and around Slough.",
  alternates: { canonical: "/service-area" },
};
export default function Page() {
  return (
    <div className="min-h-screen bg-white text-[#071638]">
      <Header />
      <main id="main-content">
        <section className="bg-[#071a3b] px-5 py-18 text-white sm:px-8">
          <div className="mx-auto max-w-[1050px]">
            <p className="eyebrow !text-[#66dd78]">Service area</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-[-.05em] sm:text-6xl">
              Local service jobs focused on Slough.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Quickola is currently focused on customers and independent
              providers in and around Slough who want a clearer way to arrange
              local service work.
            </p>
          </div>
        </section>
        <section className="px-5 py-18 sm:px-8">
          <div className="mx-auto grid max-w-[1050px] gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Before work is confirmed</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.04em]">
                Every enquiry is checked for fit.
              </h2>
            </div>
            <div className="grid gap-5 text-[#526078]">
              <p>
                We use the main postcode and job details to keep the marketplace
                focused on the areas currently being launched.
              </p>
              <p>
                Availability depends on the current local launch and the
                independent providers available for the requested service.
              </p>
              <p>
                Quickola does not advertise nationwide coverage; availability
                remains intentionally local while the marketplace launches.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-[#f2f5f3] px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-[1050px]">
            <h2 className="text-3xl font-black">
              Operating in or around Slough?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#526078]">
              Tell us the postcode and service you need. We will show the
              marketplace options currently available for your area.
            </p>
            <Link href="/create-account" className="button-primary mt-6 px-6">
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
