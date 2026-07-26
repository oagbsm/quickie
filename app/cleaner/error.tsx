"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border bg-white p-6">
      <p className="text-sm font-extrabold text-red-700">COULDN’T LOAD TURNOVERS</p>
      <h1 className="mt-2 text-2xl font-extrabold">Your work list is temporarily unavailable.</h1>
      <p className="mt-3 text-[#657089]">Check your connection and try again. No checklist or evidence records were changed.</p>
      <button onClick={reset} className="mt-5 min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
        Try again
      </button>
    </section>
  );
}
