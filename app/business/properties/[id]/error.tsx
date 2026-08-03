"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl rounded-xl border bg-white p-7">
      <p className="text-sm font-extrabold text-red-700">SOMETHING WENT WRONG</p>
      <h1 className="mt-2 text-2xl font-extrabold">We couldn’t load this property. Try again, or return to Properties.</h1>
      <p className="mt-3 text-[#657089]">Your saved records have not been changed.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={reset} className="min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
          Try again
        </button>
        <Link href="/business/properties" className="inline-flex min-h-12 items-center rounded-lg border px-5 font-extrabold">
          Return to Properties
        </Link>
      </div>
    </main>
  );
}
