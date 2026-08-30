import type { Metadata } from "next";
import Link from "next/link";
import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";
export const metadata: Metadata = {
  title: "Business cleaning pricing | Quickola",
  description:
    "How Quickola presents marketplace estimates and provider offers for local service jobs.",
};
export default function Page() {
  return (
    <main className="min-h-screen bg-white text-[#071638]">
      <Header />
      <section className="bg-[#061a3d] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#4bd35f]">
            Marketplace pricing
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-[-.05em] sm:text-6xl">
            A clear estimate, then an operational confirmation.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Estimates use the details supplied for a job. Independent providers
            then decide whether to send an offer and what price and availability
            they can provide.
          </p>
        </div>
      </section>
      <section className="px-5 py-18 sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              [
                "Service estimates",
                "Where available, customers see an estimate based on the job details before posting.",
              ],
              [
                "Provider offers",
                "Providers review the brief and may send their own price, timing and message.",
              ],
              [
                "Clear confirmation",
                "The relevant price and payment details are shown before a supported booking is confirmed.",
              ],
            ].map(([h, p]) => (
              <article key={h} className="border-t pt-5">
                <h2 className="text-xl font-black">{h}</h2>
                <p className="mt-3 leading-7 text-[#657089]">{p}</p>
              </article>
            ))}
          </div>
          <Link
            href="/create-account"
            className="mt-12 inline-flex rounded-xl bg-[#079448] px-6 py-4 font-black text-white"
          >
            Post a local service job
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
