import Link from "next/link";
import Header from "./homepagecomponents/Header";
import Footer from "./components/Footer";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#071638]">
      <Header />
      <main
        id="main-content"
        className="grid min-h-[65vh] place-items-center px-5 py-16"
      >
        <section className="max-w-2xl text-center">
          <p className="eyebrow">Page not found</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-.05em] sm:text-6xl">
            That page is not here.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#526078]">
            Return to Quickola or create your
            business account.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="button-primary px-6">
              Return home
            </Link>
            <Link
              href="/business/sign-up"
              className="inline-flex min-h-11 items-center justify-center rounded-[.65rem] border border-[#b9c5cc] px-6 font-black"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
