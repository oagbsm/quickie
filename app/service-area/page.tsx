import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/homepagecomponents/Header";
import Footer from "@/app/components/Footer";
export const metadata: Metadata = {
  title: "Quickola STR turnover coordination pilot | Slough",
  description:
    "Quickola is piloting STR turnover coordination software in Slough for operators using their own cleaners.",
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
              STR turnover coordination focused on Slough.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Quickola is currently focused on operators in and around Slough
              who want to coordinate their own properties, bookings and
              cleaners in one workflow.
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
                We review the main postcode, property type, booking workflow and
                operational requirements so the software is a good fit.
              </p>
              <p>
                A submitted enquiry is not an accepted account. Access to the
                pilot depends on the operator, properties and workflow being a
                suitable fit.
              </p>
              <p>
                Quickola does not advertise nationwide coverage and does not
                offer public household one-off cleaning.
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
              Tell us the primary postcode and the properties you manage. We
              will assess whether the current software pilot is a suitable fit.
            </p>
            <Link href="/business/sign-up" className="button-primary mt-6 px-6">
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
