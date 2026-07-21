import Link from "next/link";
import Header from "../homepagecomponents/Header";
import Footer from "../components/Footer";
export const metadata = { title: "Cookies | Quickola" };
export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4f6f9] text-[#071638]">
      <Header />
      <article className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-black">Cookie information</h1>
        <p className="mt-5 leading-7 text-[#657089]">
          Quickola uses essential cookies to maintain secure sessions, protect
          authenticated business and admin areas, and preserve the operation of
          account sign-in. These cookies are required for the service to
          function.
        </p>
        <p className="mt-4 leading-7 text-[#657089]">
          Quickola does not currently use advertising cookies on this website.
          If optional analytics or other non-essential cookies are introduced,
          the applicable notice and consent controls must be provided before
          they are enabled.
        </p>
        <p className="mt-6">
          <Link href="/privacy-policy" className="font-black text-[#08783f]">
            Read the Privacy Policy
          </Link>
        </p>
      </article>
      <Footer />
    </main>
  );
}
