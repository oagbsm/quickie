import type { Metadata } from "next";
import Link from "next/link";
import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";
export const metadata: Metadata = {
  title: "Business cleaning pricing | Quickola",
  description:
    "How Quickola prepares and confirms managed-cleaning prices for business properties and premises.",
};
export default function Page() {
  return (
    <main className="min-h-screen bg-white text-[#071638]">
      <Header />
      <section className="bg-[#061a3d] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#4bd35f]">
            Business cleaning pricing
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-[-.05em] sm:text-6xl">
            A clear estimate, then an operational confirmation.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Pricing considers the property, service, expected duration,
            frequency and selected extras. Larger or unusual requirements are
            reviewed manually.
          </p>
        </div>
      </section>
      <section className="px-5 py-18 sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              [
                "Standard property cleans",
                "Approved account customers see a versioned estimate before submitting a request.",
              ],
              [
                "Exceptional requirements",
                "Large, specialist or unclear work receives an estimated range and manual review.",
              ],
              [
                "No silent price change",
                "A different final price must be confirmed and explained before work proceeds.",
              ],
            ].map(([h, p]) => (
              <article key={h} className="border-t pt-5">
                <h2 className="text-xl font-black">{h}</h2>
                <p className="mt-3 leading-7 text-[#657089]">{p}</p>
              </article>
            ))}
          </div>
          <Link
            href="/business/enquire"
            className="mt-12 inline-flex rounded-xl bg-[#079448] px-6 py-4 font-black text-white"
          >
            Request business cleaning
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
