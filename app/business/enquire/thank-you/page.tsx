import Link from "next/link";
import PublicHeader from "@/app/business/components/PublicHeader";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  return (
    <main className="min-h-screen bg-[#f3f6f8] text-[#071638]">
      <PublicHeader />
      <section className="grid min-h-[75vh] place-items-center p-5">
        <div className="max-w-xl rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#eaf7ef] text-2xl font-black text-[#079448]">
            ✓
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[.14em] text-[#079448]">
            Enquiry received
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Thank you. We have received your cleaning enquiry.
          </h1>
          <p className="mt-5 leading-7 text-[#657089]">
            Quickola will review your requirements and contact you regarding
            coverage and the next step. No cleaning service has been confirmed
            yet.
          </p>
          {reference && (
            <p className="mt-5 rounded-xl bg-[#f4f6f9] p-4 text-sm font-bold">
              Reference: ENQ-{reference}
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-xl bg-[#079448] px-5 py-3 text-center font-black text-white"
            >
              Return home
            </Link>
            <Link
              href="/business/sign-in"
              className="rounded-xl border px-5 py-3 text-center font-black"
            >
              Business login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
