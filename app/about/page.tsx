import type { Metadata } from "next";
import Link from "next/link";
import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";
export const metadata: Metadata = {
  title: "About Quickola | STR turnover coordination",
  description:
    "Quickola coordinates STR turnover workflows for operators using their own cleaners in the Slough area.",
};
export default function Page() {
  return (
    <main className="min-h-screen bg-white text-[#071638]">
      <Header />
      <section className="bg-[#061a3d] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#4bd35f]">
            About Quickola
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-[-.05em] sm:text-6xl">
            Cleaning operations should not depend on scattered messages.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Quickola is turnover coordination software for operators managing
            short-term-rental properties. The controlled pilot begins in Slough.
          </p>
        </div>
      </section>
      <section className="px-5 py-18 sm:px-8">
        <div className="mx-auto grid max-w-[1080px] gap-10 lg:grid-cols-3">
          {[
            [
              "One clear workflow",
              "Bring your bookings, properties and existing cleaners into one place without rebuilding every brief in a message thread.",
            ],
            [
              "Clear requested and confirmed states",
              "A requested time is not presented as confirmed until availability has actually been reviewed.",
            ],
            [
              "A focused operations platform",
              "The account keeps properties, turnovers, checklists and readiness evidence together without pretending to be a general property CRM.",
            ],
          ].map(([h, p]) => (
            <article key={h} className="border-t-2 border-[#071638] pt-5">
              <h2 className="text-xl font-black">{h}</h2>
              <p className="mt-3 leading-7 text-[#657089]">{p}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-[1080px]">
          <Link
            href="/business/sign-up"
            className="inline-flex rounded-xl bg-[#079448] px-6 py-4 font-black text-white"
          >
            Create account
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
